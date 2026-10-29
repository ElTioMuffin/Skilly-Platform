from django.contrib.auth import authenticate, get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core import signing
from django.core.signing import BadSignature
from django.db.models import Prefetch

from rest_framework import status, viewsets

from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)

from rest_framework.response import Response
from rest_framework.exceptions import NotAuthenticated, PermissionDenied

from rest_framework.permissions import (
    IsAdminUser,
)


def get_session_user_from_token(request):
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None

    try:
        user_id = signing.loads(
            authorization.removeprefix("Bearer "),
            salt="skilly.user.session",
            max_age=60 * 60 * 12,
        )
    except BadSignature:
        return None

    User = get_user_model()
    return User.objects.filter(pk=user_id, is_active=True).first()

from .models import (
    Profile,
    Service,
    ServiceRequest,
    Review,
    Appointment,
    Incident,
    ProfileChangeHistory,
    AppointmentChangeRequest,
    Refund,
    ProfessionalAvailability,
    PlatformNotification,
)

from .serializers import (
    ProfileSerializer,
    ServiceSerializer,
    ServiceRequestSerializer,
    ReviewSerializer,
    AppointmentSerializer,
    IncidentSerializer,
    ProfessionalAvailabilitySerializer,
    PlatformNotificationSerializer,
)


# =============================================================
# PROFILE
# =============================================================

class ProfileViewSet(viewsets.ModelViewSet):

    def get_queryset(self):
        available_services = Service.objects.filter(
            active=True,
            approved=True,
        ).order_by("-created_at")
        return (
            Profile.objects.filter(
                user__is_staff=False,
                role="professional",
                services__active=True,
                services__approved=True,
            )
            .distinct()
            .prefetch_related(
                Prefetch(
                    "services",
                    queryset=available_services,
                    to_attr="available_services",
                )
            )
        )

    serializer_class = ProfileSerializer


# =============================================================
# SERVICES
# =============================================================

class ServiceViewSet(viewsets.ModelViewSet):

    serializer_class = ServiceSerializer

    # ---------------------------------------------------------
    # LISTAR SERVICIOS
    # ---------------------------------------------------------

    def get_queryset(self):

        queryset = Service.objects.select_related("professional").prefetch_related(
            "professional__reviews_received"
        )

        professional_id = (
            self.request.query_params.get(
                "professional"
            )
        )

        if self.action == "list" and not professional_id:
            queryset = queryset.filter(
                active=True,
                approved=True,
                professional__role="professional",
                professional__user__is_active=True,
                professional__user__is_staff=False,
            )
        elif self.action in {"list", "update", "partial_update", "destroy"}:
            user = get_session_user_from_token(self.request)
            if not user:
                raise NotAuthenticated("Inicia sesión para gestionar tus servicios.")
            profile = getattr(user, "profile", None)
            if not profile or profile.role != "professional":
                raise PermissionDenied("Solo los profesionales pueden gestionar servicios.")
            if professional_id and str(professional_id) != str(profile.pk):
                raise PermissionDenied("Solo puedes ver o modificar tus propios servicios.")
            queryset = queryset.filter(professional=profile)
        else:
            queryset = queryset.filter(
                active=True,
                approved=True,
                professional__role="professional",
                professional__user__is_active=True,
                professional__user__is_staff=False,
            )

        return queryset.order_by(
            "-created_at"
        )

    # ---------------------------------------------------------
    # CREAR SERVICIO
    # ---------------------------------------------------------

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        user = get_session_user_from_token(request)
        if not user:
            raise NotAuthenticated("Inicia sesión como profesional para crear un servicio.")

        profile = getattr(user, "profile", None)
        if not profile or profile.role != "professional":
            raise PermissionDenied("Solo los profesionales pueden crear servicios.")

        professional_id = request.data.get("professional")
        if professional_id and str(professional_id) != str(profile.pk):
            raise PermissionDenied("No puedes crear servicios para otro profesional.")

        # -----------------------------------------------------
        # Validar datos del servicio
        # -----------------------------------------------------

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        # -----------------------------------------------------
        # Guardar servicio
        # -----------------------------------------------------

        serializer.save(
            professional=profile,
            approved=False,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    # ---------------------------------------------------------
    # ACTUALIZAR SERVICIO
    # ---------------------------------------------------------

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        partial = kwargs.pop(
            "partial",
            False
        )

        instance = self.get_object()

        profile = getattr(get_session_user_from_token(request), "profile", None)
        if not profile or profile.role != "professional":
            raise PermissionDenied("Solo los profesionales pueden modificar servicios.")

        # -----------------------------------------------------
        # Verificar propietario
        # -----------------------------------------------------

        if instance.professional_id != profile.pk:
            raise PermissionDenied("No puedes modificar servicios de otro profesional.")

        # -----------------------------------------------------
        # Actualizar
        # -----------------------------------------------------

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )

        serializer.is_valid(
            raise_exception=True
        )

        changed_listing_details = any(
            field in request.data
            for field in ("name", "description", "category", "modality", "location", "price")
        )
        serializer.save(
            professional=instance.professional
        )
        if changed_listing_details:
            instance.approved = False
            instance.save(update_fields=["approved", "updated_at"])
            serializer.instance.refresh_from_db()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # ELIMINAR SERVICIO
    # ---------------------------------------------------------

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        instance = self.get_object()

        professional_id = (
            request.query_params.get(
                "professional"
            )
        )

        # -----------------------------------------------------
        # Verificar propietario
        # -----------------------------------------------------

        if professional_id:

            if str(
                instance.professional_id
            ) != str(
                professional_id
            ):

                return Response(
                    {
                        "error":
                            "No puedes eliminar servicios de otro profesional."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -----------------------------------------------------
        # Eliminar
        # -----------------------------------------------------

        instance.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# =============================================================
# SERVICE REQUEST
# =============================================================

class ServiceRequestViewSet(
    viewsets.ModelViewSet
):

    queryset = ServiceRequest.objects.all()

    serializer_class = ServiceRequestSerializer

    def perform_create(self, serializer):
        service = serializer.validated_data.get("service")
        if service and (not service.active or not service.approved):
            from rest_framework.exceptions import ValidationError as APIValidationError
            raise APIValidationError({"service": "Este servicio no está disponible para solicitudes."})
        service_request = serializer.save()
        organization = getattr(service_request.client, "profile", None)
        organization_name = (
            organization.full_name if organization else service_request.client.username
        )
        service_name = service_request.service.name if service_request.service else "Servicio"
        proposed_schedule = "Sin horario propuesto"
        if service_request.requested_date:
            proposed_schedule = service_request.requested_date.strftime("%d-%m-%Y")
            if service_request.requested_time:
                proposed_schedule += f" a las {service_request.requested_time.strftime('%H:%M')}"

        PlatformNotification.objects.create(
            recipient=service_request.professional.user,
            service_request=service_request,
            title="Nueva solicitud de servicio",
            message=(
                f"{organization_name} solicitó {service_name}. "
                f"Horario propuesto: {proposed_schedule}."
            ),
            link=(
                f"/solicitudes/{service_request.professional_id}"
                f"?solicitud={service_request.id}"
            ),
        )

    def perform_update(self, serializer):
        service = serializer.validated_data.get("service")
        if service and (not service.active or not service.approved):
            from rest_framework.exceptions import ValidationError as APIValidationError
            raise APIValidationError({"service": "Este servicio no está disponible para solicitudes."})
        was_completed = serializer.instance.status == "Completada"
        service_request = serializer.save()
        if service_request.status == "Completada" and not was_completed:
            service_name = service_request.service.name if service_request.service else "el servicio"
            amount = (
                f" por ${service_request.budget:,.0f}"
                if service_request.budget is not None
                else ""
            )
            PlatformNotification.objects.create(
                recipient=service_request.client,
                service_request=service_request,
                title="Tu orden está lista para pagar",
                message=(
                    f"El profesional completó {service_name}{amount}. "
                    "Puedes realizar el pago desde tus solicitudes."
                ),
                link=f"/mis-solicitudes?solicitud={service_request.id}",
            )

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        service_request = self.get_object()
        if str(request.data.get("client")) != str(service_request.client_id):
            return Response({"error": "Solo la organización que creó la orden puede pagarla."}, status=status.HTTP_403_FORBIDDEN)
        if service_request.status != "Completada":
            return Response({"error": "La orden aún no está lista para pagar."}, status=status.HTTP_400_BAD_REQUEST)
        if service_request.payment_status == "Pagado":
            return Response({"payment_status": "Pagado", "success": True, "message": "Esta orden ya fue pagada."})

        outcomes = {
            "success": ("Pagado", "Pago realizado correctamente."),
            "failure": ("Fallido", "El pago fue rechazado. Puedes intentarlo nuevamente."),
            "insufficient_balance": ("Saldo insuficiente", "El saldo es insuficiente. Puedes elegir otro medio e intentarlo nuevamente."),
            "unknown_error": ("Error desconocido", "Ocurrió un error desconocido. Inténtalo nuevamente."),
        }
        outcome = outcomes.get(request.data.get("outcome"))
        if not outcome:
            return Response({"error": "Selecciona un resultado de pago válido."}, status=status.HTTP_400_BAD_REQUEST)

        payment_status, message = outcome
        service_request.payment_status = payment_status
        service_request.save(update_fields=["payment_status", "updated_at"])

        if payment_status == "Pagado":
            organization = getattr(service_request.client, "profile", None)
            organization_name = organization.full_name if organization else service_request.client.username
            service_name = service_request.service.name if service_request.service else "el servicio"
            amount = (
                f"${service_request.budget:,.0f}"
                if service_request.budget is not None
                else ""
            )
            PlatformNotification.objects.create(
                recipient=service_request.professional.user,
                service_request=service_request,
                title="Pago recibido",
                message=f"{organization_name} pagó {service_name}{f' ({amount})' if amount else ''}.",
                link=f"/solicitudes/{service_request.professional_id}?solicitud={service_request.id}",
            )

        return Response({
            "payment_status": service_request.payment_status,
            "success": payment_status == "Pagado",
            "message": message,
        })


class PlatformNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PlatformNotificationSerializer

    def get_queryset(self):
        queryset = PlatformNotification.objects.select_related(
            "service_request", "recipient"
        )
        user_id = self.request.query_params.get("user")
        if not user_id:
            return queryset.none()
        return queryset.filter(recipient_id=user_id)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(self.get_serializer(notification).data)


# =============================================================
# REVIEWS
# =============================================================

class ReviewViewSet(viewsets.ModelViewSet):

    serializer_class = ReviewSerializer


    def get_queryset(self):

        return Review.objects.all().order_by(
            "-created_at"
        )



    def perform_create(self, serializer):


        appointment = serializer.validated_data[
            "appointment"
        ]


        # Verificar que el servicio terminó

        if appointment.status != "Completada":

            raise ValidationError(
                "Solo puedes evaluar servicios completados."
            )



        # Evitar doble reseña

        if Review.objects.filter(
            appointment=appointment
        ).exists():

            raise ValidationError(
                "Este servicio ya tiene una reseña."
            )



        serializer.save(

            client=appointment.client,

            professional=appointment.professional

        )

# =============================================================
# APPOINTMENTS
# =============================================================

class AppointmentViewSet(
    viewsets.ModelViewSet
):

    queryset = Appointment.objects.all()

    serializer_class = AppointmentSerializer

    def perform_create(self, serializer):
        user = get_session_user_from_token(self.request)
        if not user:
            raise NotAuthenticated("Inicia sesión para crear una reserva.")
        client_profile = getattr(user, "profile", None)
        if not client_profile or client_profile.role != "organization":
            raise PermissionDenied("Solo las organizaciones pueden reservar servicios.")

        service = serializer.validated_data["service"]
        if not service.active or not service.approved:
            from rest_framework.exceptions import ValidationError as APIValidationError
            raise APIValidationError({"service": "Este servicio no está disponible para reservas."})

        professional = serializer.validated_data["professional"]
        if professional.pk != service.professional_id:
            from rest_framework.exceptions import ValidationError as APIValidationError
            raise APIValidationError({"professional": "El profesional debe coincidir con el servicio seleccionado."})

        appointment = serializer.save(
            client=user,
            professional=service.professional,
        )
        organization_name = (
            client_profile.full_name if client_profile else appointment.client.username
        )
        service_name = appointment.service.name
        proposed_schedule = (
            f"{appointment.date.strftime('%d-%m-%Y')} "
            f"a las {appointment.time.strftime('%H:%M')}"
        )

        PlatformNotification.objects.create(
            recipient=appointment.professional.user,
            appointment=appointment,
            title="Nueva reserva recibida",
            message=(
                f"{organization_name} reservó {service_name}. "
                f"Horario solicitado: {proposed_schedule}."
            ),
            link=f"/reservas-recibidas?reserva={appointment.id}",
        )

    def perform_update(self, serializer):
        service = serializer.validated_data.get("service")
        if service and (not service.active or not service.approved):
            from rest_framework.exceptions import ValidationError as APIValidationError
            raise APIValidationError({"service": "Este servicio no está disponible para reservas."})
        was_completed = serializer.instance.status == "Completada"
        appointment = serializer.save()
        if appointment.status == "Completada" and not was_completed:
            amount = f"${appointment.service.price:,.0f}"
            PlatformNotification.objects.create(
                recipient=appointment.client,
                appointment=appointment,
                title="Tu reserva está lista para pagar",
                message=(
                    f"{appointment.professional.full_name} completó "
                    f"{appointment.service.name} ({amount}). Horario: "
                    f"{appointment.date.strftime('%d-%m-%Y')} "
                    f"{appointment.time.strftime('%H:%M')}."
                ),
                link=f"/mis-reservas?reserva={appointment.id}",
            )

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        appointment = self.get_object()
        if str(request.data.get("client")) != str(appointment.client_id):
            return Response({"error": "Solo la organización que creó la reserva puede pagarla."}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status != "Completada":
            return Response({"error": "La reserva aún no está lista para pagar."}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.payment_status == "Pagado":
            return Response({"payment_status": "Pagado", "success": True, "message": "Esta reserva ya fue pagada."})

        outcomes = {
            "success": ("Pagado", "Pago realizado correctamente."),
            "failure": ("Fallido", "El pago fue rechazado. Puedes intentarlo nuevamente."),
            "insufficient_balance": ("Saldo insuficiente", "El saldo es insuficiente. Puedes intentarlo nuevamente."),
            "unknown_error": ("Error desconocido", "Ocurrió un error desconocido. Inténtalo nuevamente."),
        }
        outcome = outcomes.get(request.data.get("outcome"))
        if not outcome:
            return Response({"error": "Selecciona un resultado de pago válido."}, status=status.HTTP_400_BAD_REQUEST)

        payment_status, message = outcome
        appointment.payment_status = payment_status
        appointment.save(update_fields=["payment_status", "updated_at"])

        if payment_status == "Pagado":
            organization = getattr(appointment.client, "profile", None)
            organization_name = organization.full_name if organization else appointment.client.username
            amount = f"${appointment.service.price:,.0f}"
            PlatformNotification.objects.create(
                recipient=appointment.professional.user,
                appointment=appointment,
                title="Pago recibido",
                message=f"{organization_name} pagó {appointment.service.name} ({amount}).",
                link=f"/reservas-recibidas?reserva={appointment.id}",
            )

        return Response({
            "payment_status": appointment.payment_status,
            "success": payment_status == "Pagado",
            "message": message,
        })


# =============================================================
# LOGIN
# =============================================================

@api_view(["POST"])
def login_view(request):

    username_or_email = request.data.get(
        "username"
    )

    password = request.data.get(
        "password"
    )

    # ---------------------------------------------------------
    # Validar campos
    # ---------------------------------------------------------

    if not username_or_email or not password:

        return Response(
            {
                "error":
                    "Debes ingresar usuario y contraseña."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    # ---------------------------------------------------------
    # Buscar por correo
    # ---------------------------------------------------------

    user = User.objects.filter(
        email__iexact=username_or_email
    ).first()

    # ---------------------------------------------------------
    # Si no existe por correo,
    # utilizar nombre de usuario
    # ---------------------------------------------------------

    username = (
        user.username
        if user
        else username_or_email
    )

    # ---------------------------------------------------------
    # Autenticar
    # ---------------------------------------------------------

    user = authenticate(
        username=username,
        password=password
    )

    if user is None:

        return Response(
            {
                "error":
                    "Usuario o contraseña incorrectos."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    # ---------------------------------------------------------
    # Obtener perfil
    # ---------------------------------------------------------

    profile = getattr(
        user,
        "profile",
        None
    )

    # ---------------------------------------------------------
    # Respuesta
    # ---------------------------------------------------------

    return Response(
        {
            "message":
                "Inicio de sesión correcto.",

            "user_token": signing.dumps(
                user.pk,
                salt="skilly.user.session",
            ),

            "admin_token": signing.dumps(
                user.pk,
                salt="skilly.admin.approval",
            ) if user.is_staff else None,

            "master_token": signing.dumps(
                user.pk,
                salt="skilly.master.panel",
            ) if user.is_superuser and user.is_active else None,

            "user": {

                "id":
                    user.id,

                "username":
                    user.username,

                "email":
                    user.email,

                "is_staff":
                    user.is_staff,

                "is_superuser":
                    user.is_superuser,

            },

            "profile": {

                "id":
                    profile.id
                    if profile
                    else None,

                "full_name":
                    profile.full_name
                    if profile
                    else None,

                "role":
                    profile.role
                    if profile
                    else None,

                "profession":
                    profile.profession
                    if profile
                    else None,

            }
        },

        status=status.HTTP_200_OK
    )


# =============================================================
# REGISTER
# =============================================================

@api_view(["POST"])
def register_view(request):

    username = request.data.get(
        "username"
    )

    email = request.data.get(
        "email"
    )

    password = request.data.get(
        "password"
    )

    full_name = request.data.get(
        "full_name"
    )

    role = request.data.get(
        "role"
    )

    profession = request.data.get(
        "profession",
        ""
    )

    location = request.data.get(
        "location",
        ""
    )

    bio = request.data.get(
        "bio",
        ""
    )

    # ---------------------------------------------------------
    # Campos obligatorios
    # ---------------------------------------------------------

    if (
        not username
        or not email
        or not password
        or not full_name
        or not role
    ):

        return Response(
            {
                "error":
                    "Completa todos los campos obligatorios."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    # ---------------------------------------------------------
    # Usuario existente
    # ---------------------------------------------------------

    if User.objects.filter(
        username=username
    ).exists():

        return Response(
            {
                "error":
                    "El nombre de usuario ya está registrado."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # Email existente
    # ---------------------------------------------------------

    if User.objects.filter(
        email__iexact=email
    ).exists():

        return Response(
            {
                "error":
                    "El correo electrónico ya está registrado."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # Crear usuario
    # ---------------------------------------------------------

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # ---------------------------------------------------------
    # Crear perfil
    # ---------------------------------------------------------

    profile = Profile.objects.create(

        user=user,

        full_name=full_name,

        role=role,

        profession=profession,

        location=location,

        bio=bio

    )

    return Response(
        {
            "message":
                "Cuenta creada correctamente.",

            "user": {

                "id":
                    user.id,

                "username":
                    user.username,

                "email":
                    user.email,

            },

            "profile": {

                "id":
                    profile.id,

                "full_name":
                    profile.full_name,

                "role":
                    profile.role,

                "profession":
                    profile.profession,

                "location":
                    profile.location,

            }
        },

        status=status.HTTP_201_CREATED
    )


def get_admin_user_from_token(request):
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ")
    try:
        user_id = signing.loads(
            token,
            salt="skilly.admin.approval",
            max_age=60 * 60 * 8,
        )
    except BadSignature:
        return None

    User = get_user_model()
    return User.objects.filter(
        pk=user_id,
        is_staff=True,
        is_active=True,
    ).first()


def get_master_user_from_token(request):
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ")
    try:
        user_id = signing.loads(
            token,
            salt="skilly.master.panel",
            max_age=60 * 60 * 8,
        )
    except BadSignature:
        return None

    User = get_user_model()
    return User.objects.filter(
        pk=user_id,
        is_superuser=True,
        is_staff=True,
        is_active=True,
    ).first()


@api_view(["GET", "POST", "PATCH"])
def master_admins(request):
    if not get_master_user_from_token(request):
        return Response(
            {"error": "Inicia sesión con una cuenta superusuario para administrar las cuentas."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    User = get_user_model()
    if request.method == "GET":
        admins = User.objects.filter(
            is_staff=True,
            is_superuser=False,
        ).order_by("username")
        return Response([
            {
                "id": admin.pk,
                "username": admin.get_username(),
                "email": admin.email,
                "first_name": admin.first_name,
                "last_name": admin.last_name,
                "is_active": admin.is_active,
            }
            for admin in admins
        ])

    if request.method == "PATCH":
        admin_id = request.data.get("id")
        is_active = request.data.get("is_active")
        if not isinstance(is_active, bool):
            return Response(
                {"error": "Indica si la cuenta debe quedar activa."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            admin = User.objects.get(
                pk=admin_id,
                is_staff=True,
                is_superuser=False,
            )
        except (User.DoesNotExist, TypeError, ValueError):
            return Response(
                {"error": "La cuenta admin no existe."},
                status=status.HTTP_404_NOT_FOUND,
            )
        admin.is_active = is_active
        admin.save(update_fields=["is_active"])
        return Response({
            "id": admin.pk,
            "username": admin.get_username(),
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "is_active": admin.is_active,
        })

    username = str(request.data.get("username", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")
    first_name = str(request.data.get("first_name", "")).strip()
    last_name = str(request.data.get("last_name", "")).strip()

    if not username or not email or not password:
        return Response(
            {"error": "Usuario, correo y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "Ese nombre de usuario ya está en uso."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "Ese correo ya está asociado a una cuenta."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    candidate = User(username=username, email=email)
    try:
        password_validation.validate_password(password, user=candidate)
    except ValidationError as error:
        return Response(
            {"error": " ".join(error.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    admin = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True,
        is_superuser=False,
    )
    return Response(
        {
            "id": admin.pk,
            "username": admin.get_username(),
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "is_active": admin.is_active,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def pending_services(request):
    if not get_admin_user_from_token(request):
        return Response(
            {"error": "Inicia sesión con una cuenta administrativa del portal."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    services = Service.objects.filter(approved=False).select_related(
        "professional"
    ).prefetch_related("professional__reviews_received").order_by("created_at")
    return Response(ServiceSerializer(services, many=True).data)


@api_view(["PATCH"])
def review_service(request, id):
    if not get_admin_user_from_token(request):
        return Response(
            {"error": "Inicia sesión con una cuenta administrativa del portal."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    approved = request.data.get("approved")
    if not isinstance(approved, bool):
        return Response(
            {"error": "Indica si el servicio queda aprobado."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        service = Service.objects.select_related("professional").get(pk=id)
    except Service.DoesNotExist:
        return Response(
            {"error": "Servicio no encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    was_approved = service.approved
    service.approved = approved
    service.save(update_fields=["approved", "updated_at"])

    if approved and not was_approved:
        availability_message = (
            "Ya aparece en el marketplace."
            if service.active and service.professional.user.is_active
            else "Actívalo para que aparezca en el marketplace."
        )
        PlatformNotification.objects.create(
            recipient=service.professional.user,
            title="Tu servicio fue aprobado",
            message=f"El servicio {service.name} fue aprobado. {availability_message}",
            link="/servicios",
        )

    return Response(ServiceSerializer(service).data)


# =============================================================
# DASHBOARD METRICS
# =============================================================

@api_view(["GET"])
def dashboard_metrics(request):

    User = get_user_model()

    total_users = User.objects.count()

    total_professionals = Profile.objects.filter(

        role="professional",

        user__is_staff=False

    ).count()

    total_services = Service.objects.count()

    active_services = Service.objects.filter(
        active=True,
        approved=True,
    ).count()

    pending_services = Service.objects.filter(
        approved=False,
    ).count()

    total_requests = ServiceRequest.objects.count()

    completed_requests = ServiceRequest.objects.filter(
        status="Completada"
    ).count()

    total_appointments = Appointment.objects.count()

    return Response({

        "users":
            total_users,

        "professionals":
            total_professionals,

        "services":
            total_services,

        "active_services":
            active_services,

        "pending_services":
            pending_services,

        "requests":
            total_requests,

        "completed_requests":
            completed_requests,

        "appointments":
            total_appointments

    })


# =============================================================
# INCIDENTS
# =============================================================

class IncidentViewSet(
    viewsets.ModelViewSet
):

    queryset = Incident.objects.all().order_by(
        "-created_at"
    )

    serializer_class = IncidentSerializer


# =============================================================
# UPDATE PROFESSIONAL PROFILE
# =============================================================

@api_view(["PATCH"])
def update_professional_profile(request):

    profile_id = request.data.get(
        "profile_id"
    )

    profile = Profile.objects.get(
        id=profile_id
    )

    User = get_user_model()

    user_id = request.data.get(
        "user_id"
    )

    changed_user = User.objects.get(
        id=user_id
    )

    editable_fields = [

        "profession",

        "bio",

        "location",

    ]

    kyc_fields = [

        "full_name",

    ]

    for field, value in request.data.items():

        if field in editable_fields:

            old_value = getattr(
                profile,
                field
            )

            if old_value != value:

                ProfileChangeHistory.objects.create(

                    profile=profile,

                    changed_by=changed_user,

                    field_name=field,

                    old_value=str(
                        old_value
                    ),

                    new_value=str(
                        value
                    )

                )

                setattr(
                    profile,
                    field,
                    value
                )

        elif field in kyc_fields:

            return Response(
                {
                    "error":
                        "Este campo está validado por KYC y no puede modificarse"
                },
                status=400
            )

    profile.save()

    return Response(
        {
            "message":
                "Perfil actualizado correctamente"
        }
    )


# =============================================================
# REQUEST RESCHEDULE
# =============================================================

@api_view(["POST"])
def request_reschedule(request):

    appointment_id = request.data.get(
        "appointment_id"
    )

    appointment = Appointment.objects.get(
        id=appointment_id
    )

    if appointment.status != "Confirmada":

        return Response(
            {
                "error":
                    "Solo se pueden modificar servicios confirmados."
            },
            status=400
        )

    change = AppointmentChangeRequest.objects.create(

        appointment=appointment,

        requested_by=request.user,

        new_date=request.data.get(
            "new_date"
        ),

        new_time=request.data.get(
            "new_time"
        ),

        reason=request.data.get(
            "reason"
        )

    )

    return Response(
        {
            "message":
                "Solicitud enviada a la organización",

            "request_id":
                change.id
        }
    )


# =============================================================
# ACCEPT RESCHEDULE
# =============================================================

@api_view(["PATCH"])
def accept_reschedule(
    request,
    id
):

    change = AppointmentChangeRequest.objects.get(
        id=id
    )

    change.status = "accepted"

    change.save()

    appointment = change.appointment

    appointment.date = change.new_date

    appointment.time = change.new_time

    appointment.save()

    return Response(
        {
            "message":
                "Horario actualizado correctamente"
        }
    )


# =============================================================
# CANCEL APPOINTMENT
# =============================================================

@api_view(["PATCH"])
def cancel_appointment(
    request,
    id
):

    appointment = Appointment.objects.get(
        id=id
    )

    if appointment.status == "Completada":

        return Response(
            {
                "error":
                    "El servicio ya finalizó"
            },
            status=400
        )

    appointment.status = "Cancelada"

    appointment.save()

    # ---------------------------------------------------------
    # Crear devolución
    # ---------------------------------------------------------

    Refund.objects.create(

        appointment=appointment,

        amount=appointment.service.price

    )

    return Response(
        {
            "message":
                "Servicio cancelado. Devolución pendiente."
        }
    )


# =============================================================
# PROFESSIONAL AVAILABILITY
# =============================================================

class ProfessionalAvailabilityViewSet(
    viewsets.ModelViewSet
):

    queryset = ProfessionalAvailability.objects.all()

    serializer_class = (
        ProfessionalAvailabilitySerializer
    )

    def get_queryset(self):

        queryset = (
            ProfessionalAvailability
            .objects
            .all()
        )

        professional_id = (
            self.request.query_params.get(
                "professional"
            )
        )

        if professional_id:

            queryset = queryset.filter(
                professional_id=professional_id
            )

        return queryset.order_by(
            "day",
            "start_time"
        )
