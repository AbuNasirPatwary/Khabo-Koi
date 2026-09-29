from django.db import migrations


class Migration(migrations.Migration):
    """Join the independently developed map and audit migration branches."""

    dependencies = [
        (
            "restaurants",
            "0006_operationalstatushistory",
        ),
        (
            "restaurants",
            "0007_populate_dhaka_branch_coordinates",
        ),
    ]

    operations = []
