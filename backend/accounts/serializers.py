from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile


# =============================================================================
# CUSTOMER REGISTRATION
# =============================================================================
# Public registration creates a normal Django User.
#
# The UserProfile post_save signal automatically creates the related profile
# with the default CUSTOMER role. The public request is never allowed to select
# a Manager or Admin role.
# =============================================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
    )

    class Meta:

        model = User

        fields = [
            "username",
            "email",
            "password",
        ]

    def create(self, validated_data):

        # create_user hashes the password correctly. Using objects.create()
        # here would store an unusable or unsafe plain-text password.
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


# =============================================================================
# AUTHENTICATED USER PROFILE
# =============================================================================
# This serializer gives the React frontend the authenticated user's identity,
# product role and authorized restaurant choices.
#
# It intentionally does not expose password hashes, permissions, tokens,
# secret fields or inactive restaurant assignments.
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()

    assigned_restaurants = (
        serializers.SerializerMethodField()
    )

    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "email",
            "role",
            "assigned_restaurants",
        ]

        read_only_fields = fields

    def get_role(self, user):

        # Every migrated user should have a profile. Returning None instead of
        # raising an exception keeps the endpoint safe if an incomplete legacy
        # user record is encountered.
        profile = getattr(
            user,
            "profile",
            None,
        )

        if profile is None:
            return None

        return profile.role

    def get_assigned_restaurants(self, user):

        profile = getattr(
            user,
            "profile",
            None,
        )

        # Only Restaurant Managers receive restaurant choices here.
        # A Customer or Platform Admin receives an empty list even if an
        # incorrect assignment record somehow exists.
        if (
            profile is None
            or profile.role
            != UserProfile.Role.RESTAURANT_MANAGER
        ):
            return []

        assignments = (
            user.restaurant_assignments
            .filter(
                is_active=True,
            )
            .select_related(
                "restaurant",
            )
            .order_by(
                "restaurant__name",
            )
        )

        return [
            {
                "id": assignment.restaurant_id,
                "name": assignment.restaurant.name,
            }
            for assignment in assignments
        ]


# =============================================================================
# PLATFORM ADMIN USER LIST
# =============================================================================
# Platform Admins need a safe overview of Khabo-Koi user accounts before they
# can manage roles or restaurant assignments.
#
# This serializer is intentionally read-only. It exposes identity, product
# role and account status, but never exposes passwords, tokens or Django
# permission internals.
# =============================================================================

class PlatformAdminUserSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()

    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "email",
            "role",
            "is_active",
            "date_joined",
        ]

        read_only_fields = fields

    def get_role(self, user):

        # Profiles are normally guaranteed by the UserProfile creation signal
        # and data migration. The fallback prevents one incomplete legacy user
        # from breaking the entire Admin user list.
        profile = getattr(
            user,
            "profile",
            None,
        )

        if profile is None:
            return None

        return profile.role
