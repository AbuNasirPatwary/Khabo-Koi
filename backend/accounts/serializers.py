from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework import serializers

from restaurants.models import Branch, Restaurant

from .models import (
    BranchManagerAssignment,
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

    def validate(self, attributes):

        # create_user hashes a password but does not run the configured
        # strength validators. Validate here so API registrations follow the
        # same password policy as Django's standard account forms.
        candidate_user = User(
            username=attributes.get("username", ""),
            email=attributes.get("email", ""),
        )

        try:
            validate_password(
                attributes["password"],
                user=candidate_user,
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "password": error.messages,
            }) from error

        return attributes

    def create(self, validated_data):

        # create_user hashes the password correctly. Using objects.create()
        # here would store an unusable or unsafe plain-text password.
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class PasswordResetRequestSerializer(serializers.Serializer):
    """Validate the address without revealing whether an account exists."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Accept the opaque reset-link values and the replacement password."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )


class EmailVerificationConfirmSerializer(serializers.Serializer):
    """Accept the opaque values included in an email verification link."""

    uid = serializers.CharField()
    token = serializers.CharField()


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
    email_verified = serializers.SerializerMethodField()

    assigned_restaurants = (
        serializers.SerializerMethodField()
    )

    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "email",
            "email_verified",
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

    def get_email_verified(self, user):
        profile = getattr(user, "profile", None)
        return bool(profile and profile.email_verified)

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
                restaurant__is_active=True,
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

    def validate(self, attributes):

        if "role" not in attributes:
            raise serializers.ValidationError({
                "role": "This field is required.",
            })

        return attributes

    @transaction.atomic
    def update(self, profile, validated_data):

        # Serialize role changes with assignment creation/reactivation for the
        # same user so concurrent requests cannot revive stale access.
        User.objects.select_for_update().get(
            id=profile.user_id,
        )

        profile = UserProfile.objects.select_for_update().get(
            id=profile.id,
        )

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

        if (
            previous_role
            == UserProfile.Role.BRANCH_MANAGER
            and new_role
            != UserProfile.Role.BRANCH_MANAGER
        ):
            profile.user.branch_manager_assignments.update(
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
            "is_active": assignment.restaurant.is_active,
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

    def validate_restaurant_id(self, restaurant):

        if not restaurant.is_active:
            raise serializers.ValidationError(
                "An inactive restaurant cannot receive Manager access."
            )

        return restaurant

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

    @transaction.atomic
    def create(self, validated_data):

        request = self.context["request"]

        user = (
            User.objects
            .select_for_update()
            .get(id=validated_data["user"].id)
        )

        restaurant = (
            Restaurant.objects
            .select_for_update()
            .get(id=validated_data["restaurant"].id)
        )

        # Repeat authorization checks after locking because the role, account,
        # or restaurant may have changed after initial validation.
        self.validate_user_id(user)
        self.validate_restaurant_id(restaurant)

        if RestaurantManagerAssignment.objects.filter(
            user=user,
            restaurant=restaurant,
        ).exists():
            raise serializers.ValidationError(
                "This Manager assignment already exists. "
                "Update the existing assignment instead."
            )

        try:
            # The inner savepoint lets us translate a database uniqueness
            # race into a clean API error without breaking the outer lock.
            with transaction.atomic():
                return RestaurantManagerAssignment.objects.create(
                    user=user,
                    restaurant=restaurant,
                    assigned_by=request.user,
                )
        except IntegrityError as error:
            raise serializers.ValidationError(
                "This Manager assignment already exists. "
                "Update the existing assignment instead."
            ) from error


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

        if not self.instance.restaurant.is_active:
            raise serializers.ValidationError(
                "Manager access cannot be activated for an inactive restaurant."
            )

        return is_active

    def validate(self, attributes):

        if "is_active" not in attributes:
            raise serializers.ValidationError({
                "is_active": "This field is required.",
            })

        return attributes

    @transaction.atomic
    def update(self, assignment, validated_data):

        manager = (
            User.objects
            .select_for_update()
            .get(id=assignment.user_id)
        )

        restaurant = (
            Restaurant.objects
            .select_for_update()
            .get(id=assignment.restaurant_id)
        )

        assignment = (
            RestaurantManagerAssignment.objects
            .select_for_update()
            .get(id=assignment.id)
        )

        is_active = validated_data["is_active"]

        if is_active:
            if not manager.is_active:
                raise serializers.ValidationError({
                    "is_active": "An inactive user cannot receive restaurant access.",
                })

            if (
                manager.profile.role
                != UserProfile.Role.RESTAURANT_MANAGER
            ):
                raise serializers.ValidationError({
                    "is_active": "Only a Restaurant Manager assignment can be activated.",
                })

            if not restaurant.is_active:
                raise serializers.ValidationError({
                    "is_active": "Manager access cannot be activated for an inactive restaurant.",
                })

        assignment.is_active = is_active
        assignment.save(
            update_fields=[
                "is_active",
            ]
        )

        return assignment


# =============================================================================
# PLATFORM ADMIN ACCOUNT STATUS UPDATE
# =============================================================================
# Platform Admins may suspend or reactivate user accounts through Django's
# is_active field.
#
# Suspending an account also removes its active restaurant access. Reactivating
# the account does not automatically restore previous Manager assignments.
# =============================================================================

class PlatformAdminAccountStatusSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = User

        fields = [
            "is_active",
        ]

    def validate_is_active(self, is_active):

        request = self.context.get(
            "request"
        )

        # Prevent the current Platform Admin from suspending their own account
        # and immediately locking themselves out of the Admin interface.
        if (
            request is not None
            and self.instance.id
            == request.user.id
            and not is_active
        ):
            raise serializers.ValidationError(
                "You cannot deactivate your own Platform Admin account."
            )

        return is_active

    def validate(self, attributes):

        if "is_active" not in attributes:
            raise serializers.ValidationError({
                "is_active": "This field is required.",
            })

        return attributes

    @transaction.atomic
    def update(self, user, validated_data):

        user = User.objects.select_for_update().get(
            id=user.id,
        )

        is_active = validated_data["is_active"]

        user.is_active = is_active
        user.save(
            update_fields=[
                "is_active",
            ]
        )

        # Suspending any account deactivates stale Manager assignments,
        # regardless of its current product role.
        if not is_active:
            user.restaurant_assignments.update(
                is_active=False
            )
            user.branch_manager_assignments.update(
                is_active=False
            )

        return user


# =============================================================================
# PLATFORM ADMIN DASHBOARD SUMMARY
# =============================================================================
# The Figma dashboard contains summary cards. These fields are backed only by
# data that currently exists in PostgreSQL; unsupported approval, revenue and
# payment figures are intentionally not invented.
# =============================================================================

class PlatformAdminDashboardSerializer(
    serializers.Serializer
):

    total_restaurants = serializers.IntegerField(
        read_only=True,
    )

    active_restaurants = serializers.IntegerField(
        read_only=True,
    )

    total_users = serializers.IntegerField(
        read_only=True,
    )

    active_users = serializers.IntegerField(
        read_only=True,
    )

    total_bookings = serializers.IntegerField(
        read_only=True,
    )

    pending_bookings = serializers.IntegerField(
        read_only=True,
    )


# =============================================================================
# PLATFORM ADMIN BRANCH MANAGER ASSIGNMENTS
# =============================================================================
class PlatformAdminBranchManagerAssignmentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    assigned_by = serializers.SerializerMethodField()

    class Meta:
        model = BranchManagerAssignment
        fields = [
            "id", "user", "branch", "is_active",
            "assigned_at", "assigned_by",
        ]
        read_only_fields = fields

    def get_user(self, assignment):
        return {
            "id": assignment.user_id,
            "username": assignment.user.username,
            "email": assignment.user.email,
            "role": assignment.user.profile.role,
        }

    def get_branch(self, assignment):
        return {
            "id": assignment.branch_id,
            "name": assignment.branch.name,
            "restaurant_id": assignment.branch.restaurant_id,
            "restaurant_name": assignment.branch.restaurant.name,
            "address": assignment.branch.address,
            "is_active": assignment.branch.is_active,
        }

    def get_assigned_by(self, assignment):
        if assignment.assigned_by is None:
            return None
        return {
            "id": assignment.assigned_by_id,
            "username": assignment.assigned_by.username,
        }


class PlatformAdminBranchManagerAssignmentCreateSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.select_related("profile"),
    )
    branch_id = serializers.PrimaryKeyRelatedField(
        source="branch",
        queryset=Branch.objects.select_related("restaurant"),
    )

    def validate_user_id(self, user):
        if not user.is_active:
            raise serializers.ValidationError(
                "The selected user account is inactive."
            )
        if user.profile.role != UserProfile.Role.BRANCH_MANAGER:
            raise serializers.ValidationError(
                "The selected user must have the Branch Manager role."
            )
        return user

    def validate_branch_id(self, branch):
        if not branch.is_active or not branch.restaurant.is_active:
            raise serializers.ValidationError(
                "Only an active branch of an active restaurant can be assigned."
            )
        return branch

    def validate(self, attributes):
        user = attributes["user"]
        branch = attributes["branch"]

        if BranchManagerAssignment.objects.filter(
            user=user,
            is_active=True,
        ).exclude(branch=branch).exists():
            raise serializers.ValidationError(
                "This Branch Manager already has an active branch assignment."
            )

        if BranchManagerAssignment.objects.filter(
            user=user,
            branch=branch,
        ).exists():
            raise serializers.ValidationError(
                "This assignment already exists. Reactivate the existing record."
            )

        return attributes

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        user = User.objects.select_for_update().get(
            id=validated_data["user"].id
        )
        branch = Branch.objects.select_for_update().select_related(
            "restaurant"
        ).get(id=validated_data["branch"].id)

        self.validate_user_id(user)
        self.validate_branch_id(branch)

        if BranchManagerAssignment.objects.filter(
            user=user,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                "This Branch Manager already has an active branch assignment."
            )

        return BranchManagerAssignment.objects.create(
            user=user,
            branch=branch,
            assigned_by=request.user,
        )


class PlatformAdminBranchManagerAssignmentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchManagerAssignment
        fields = ["is_active"]

    def validate(self, attributes):
        if "is_active" not in attributes:
            raise serializers.ValidationError({
                "is_active": "This field is required.",
            })
        return attributes

    @transaction.atomic
    def update(self, assignment, validated_data):
        assignment = (
            BranchManagerAssignment.objects
            .select_for_update()
            .select_related(
                "user", "user__profile",
                "branch", "branch__restaurant",
            )
            .get(id=assignment.id)
        )

        is_active = validated_data["is_active"]

        if is_active:
            if not assignment.user.is_active:
                raise serializers.ValidationError({
                    "is_active": "An inactive user cannot receive branch access."
                })
            if assignment.user.profile.role != UserProfile.Role.BRANCH_MANAGER:
                raise serializers.ValidationError({
                    "is_active": "Only a Branch Manager assignment can be activated."
                })
            if (
                not assignment.branch.is_active
                or not assignment.branch.restaurant.is_active
            ):
                raise serializers.ValidationError({
                    "is_active": "The assigned branch and restaurant must be active."
                })
            if BranchManagerAssignment.objects.filter(
                user=assignment.user,
                is_active=True,
            ).exclude(id=assignment.id).exists():
                raise serializers.ValidationError({
                    "is_active": "This Branch Manager already has another active branch."
                })

        assignment.is_active = is_active
        assignment.save(update_fields=["is_active"])
        return assignment
