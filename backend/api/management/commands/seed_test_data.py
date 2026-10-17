import os
from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from api.models import ProfessionalAvailability, Profile, Service


TEST_PASSWORD = "Skilly#2026"


class Command(BaseCommand):
    help = "Crea datos ficticios idempotentes para el plan QA de Skilly."

    def handle(self, *args, **options):
        database_name = str(connection.settings_dict.get("NAME", ""))
        if "test" not in database_name.lower():
            raise CommandError(
                "Por seguridad, este comando solo funciona en una base cuyo "
                "nombre contenga 'test'. Base configurada: "
                f"{database_name or '(sin nombre)'}."
            )

        admin_password = os.environ.get("SKILLY_TEST_ADMIN_PASSWORD", "")
        if len(admin_password) < 12:
            raise CommandError(
                "Define SKILLY_TEST_ADMIN_PASSWORD con al menos 12 caracteres."
            )

        User = get_user_model()
        with transaction.atomic():
            admin = self.ensure_user(
                User,
                username="admin.pruebas",
                email="admin.pruebas@prueba.skilly.test",
                full_name="Administración de pruebas",
                password=admin_password,
                is_staff=True,
                is_superuser=False,
                is_active=True,
            )

            ana = self.ensure_user(
                User,
                username="ana.perez",
                email="ana.perez@prueba.skilly.test",
                full_name="Ana Pérez",
                password=TEST_PASSWORD,
            )
            luis = self.ensure_user(
                User,
                username="luis.rojas",
                email="luis.rojas@prueba.skilly.test",
                full_name="Luis Rojas",
                password=TEST_PASSWORD,
            )
            paula = self.ensure_user(
                User,
                username="paula.diaz",
                email="paula.diaz@prueba.skilly.test",
                full_name="Paula Díaz",
                password=TEST_PASSWORD,
                is_active=False,
            )

            org_a = self.ensure_user(
                User,
                username="organizacion.a",
                email="organizacion.a@prueba.skilly.test",
                full_name="Organización A",
                password=TEST_PASSWORD,
            )
            org_b = self.ensure_user(
                User,
                username="organizacion.b",
                email="organizacion.b@prueba.skilly.test",
                full_name="Organización B",
                password=TEST_PASSWORD,
            )

            for user in (ana, luis, org_a, org_b):
                self.ensure_profile(user, role="organization")

            pending_user = self.ensure_user(
                User,
                username="carla.soto",
                email="carla.soto@prueba.skilly.test",
                full_name="Carla Soto",
                password=TEST_PASSWORD,
            )
            self.ensure_profile(
                pending_user,
                role="professional",
                profession="Diseño UX",
                location="Santiago",
                validated=False,
            )

            professionals = [
                {
                    "username": "profesional.p1",
                    "email": "p1@prueba.skilly.test",
                    "full_name": "Matías Román",
                    "profession": "Desarrollo de software",
                    "location": "Santiago",
                    "category": "Desarrollo",
                    "modality": "Remoto",
                    "service": "Desarrollo web",
                    "active": True,
                },
                {
                    "username": "profesional.diseno",
                    "email": "diseno@prueba.skilly.test",
                    "full_name": "María López",
                    "profession": "Diseño UX",
                    "location": "Valparaíso",
                    "category": "Diseño",
                    "modality": "Híbrido",
                    "service": "Diseño de interfaces",
                    "active": True,
                },
                {
                    "username": "profesional.marketing",
                    "email": "marketing@prueba.skilly.test",
                    "full_name": "Sofía Torres",
                    "profession": "Marketing digital",
                    "location": "Santiago",
                    "category": "Marketing",
                    "modality": "Presencial",
                    "service": "Estrategia digital",
                    "active": True,
                },
                {
                    "username": "profesional.pausado",
                    "email": "pausado@prueba.skilly.test",
                    "full_name": "Roberto Silva",
                    "profession": "Desarrollo de software",
                    "location": "Santiago",
                    "category": "Desarrollo",
                    "modality": "Remoto",
                    "service": "Soporte de software",
                    "active": False,
                },
            ]

            profiles = {}
            for item in professionals:
                user = self.ensure_user(
                    User,
                    username=item["username"],
                    email=item["email"],
                    full_name=item["full_name"],
                    password=TEST_PASSWORD,
                    is_active=item["active"],
                )
                profile = self.ensure_profile(
                    user,
                    role="professional",
                    profession=item["profession"],
                    location=item["location"],
                    validated=True,
                )
                service, _ = Service.objects.update_or_create(
                    professional=profile,
                    name=item["service"],
                    defaults={
                        "description": f"Servicio de prueba: {item['service']}.",
                        "category": item["category"],
                        "modality": item["modality"],
                        "location": item["location"],
                        "price": 25000,
                        "active": True,
                        "approved": True,
                    },
                )
                profiles[item["username"]] = (profile, service)

            pending_professional, _ = profiles["profesional.p1"]
            Service.objects.update_or_create(
                professional=pending_professional,
                name="Auditoría de accesibilidad web",
                defaults={
                    "description": "Servicio de prueba pendiente de aprobación.",
                    "category": "Desarrollo",
                    "modality": "Remoto",
                    "location": "Santiago",
                    "price": 18000,
                    "active": True,
                    "approved": False,
                },
            )

            professional, _ = profiles["profesional.p1"]
            tuesday = self.next_tuesday()
            ProfessionalAvailability.objects.update_or_create(
                professional=professional,
                day="martes",
                start_time=time(10, 0),
                defaults={"end_time": time(12, 0), "active": True},
            )

        self.stdout.write(self.style.SUCCESS("Datos de prueba listos."))
        self.stdout.write(f"Administrador: {admin.email}")
        self.stdout.write(f"Profesional P1: {profiles['profesional.p1'][0].full_name}")
        self.stdout.write(f"Bloque disponible CN-05: martes {tuesday:%d-%m-%Y}, 10:00-12:00")
        self.stdout.write("Las cuentas ficticias no administrativas usan la clave Skilly#2026.")
        self.stdout.write("El profesional P1 tiene disponibilidad activa para la prueba de agenda.")

    @staticmethod
    def ensure_user(
        User,
        *,
        username,
        email,
        full_name,
        password,
        is_staff=False,
        is_superuser=False,
        is_active=True,
    ):
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        user.email = email
        user.first_name, _, user.last_name = full_name.partition(" ")
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.is_active = is_active
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def ensure_profile(user, *, role, profession="", location="", validated=False):
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={
                "full_name": user.get_full_name() or user.username,
                "role": role,
            },
        )
        profile.full_name = user.get_full_name() or user.username
        profile.role = role
        profile.profession = profession
        profile.location = location
        profile.validated = validated
        profile.save()
        return profile

    @staticmethod
    def next_tuesday():
        today = date.today()
        days_ahead = (1 - today.weekday()) % 7 or 7
        return today + timedelta(days=days_ahead)
