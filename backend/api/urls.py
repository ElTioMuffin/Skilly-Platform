from django.urls import path, include

from rest_framework.routers import DefaultRouter

from .views import (
    ProfileViewSet,
    ServiceViewSet,
    ServiceRequestViewSet,
    ReviewViewSet,
    AppointmentViewSet,
    IncidentViewSet,
    ProfessionalAvailabilityViewSet,
    PlatformNotificationViewSet,
    pending_profiles,
    validate_profile,
    login_view,
    register_view,
    dashboard_metrics,
    update_professional_profile,
)


router = DefaultRouter()


router.register(
    r"profesionales",
    ProfileViewSet,
    basename="profesional"
)


router.register(
    r"servicios",
    ServiceViewSet,
    basename="servicio"
)

router.register(
    r"reservas",
    AppointmentViewSet,
    basename="reserva"
)

router.register(
    r"solicitudes",
    ServiceRequestViewSet,
    basename="solicitud"
)


router.register(
    r"resenas",
    ReviewViewSet,
    basename="resena"
)
router.register(
    "admin/incidents",
    IncidentViewSet)

router.register(
    "profiles",
    ProfileViewSet,
    basename="profiles"
)

router.register(
    "services",
    ServiceViewSet,
    basename="services"
)

router.register(
    "service-requests",
    ServiceRequestViewSet,
    basename="service-requests"
)

router.register(
    "reviews",
    ReviewViewSet,
    basename="reviews"
)

router.register(
    "appointments",
    AppointmentViewSet,
    basename="appointments"
)

router.register(
    "incidents",
    IncidentViewSet,
    basename="incidents"
)

router.register(
    "availability",
    ProfessionalAvailabilityViewSet,
    basename="availability"
)

router.register(
    "notifications",
    PlatformNotificationViewSet,
    basename="notifications",
)

router.register(

"availability",

ProfessionalAvailabilityViewSet

)


urlpatterns = [

    path(
        "",
        include(router.urls)
    ),

    path(
        "login/",
        login_view,
        name="login"
    ),
    
    path(
    "registro/",
    register_view,
    name="registro"
    ),
    path(
        "admin/profiles/pending/",
        pending_profiles
    ),


    path(
        "admin/profiles/<int:id>/validate/",
        validate_profile
    ),
    path(
    "admin/dashboard/metrics/",
        dashboard_metrics
    ),
    path(
    "professional/profile/update/",
        update_professional_profile
    ),


]
