from rest_framework import serializers
from .models import (
    Profile,
    Service,
    ServiceRequest,
    Review,
    Appointment,
    Incident,
    AppointmentChangeRequest,
    ProfessionalAvailability,
    PlatformNotification,
)

class ReviewSerializer(serializers.ModelSerializer):

    client_username = serializers.CharField(
            source="client.username",
            read_only=True
        )

    client_full_name = serializers.CharField(
            source="client.profile.full_name",
            read_only=True
        )

    class Meta:
        model = Review
        fields = [
            "id",
            "appointment",
            "client",
            "professional",
            "comment",
            "created_at",
            "client_username",
            "client_full_name",
        ]

        read_only_fields = [

            "client",

            "professional",

            "created_at"

        ]

class ServiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Service
        fields = [
            "id",
            "professional",
            "name",
            "description",
            "category",
            "modality",
            "location",
            "price",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "professional",
            "created_at",
            "updated_at",
        ]

class ProfileSerializer(serializers.ModelSerializer):

    services = ServiceSerializer(
        many=True,
        read_only=True
    )

    reviews = ReviewSerializer(
        source="reviews_received",
        many=True,
        read_only=True
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "full_name",
            "role",
            "profession",
            "bio",
            "location",
            "validated",
            "services",
            "reviews",
            "created_at",
            "updated_at",
        ]

class ServiceRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "client",
            "professional",
            "service",
            "project",
            "details",
            "requested_date",
            "requested_time",
            "budget",
            "modality",
            "status",
            "created_at",
            "updated_at",
        ]

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "client",
            "professional",
            "service",
            "date",
            "time",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        professional = attrs.get("professional", getattr(self.instance, "professional", None))
        date = attrs.get("date", getattr(self.instance, "date", None))
        time = attrs.get("time", getattr(self.instance, "time", None))

        if not all((professional, date, time)):
            return attrs

        day_names = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
        day = day_names[date.weekday()]
        available = ProfessionalAvailability.objects.filter(
            professional=professional,
            day=day,
            active=True,
            start_time__lte=time,
            end_time__gt=time,
        ).exists()
        if not available:
            raise serializers.ValidationError({
                "time": "La hora seleccionada está fuera de la disponibilidad del profesional."
            })

        occupied = Appointment.objects.filter(
            professional=professional,
            date=date,
            time=time,
            status__in=["Pendiente", "Confirmada"],
        )
        if self.instance:
            occupied = occupied.exclude(pk=self.instance.pk)
        if occupied.exists():
            raise serializers.ValidationError({"time": "Ese horario ya está reservado."})

        return attrs

class IncidentSerializer(serializers.ModelSerializer):

    reporter_name = serializers.CharField(
        source="reporter.username",
        read_only=True
    )


    affected_name = serializers.CharField(
        source="affected_user.username",
        read_only=True
    )


    class Meta:

        model = Incident

        fields = "__all__"

class AppointmentChangeRequestSerializer(
    serializers.ModelSerializer
):


    class Meta:

        model = AppointmentChangeRequest

        fields="__all__"

class ProfessionalAvailabilitySerializer(
    serializers.ModelSerializer
):


    class Meta:

        model = ProfessionalAvailability

        fields="__all__"

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError({"end_time": "La hora de término debe ser posterior a la hora de inicio."})
        return attrs


class PlatformNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformNotification
        fields = [
            "id",
            "recipient",
            "service_request",
            "appointment",
            "title",
            "message",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields

