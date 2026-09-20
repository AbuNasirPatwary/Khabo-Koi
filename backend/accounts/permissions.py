from rest_framework.permissions import BasePermission

from .models import (
    RestaurantManagerAssignment,
    UserProfile,
)


# =============================================================================
# ROLE CHECKING HELPER
# =============================================================================
# Authentication answers:
#
#     "Who is making this request?"
#
# This helper answers:
#
#     "Does the authenticated, active user have the required product role?"
#
# Keeping this logic in one helper prevents each permission class from
# implementing role checks differently.
# =============================================================================

def user_has_role(user, required_role):

    # AnonymousUser reports is_authenticated=False.
    # Checking it here prevents anonymous requests from continuing.
    if not user or not user.is_authenticated:
        return False

    # An inactive Django account must not receive product access even if its
    # profile still contains a Manager or Admin role.
    if not user.is_active:
        return False

    # getattr safely returns None when the user has no related profile.
    # This protects the application from older or incomplete user records.
    profile = getattr(
        user,
        "profile",
        None,
    )

    if profile is None:
        return False

    return profile.role == required_role


# =============================================================================
# RESTAURANT MANAGER PERMISSION
# =============================================================================
# This permission verifies only the user's product role.
#
# It does not decide which restaurant the Manager may access. Restaurant
# ownership is checked separately using active assignments and filtered
# querysets.
# =============================================================================

class IsRestaurantManager(BasePermission):

    message = (
        "Restaurant Manager access is required."
    )

    def has_permission(self, request, view):

        return user_has_role(
            request.user,
            UserProfile.Role.RESTAURANT_MANAGER,
        )


# =============================================================================
# PLATFORM ADMIN PERMISSION
# =============================================================================
# Platform Admin is an explicit Khabo-Koi product role.
#
# Django's is_staff and is_superuser fields do not automatically grant access
# to the product Admin portal. This keeps Django Admin and Platform Admin as
# separate security concepts.
# =============================================================================

class IsPlatformAdmin(BasePermission):

    message = (
        "Platform Admin access is required."
    )

    def has_permission(self, request, view):

        return user_has_role(
            request.user,
            UserProfile.Role.ADMIN,
        )


# =============================================================================
# ACTIVE RESTAURANT ASSIGNMENT PERMISSION
# =============================================================================
# A RESTAURANT_MANAGER role alone does not grant access to restaurant data.
# The Manager must also have at least one active restaurant assignment.
#
# This permission answers whether the Manager has an active assignment at all.
# Individual APIs must still filter their querysets to the exact restaurants
# returned by get_managed_restaurant_ids().
# =============================================================================

class HasActiveRestaurantAssignment(BasePermission):

    message = (
        "An active restaurant assignment is required."
    )

    def has_permission(self, request, view):

        if not user_has_role(
            request.user,
            UserProfile.Role.RESTAURANT_MANAGER,
        ):
            return False

        return (
            RestaurantManagerAssignment.objects.filter(
                user=request.user,
                is_active=True,
                restaurant__is_active=True,
            ).exists()
        )


# =============================================================================
# MANAGED RESTAURANT QUERY HELPER
# =============================================================================
# Manager endpoints must never trust a restaurant_id supplied by the browser.
#
# Instead, querysets should use IDs obtained from the authenticated user's
# active assignments:
#
#     Restaurant.objects.filter(
#         id__in=get_managed_restaurant_ids(request.user)
#     )
#
# Returning a queryset keeps it efficient for use in Django ORM filters.
# =============================================================================

def get_managed_restaurant_ids(user):

    if not user_has_role(
        user,
        UserProfile.Role.RESTAURANT_MANAGER,
    ):
        return (
            RestaurantManagerAssignment.objects.none()
            .values_list(
                "restaurant_id",
                flat=True,
            )
        )

    return (
        RestaurantManagerAssignment.objects.filter(
            user=user,
            is_active=True,
            restaurant__is_active=True,
        )
        .values_list(
            "restaurant_id",
            flat=True,
        )
    )
