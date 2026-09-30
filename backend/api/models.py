from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):

    ROLE_CHOICES = [
        ("professional", "Profesional"),
        ("organization", "Organización"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    full_name = models.CharField(max_length=150)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    profession = models.CharField(
        max_length=150,
        blank=True
    )

    bio = models.TextField(
        blank=True
    )

    location = models.CharField(
        max_length=100,
        blank=True
    )

    validated = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.full_name


class Service(models.Model):

    CATEGORY_CHOICES = [
        ("Diseño", "Diseño"),
        ("Desarrollo", "Desarrollo"),
        ("Marketing", "Marketing"),
        ("Otro", "Otro"),
    ]

    MODALITY_CHOICES = [
        ("Remoto", "Remoto"),
        ("Híbrido", "Híbrido"),
        ("Presencial", "Presencial"),
    ]

    professional = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="services"
    )

    name = models.CharField(max_length=150)

    description = models.TextField(
        blank=True
    )

    category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES
    )

    modality = models.CharField(
        max_length=20,
        choices=MODALITY_CHOICES
    )

    location = models.CharField(
        max_length=100,
        blank=True
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=0
    )

    active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


class ServiceRequest(models.Model):

    STATUS_CHOICES = [
        ("Pendiente", "Pendiente"),
        ("Aceptada", "Aceptada"),
        ("Rechazada", "Rechazada"),
        ("Completada", "Completada"),
        ("Cancelada", "Cancelada"),
    ]

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="service_requests"
    )

    professional = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="received_requests"
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requests"
    )

    project = models.CharField(
        max_length=200
    )

    details = models.TextField()

    requested_date = models.DateField(
        null=True,
        blank=True
    )

    budget = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        null=True,
        blank=True
    )

    modality = models.CharField(
        max_length=20,
        choices=[
            ("Remoto", "Remoto"),
            ("Híbrido", "Híbrido"),
            ("Presencial", "Presencial"),
        ]
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pendiente"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.project


class Review(models.Model):

    service_request = models.OneToOneField(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="review"
    )

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews_written"
    )

    professional = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="reviews_received"
    )

    comment = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Reseña para {self.professional.full_name}"

class Appointment(models.Model):

    STATUS_CHOICES = [
        ("Pendiente", "Pendiente"),
        ("Confirmada", "Confirmada"),
        ("Cancelada", "Cancelada"),
        ("Completada", "Completada"),
    ]

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    professional = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    date = models.DateField()

    time = models.TimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pendiente"
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["date", "time"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "professional",
                    "date",
                    "time"
                ],
                name="unique_professional_appointment"
            )
        ]

    def __str__(self):
        return (
            f"{self.service.name} - "
            f"{self.date} {self.time}"
        )


class Incident(models.Model):

    STATUS_CHOICES = [

        ("open", "Abierta"),

        ("review", "En revisión"),

        ("resolved", "Resuelta"),

    ]


    reporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reported_incidents"
    )


    affected_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_incidents"
    )


    title = models.CharField(
        max_length=200
    )


    description = models.TextField()



    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )



    def __str__(self):

        return self.title

class ProfileChangeHistory(models.Model):

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="changes"
    )


    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )


    field_name = models.CharField(
        max_length=100
    )


    old_value = models.TextField(
        blank=True
    )


    new_value = models.TextField(
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):

        return f"Cambio {self.field_name}"

class AppointmentChangeRequest(models.Model):

    STATUS_CHOICES = [

        ("pending", "Pendiente"),

        ("accepted", "Aceptada"),

        ("rejected", "Rechazada"),

    ]


    appointment = models.ForeignKey(

        Appointment,

        on_delete=models.CASCADE,

        related_name="change_requests"

    )


    requested_by = models.ForeignKey(

        User,

        on_delete=models.CASCADE

    )


    new_date = models.DateField()


    new_time = models.TimeField()



    reason = models.TextField(
        blank=True
    )



    status = models.CharField(

        max_length=20,

        choices=STATUS_CHOICES,

        default="pending"

    )



    created_at = models.DateTimeField(
        auto_now_add=True
    )



    def __str__(self):

        return f"Cambio {self.appointment.id}"

class Refund(models.Model):

    appointment = models.OneToOneField(

        Appointment,

        on_delete=models.CASCADE

    )


    amount = models.DecimalField(

        max_digits=12,

        decimal_places=0

    )


    status_choices=[

        ("pending","Pendiente"),

        ("completed","Realizada")

    ]


    status=models.CharField(

        max_length=20,

        default="pending"

    )


    created_at=models.DateTimeField(
        auto_now_add=True
    )

class ProfessionalAvailability(models.Model):

    DAYS = [

        ("lunes","Lunes"),
        ("martes","Martes"),
        ("miercoles","Miércoles"),
        ("jueves","Jueves"),
        ("viernes","Viernes"),
        ("sabado","Sábado"),
        ("domingo","Domingo"),

    ]


    professional = models.ForeignKey(

        Profile,

        on_delete=models.CASCADE,

        related_name="availability"

    )


    day = models.CharField(

        max_length=20,

        choices=DAYS

    )


    start_time = models.TimeField()


    end_time = models.TimeField()


    active = models.BooleanField(

        default=True

    )


    created_at = models.DateTimeField(

        auto_now_add=True

    )


    updated_at = models.DateTimeField(

        auto_now=True

    )



    class Meta:

        unique_together = (

            "professional",

            "day",

            "start_time",

        )


    def __str__(self):

        return f"{self.professional} - {self.day}"
    
        