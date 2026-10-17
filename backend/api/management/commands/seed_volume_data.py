from itertools import islice
from time import monotonic

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from api.models import ProfessionalAvailability, Profile


BATCH_SIZE = 2000
DAYS = ("lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo")


class Command(BaseCommand):
    help = "Agrega perfiles y bloques de disponibilidad para PR-03."

    def add_arguments(self, parser):
        parser.add_argument("--professionals", type=int, default=100_000)
        parser.add_argument("--availability-blocks", type=int, default=500_000)
        parser.add_argument("--confirm-volume", action="store_true")

    def handle(self, *args, **options):
        database_name = str(connection.settings_dict.get("NAME", ""))
        if "test" not in database_name.lower():
            raise CommandError(
                "Por seguridad, PR-03 solo puede poblar una base cuyo nombre "
                f"incluya 'test'. Base configurada: {database_name or '(sin nombre)'}."
            )
        if not options["confirm_volume"]:
            raise CommandError(
                "Esta operación puede insertar cientos de miles de filas. "
                "Repite el comando con --confirm-volume sobre la base de pruebas."
            )

        professional_count = options["professionals"]
        availability_count = options["availability_blocks"]
        if professional_count < 1 or availability_count < 0:
            raise CommandError("Las cantidades deben ser positivas o cero.")
        if availability_count > professional_count * len(DAYS):
            raise CommandError(
                f"No se pueden asociar más de {len(DAYS)} bloques por profesional."
            )

        User = get_user_model()
        prefix = "volumen-prof-"
        started = monotonic()
        existing_usernames = set(
            User.objects.filter(username__startswith=prefix)
            .values_list("username", flat=True)
        )
        users_to_create = [
            User(
                username=f"{prefix}{number:06d}",
                email=f"{prefix}{number:06d}@prueba.skilly.test",
                first_name="Profesional",
                last_name=f"Volumen {number:06d}",
                password="!",
            )
            for number in range(1, professional_count + 1)
            if f"{prefix}{number:06d}" not in existing_usernames
        ]

        with transaction.atomic():
            self.bulk_insert(User.objects, users_to_create)
            users = User.objects.filter(username__startswith=prefix).order_by("id")
            user_ids = list(users.values_list("id", flat=True))

            existing_profile_user_ids = set(
                Profile.objects.filter(user__username__startswith=prefix)
                .values_list("user_id", flat=True)
            )
            profiles_to_create = [
                Profile(
                    user_id=user_id,
                    full_name=f"Profesional Volumen {index + 1:06d}",
                    role="professional",
                    profession="Desarrollo de software",
                    bio="Perfil ficticio de prueba de volumen.",
                    location="Santiago",
                    validated=True,
                )
                for index, user_id in enumerate(user_ids)
                if user_id not in existing_profile_user_ids
            ]
            self.bulk_insert(Profile.objects, profiles_to_create)

            profile_ids = Profile.objects.filter(
                user__username__startswith=prefix
            ).order_by("user_id").values_list("id", flat=True)
            block_base, extra_blocks = divmod(availability_count, professional_count)
            current_block = 0
            for profile_batch in self.batches(profile_ids.iterator(chunk_size=BATCH_SIZE)):
                blocks = []
                for profile_id in profile_batch:
                    number_of_blocks = block_base + (current_block < extra_blocks)
                    current_block += 1
                    for day in DAYS[:number_of_blocks]:
                        blocks.append(
                            ProfessionalAvailability(
                                professional_id=profile_id,
                                day=day,
                                start_time="09:00",
                                end_time="17:00",
                                active=True,
                            )
                        )
                    if len(blocks) >= BATCH_SIZE:
                        ProfessionalAvailability.objects.bulk_create(
                            blocks,
                            batch_size=BATCH_SIZE,
                            ignore_conflicts=True,
                        )
                        blocks = []
                if blocks:
                    ProfessionalAvailability.objects.bulk_create(
                        blocks,
                        batch_size=BATCH_SIZE,
                        ignore_conflicts=True,
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"PR-03 listo: {len(user_ids)} usuarios profesionales y "
                f"{availability_count} bloques objetivo en {monotonic() - started:.1f} s."
            )
        )
        self.stdout.write("Los usuarios de volumen no tienen contraseña utilizable ni pueden iniciar sesión.")

    @staticmethod
    def bulk_insert(manager, objects):
        for batch in Command.batches(objects):
            manager.bulk_create(batch, batch_size=BATCH_SIZE, ignore_conflicts=True)

    @staticmethod
    def batches(items, size=BATCH_SIZE):
        iterator = iter(items)
        while batch := list(islice(iterator, size)):
            yield batch
