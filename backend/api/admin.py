from django.contrib import admin

from .models import (
    Profile,
    Service,
    ServiceRequest,
    Review,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = (
        "full_name",
        "role",
        "profession",
        "location",
        "validated",
        "created_at",
    )

    list_filter = (
        "role",
        "validated",
    )

    search_fields = (
        "full_name",
        "profession",
        "location",
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "professional",
        "category",
        "modality",
        "price",
        "active",
        "approved",
    )

    list_filter = (
        "category",
        "modality",
        "active",
        "approved",
    )

    search_fields = (
        "name",
        "professional__full_name",
    )

    list_editable = ("approved", "active")
    actions = ("approve_selected_services", "reject_selected_services")

    @admin.action(description="Aprobar servicios seleccionados")
    def approve_selected_services(self, request, queryset):
        queryset.update(approved=True)

    @admin.action(description="Rechazar servicios seleccionados")
    def reject_selected_services(self, request, queryset):
        queryset.update(approved=False)


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):

    list_display = (
        "project",
        "client",
        "professional",
        "service",
        "status",
        "requested_date",
        "budget",
        "created_at",
    )

    list_filter = (
        "status",
        "modality",
    )

    search_fields = (
        "project",
        "client__username",
        "professional__full_name",
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):

    list_display = (
        "professional",
        "client",
        "appointment",
        "created_at",
    )

    search_fields = (
        "professional__full_name",
        "client__username",
        "comment",
    )
