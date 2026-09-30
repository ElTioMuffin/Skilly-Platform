from rest_framework import serializers
from .models import (
    Profile,
    Service,
    ServiceRequest,
    Review,
    Appointment,
    Incident,
    AppointmentChangeRequest,
    ProfessionalAvailability
)

class ReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review
        fields = [
            "id",
            "client",
            "professional",
            "comment",
            "created_at",
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

