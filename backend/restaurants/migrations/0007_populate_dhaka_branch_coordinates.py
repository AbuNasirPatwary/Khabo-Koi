from django.db import migrations


DHAKA_BRANCH_COORDINATES = [
    ("Sultan's Dine", "Dhanmondi", "23.738840", "90.375490"),
    ("Sultan's Dine", "Gulshan", "23.794760", "90.413280"),
    ("Sultan's Dine", "Uttara", "23.875660", "90.390560"),

    ("Chillox", "Banani", "23.790120", "90.408060"),
    ("Chillox", "Dhanmondi", "23.740070", "90.374760"),
    ("Chillox", "Uttara", "23.874240", "90.391330"),

    ("Madchef", "Uttara", "23.877490", "90.390930"),
    ("Madchef", "Banani", "23.790010", "90.409171"),

    ("Kacchi Bhai", "Mirpur", "23.809410", "90.367730"),
    ("Kacchi Bhai", "Dhanmondi", "23.746502", "90.371085"),
]


def populate_dhaka_coordinates(apps, schema_editor):
    Branch = apps.get_model("restaurants", "Branch")

    for restaurant_name, branch_name, latitude, longitude in DHAKA_BRANCH_COORDINATES:
        Branch.objects.filter(
            restaurant__name=restaurant_name,
            name=branch_name,
        ).update(
            latitude=latitude,
            longitude=longitude,
        )


def remove_seeded_coordinates(apps, schema_editor):
    Branch = apps.get_model("restaurants", "Branch")

    for restaurant_name, branch_name, latitude, longitude in DHAKA_BRANCH_COORDINATES:
        Branch.objects.filter(
            restaurant__name=restaurant_name,
            name=branch_name,
            latitude=latitude,
            longitude=longitude,
        ).update(
            latitude=None,
            longitude=None,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0006_branch_latitude_branch_longitude"),
    ]

    operations = [
        migrations.RunPython(
            populate_dhaka_coordinates,
            remove_seeded_coordinates,
        ),
    ]