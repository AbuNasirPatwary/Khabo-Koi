from django.conf import settings
from django.db import migrations


# =============================================================================
# EXISTING USER PROFILE BACKFILL
# =============================================================================
# The post_save signal creates a UserProfile whenever a new User is created.
# However, signals do not run retroactively for users already stored in the
# database.
#
# This data migration creates a CUSTOMER profile for every existing user who
# does not already have a profile.
#
# We use apps.get_model() instead of importing UserProfile directly because
# migrations must use the historical model definitions that existed when the
# migration was created.
# =============================================================================

def create_missing_user_profiles(apps, schema_editor):

    # settings.AUTH_USER_MODEL is currently "auth.User".
    # Splitting it keeps this migration compatible with Django's configured
    # user model rather than hard-coding an ordinary Python import.
    user_app_label, user_model_name = (
        settings.AUTH_USER_MODEL.split(".")
    )

    User = apps.get_model(
        user_app_label,
        user_model_name,
    )

    UserProfile = apps.get_model(
        "accounts",
        "UserProfile",
    )

    # Use the same database connection on which Django is applying this
    # migration. This matters if the project ever uses multiple databases.
    database_alias = schema_editor.connection.alias

    existing_users = User.objects.using(
        database_alias
    ).all()

    for user in existing_users.iterator():

        # get_or_create makes the migration safe if a profile already exists.
        # Existing profiles and their roles will not be overwritten.
        UserProfile.objects.using(
            database_alias
        ).get_or_create(
            user_id=user.id,
            defaults={
                "role": "CUSTOMER",
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            create_missing_user_profiles,

            # Reversing this migration should not delete profiles because a
            # profile may later contain a Manager or Admin role. The table
            # itself is removed normally if 0001 is reversed.
            reverse_code=migrations.RunPython.noop,
        ),
    ]
