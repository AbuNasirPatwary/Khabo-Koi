from django.conf import settings
from django.db import models


# =============================================================================
# USER PROFILE
# =============================================================================
# Django's built-in User model handles identity information such as username,
# email and password. UserProfile adds Khabo-Koi-specific information without
# replacing or modifying Django's User model.
#
# Relationship:
#
#     Django User
#         |
#         └── UserProfile
#                 └── role
#
# A OneToOneField means one User can have exactly one UserProfile.
# =============================================================================

class UserProfile(models.Model):

    # TextChoices provides a controlled list of valid roles.
    #
    # Keeping roles centralized prevents inconsistent values such as
    # "manager", "restaurant-manager" and "RESTAURANT_MANAGER" from being
    # stored for the same role.
    class Role(models.TextChoices):

        CUSTOMER = (
            "CUSTOMER",
            "Customer",
        )

        RESTAURANT_MANAGER = (
            "RESTAURANT_MANAGER",
            "Restaurant Manager",
        )

        # This role is included so our authentication architecture can support
        # Branch Managers later. We are not implementing its features now.
        BRANCH_MANAGER = (
            "BRANCH_MANAGER",
            "Branch Manager",
        )

        # ADMIN means a Khabo-Koi Platform Admin.
        # It is separate from Django's is_staff and is_superuser flags.
        ADMIN = (
            "ADMIN",
            "Platform Admin",
        )

    # settings.AUTH_USER_MODEL refers to Django's configured User model.
    #
    # CASCADE means that deleting a User also deletes their profile because a
    # profile cannot exist without its user.
    #
    # related_name="profile" allows:
    #
    #     user.profile
    #
    # instead of manually querying UserProfile each time.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # Every new profile starts as CUSTOMER.
    #
    # Manager and Admin roles must be granted deliberately instead of being
    # accepted from public registration data.
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    # Recorded once when the profile is created.
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    # Updated whenever the profile record is saved.
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        # get_role_display() returns the readable label, such as
        # "Restaurant Manager", instead of "RESTAURANT_MANAGER".
        return (
            f"{self.user.username} - "
            f"{self.get_role_display()}"
        )


# =============================================================================
# RESTAURANT MANAGER ASSIGNMENT
# =============================================================================
# Having the RESTAURANT_MANAGER role tells us what kind of user someone is.
# This model tells us which restaurant that manager is allowed to control.
#
# Relationship:
#
#     User
#       |
#       └── RestaurantManagerAssignment
#                   |
#                   └── Restaurant
#
# We use an assignment model instead of adding manager directly to Restaurant
# because it supports:
#
# - A restaurant having multiple managers.
# - A manager being assigned to multiple restaurants if needed later.
# - Temporarily disabling access without deleting assignment history.
# - Recording who created the assignment.
# =============================================================================

class RestaurantManagerAssignment(models.Model):

    # The user receiving access to the restaurant.
    #
    # related_name allows us to retrieve all of a user's assignments with:
    #
    #     user.restaurant_assignments.all()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="restaurant_assignments",
    )

    # A string reference is used instead of importing Restaurant directly.
    # This reduces the chance of circular imports between Django apps.
    #
    # From a Restaurant object, assignments can be accessed with:
    #
    #     restaurant.manager_assignments.all()
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="manager_assignments",
    )

    # Setting this to False revokes the manager's access while preserving the
    # assignment record for history and possible reactivation.
    is_active = models.BooleanField(
        default=True,
    )

    # Recorded once when the assignment is created.
    assigned_at = models.DateTimeField(
        auto_now_add=True,
    )

    # Records which user created the assignment, normally a Platform Admin.
    #
    # SET_NULL preserves the assignment if the assigning administrator is
    # later deleted.
    #
    # null=True permits an empty database value. blank=True permits the field
    # to be left empty in Django forms and Django Admin.
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="restaurant_assignments_created",
    )

    class Meta:

        # Prevent duplicate records for the same user and restaurant.
        #
        # If access needs to be restored, the existing assignment should be
        # reactivated instead of creating another identical assignment.
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "restaurant",
                ],
                name="unique_manager_restaurant_assignment",
            )
        ]

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.restaurant.name}"
        )
