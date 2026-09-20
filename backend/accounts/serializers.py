from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from restaurants.models import Restaurant

from .models import (
    RestaurantManagerAssignment,
    UserProfile,
)


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


# =============================================================================
# PLATFORM ADMIN ROLE UPDATE
# =============================================================================
# A Platform Admin can deliberately change another user's Khabo-Koi product
# role. This serializer updates UserProfile rather than Django's User model
# because product roles are separate from is_staff and is_superuser.
# =============================================================================

class PlatformAdminRoleUpdateSerializer(serializers.ModelSerializer):

    class Meta:

        model = UserProfile

        fields = [
            "role",
        ]

    def validate_role(self, role):

        request = self.context.get(
            "request"
        )

        # Prevent an Admin from accidentally removing their own Admin access
        # and locking themselves out of the Platform Admin interface.
        if (
            request is not None
            and self.instance.user_id
            == request.user.id
        ):
            raise serializers.ValidationError(
                "You cannot change your own Platform Admin role."
            )

        return role

    @transaction.atomic
    def update(self, profile, validated_data):

        previous_role = profile.role
        new_role = validated_data["role"]

        profile.role = new_role
        profile.save(
            update_fields=[
                "role",
                "updated_at",
            ]
        )

        # Assignments should not silently become usable again after a Manager
        # is demoted and later promoted. Deactivation preserves the history
        # while requiring a Platform Admin to grant access again deliberately.
        if (
            previous_role
            == UserProfile.Role.RESTAURANT_MANAGER
            and new_role
            != UserProfile.Role.RESTAURANT_MANAGER
        ):
            profile.user.restaurant_assignments.update(
                is_active=False
            )

        return profile


# =============================================================================
# PLATFORM ADMIN MANAGER ASSIGNMENTS
# =============================================================================
# These serializers let Platform Admins view, create and activate/deactivate
# the relationship between a Restaurant Manager and a restaurant.
#
# Assignment records are deactivated instead of deleted so the project retains
# its management history.
# =============================================================================

class PlatformAdminManagerAssignmentSerializer(
    serializers.ModelSerializer
):

    user = serializers.SerializerMethodField()
    restaurant = serializers.SerializerMethodField()
    assigned_by = serializers.SerializerMethodField()

    class Meta:

        model = RestaurantManagerAssignment

        fields = [
            "id",
            "user",
            "restaurant",
            "is_active",
            "assigned_at",
            "assigned_by",
        ]

        read_only_fields = fields

    def get_user(self, assignment):

        return {
            "id": assignment.user_id,
            "username": assignment.user.username,
            "email": assignment.user.email,
            "role": assignment.user.profile.role,
        }

    def get_restaurant(self, assignment):

        return {
            "id": assignment.restaurant_id,
            "name": assignment.restaurant.name,
        }

    def get_assigned_by(self, assignment):

        if assignment.assigned_by is None:
            return None

        return {
            "id": assignment.assigned_by_id,
            "username": assignment.assigned_by.username,
        }


class PlatformAdminManagerAssignmentCreateSerializer(
    serializers.Serializer
):

    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.select_related(
            "profile"
        ),
    )

    restaurant_id = serializers.PrimaryKeyRelatedField(
        source="restaurant",
        queryset=Restaurant.objects.all(),
    )

    def validate_user_id(self, user):

        # A suspended account must not receive restaurant access.
        if not user.is_active:
            raise serializers.ValidationError(
                "The selected user account is inactive."
            )

        if (
            user.profile.role
            != UserProfile.Role.RESTAURANT_MANAGER
        ):
            raise serializers.ValidationError(
                "The selected user must have the Restaurant Manager role."
            )

        return user

    def validate(self, attributes):

        user = attributes["user"]
        restaurant = attributes["restaurant"]

        # The database also enforces this pair as unique. Performing the check
        # here provides a clear API error instead of a database exception.
        if RestaurantManagerAssignment.objects.filter(
            user=user,
            restaurant=restaurant,
        ).exists():
            raise serializers.ValidationError(
                "This Manager assignment already exists. "
                "Update the existing assignment instead."
            )

        return attributes

    def create(self, validated_data):

        request = self.context["request"]

        return RestaurantManagerAssignment.objects.create(
            **validated_data,
            assigned_by=request.user,
        )


class PlatformAdminManagerAssignmentStatusSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = RestaurantManagerAssignment

        fields = [
            "is_active",
        ]

    def validate_is_active(self, is_active):

        # Deactivation is always permitted. Reactivation requires the assigned
        # user to remain an active Restaurant Manager.
        if not is_active:
            return is_active

        manager = self.instance.user

        if not manager.is_active:
            raise serializers.ValidationError(
                "An inactive user cannot receive restaurant access."
            )

        if (
            manager.profile.role
            != UserProfile.Role.RESTAURANT_MANAGER
        ):
            raise serializers.ValidationError(
                "Only a Restaurant Manager assignment can be activated."
            )

        return is_active
