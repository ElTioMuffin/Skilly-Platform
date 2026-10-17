from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="approved",
            field=models.BooleanField(default=False),
        ),
    ]
