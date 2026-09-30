from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

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
)

from .serializers import (
    ProfileSerializer,
    ServiceSerializer,
    ServiceRequestSerializer,
    ReviewSerializer,
    AppointmentSerializer,
    IncidentSerializer,
    ProfessionalAvailabilitySerializer,

)

class ProfileViewSet(viewsets.ModelViewSet):

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class ServiceViewSet(viewsets.ModelViewSet):

    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class ServiceRequestViewSet(viewsets.ModelViewSet):

    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer


class ReviewViewSet(viewsets.ModelViewSet):

    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class AppointmentViewSet(viewsets.ModelViewSet):

    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer


@api_view(["POST"])
def login_view(request):

    username_or_email = request.data.get("username")
    password = request.data.get("password")

    if not username_or_email or not password:
        return Response(
            {
                "error": "Debes ingresar usuario y contraseña."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    # Buscar primero por correo electrónico
    user = User.objects.filter(
        email__iexact=username_or_email
    ).first()

    # Si no existe por correo, usar el dato como nombre de usuario
    username = (
        user.username
        if user
        else username_or_email
    )

    # Comprobar usuario y contraseña
    user = authenticate(
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {
                "error": "Usuario o contraseña incorrectos."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    profile = getattr(user, "profile", None)

    return Response(
        {
            "message": "Inicio de sesión correcto.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
            },
            "profile": {
                "id": profile.id if profile else None,
                "full_name": profile.full_name if profile else None,
                "role": profile.role if profile else None,
                "profession": profile.profession if profile else None,
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
def register_view(request):

    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    full_name = request.data.get("full_name")
    role = request.data.get("role")
    profession = request.data.get("profession", "")
    location = request.data.get("location", "")
    bio = request.data.get("bio", "")

    # Comprobar campos obligatorios
    if not username or not email or not password or not full_name or not role:
        return Response(
            {
                "error": "Completa todos los campos obligatorios."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    # Comprobar si el usuario ya existe
    if User.objects.filter(username=username).exists():
        return Response(
            {
                "error": "El nombre de usuario ya está registrado."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Comprobar si el correo ya existe
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {
                "error": "El correo electrónico ya está registrado."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Crear usuario
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Crear perfil de Skilly
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
            "message": "Cuenta creada correctamente.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "profile": {
                "id": profile.id,
                "full_name": profile.full_name,
                "role": profile.role,
                "profession": profile.profession,
                "location": profile.location,
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["GET"])
def pending_profiles(request):

    profiles = Profile.objects.filter(
        validated=False,
        role="professional"
    )


    serializer = ProfileSerializer(
        profiles,
        many=True
    )
    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )

@api_view(["PATCH"])
def validate_profile(request, id):

    try:

        profile = Profile.objects.get(
            id=id
        )


    except Profile.DoesNotExist:

        return Response(
            {
                "error":
                "Perfil no encontrado"
            },
            status=status.HTTP_404_NOT_FOUND
        )



    validated = request.data.get(
        "validated"
    )


    if validated is None:

        return Response(
            {
                "error":
                "Debe indicar validated"
            },
            status=status.HTTP_400_BAD_REQUEST
        )



    profile.validated = validated

    profile.save()



    serializer = ProfileSerializer(
        profile
    )


    return Response(
        {
            "message":
            "Estado actualizado correctamente",

            "profile":
            serializer.data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
def dashboard_metrics(request):

    User = get_user_model()


    total_users = User.objects.count()


    total_professionals = Profile.objects.filter(
        role="professional"
    ).count()



    pending_validations = Profile.objects.filter(
        role="professional",
        validated=False
    ).count()



    validated_professionals = Profile.objects.filter(
        role="professional",
        validated=True
    ).count()



    total_services = Service.objects.count()



    active_services = Service.objects.filter(
        active=True
    ).count()



    total_requests = ServiceRequest.objects.count()



    completed_requests = ServiceRequest.objects.filter(
        status="Completada"
    ).count()



    total_appointments = Appointment.objects.count()



    return Response({

        "users": total_users,

        "professionals": total_professionals,

        "pending_validations": pending_validations,

        "validated_professionals": validated_professionals,

        "services": total_services,

        "active_services": active_services,

        "requests": total_requests,

        "completed_requests": completed_requests,

        "appointments": total_appointments

    })

class IncidentViewSet(viewsets.ModelViewSet):

    queryset = Incident.objects.all().order_by(
        "-created_at"
    )

    serializer_class = IncidentSerializer

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



    for field,value in request.data.items():


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

                    old_value=str(old_value),

                    new_value=str(value)

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



    return Response({

        "message":
        "Perfil actualizado correctamente"

    })

@api_view(["POST"])
def request_reschedule(request):


    appointment_id=request.data.get(
        "appointment_id"
    )


    appointment=Appointment.objects.get(
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



    change=AppointmentChangeRequest.objects.create(

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



    return Response({

        "message":
        "Solicitud enviada a la organización",

        "request_id":
        change.id

    })

@api_view(["PATCH"])
def accept_reschedule(request,id):


    change=AppointmentChangeRequest.objects.get(
        id=id
    )


    change.status="accepted"

    change.save()



    appointment=change.appointment


    appointment.date=change.new_date

    appointment.time=change.new_time

    appointment.save()



    return Response({

        "message":
        "Horario actualizado correctamente"

    })

@api_view(["PATCH"])
def cancel_appointment(request,id):


    appointment=Appointment.objects.get(
        id=id
    )



    if appointment.status=="Completada":

        return Response(
        {
          "error":
          "El servicio ya finalizó"
        },
        status=400
        )



    appointment.status="Cancelada"

    appointment.save()



    # Aquí luego se conecta el pago

    Refund.objects.create(

        appointment=appointment,

        amount=appointment.service.price

    )



    return Response({

        "message":
        "Servicio cancelado. Devolución pendiente."

    })

class ProfessionalAvailabilityViewSet(
    viewsets.ModelViewSet
):


    queryset = ProfessionalAvailability.objects.all()


    serializer_class = ProfessionalAvailabilitySerializer

 