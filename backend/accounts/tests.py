from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from restaurants.models import Restaurant

from .models import (
    RestaurantManagerAssignment,
    UserProfile,
)


User = get_user_model()


# =============================================================================
# USER PROFILE TESTS
# =============================================================================
# These tests verify that every new Django User receives a Khabo-Koi profile
# and starts with the safest public role: CUSTOMER.
#
# They also prove that the role can later be changed deliberately by trusted
# backend logic.
# =============================================================================

class UserProfileModelTests(TestCase):

    def test_new_user_automatically_receives_profile(self):

        user = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="test-password-123",
        )

        self.assertTrue(
            UserProfile.objects.filter(
                user=user,
            ).exists()
        )

    def test_new_user_receives_customer_role_by_default(self):

        user = User.objects.create_user(
            username="new-customer",
            email="new-customer@example.com",
            password="test-password-123",
        )

        self.assertEqual(
            user.profile.role,
            UserProfile.Role.CUSTOMER,
        )

    def test_profile_role_can_be_changed_deliberately(self):

        user = User.objects.create_user(
            username="restaurant-manager",
            email="manager@example.com",
            password="test-password-123",
        )

        user.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        user.profile.save()

        user.profile.refresh_from_db()

        self.assertEqual(
            user.profile.role,
            UserProfile.Role.RESTAURANT_MANAGER,
        )


# =============================================================================
# RESTAURANT MANAGER ASSIGNMENT TESTS
# =============================================================================
# A Restaurant Manager must have:
#
# 1. The RESTAURANT_MANAGER role.
# 2. An active assignment to the restaurant they are managing.
#
# The role and assignment are intentionally separate:
#
# - The role identifies what kind of user they are.
# - The assignment identifies which restaurant they may access.
# =============================================================================

class RestaurantManagerAssignmentModelTests(TestCase):

    def setUp(self):

        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="test-password-123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.platform_admin = User.objects.create_user(
            username="platform-admin",
            email="admin@example.com",
            password="test-password-123",
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            cuisine="Test Cuisine",
        )

    def test_manager_can_be_assigned_to_restaurant(self):

        assignment = (
            RestaurantManagerAssignment.objects.create(
                user=self.manager,
                restaurant=self.restaurant,
                assigned_by=self.platform_admin,
            )
        )

        self.assertEqual(
            assignment.user,
            self.manager,
        )

        self.assertEqual(
            assignment.restaurant,
            self.restaurant,
        )

        self.assertTrue(
            assignment.is_active
        )

        self.assertEqual(
            assignment.assigned_by,
            self.platform_admin,
        )

    def test_assignment_related_names_work(self):

        assignment = (
            RestaurantManagerAssignment.objects.create(
                user=self.manager,
                restaurant=self.restaurant,
                assigned_by=self.platform_admin,
            )
        )

        self.assertEqual(
            self.manager.restaurant_assignments.get(),
            assignment,
        )

        self.assertEqual(
            self.restaurant.manager_assignments.get(),
            assignment,
        )

    def test_duplicate_assignment_is_rejected(self):

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant,
            assigned_by=self.platform_admin,
        )

        # transaction.atomic() isolates the expected database error so the
        # surrounding Django test transaction remains usable.
        with self.assertRaises(IntegrityError):

            with transaction.atomic():

                RestaurantManagerAssignment.objects.create(
                    user=self.manager,
                    restaurant=self.restaurant,
                    assigned_by=self.platform_admin,
                )

    def test_assignment_can_be_deactivated_without_deletion(self):

        assignment = (
            RestaurantManagerAssignment.objects.create(
                user=self.manager,
                restaurant=self.restaurant,
                assigned_by=self.platform_admin,
            )
        )

        assignment.is_active = False
        assignment.save()

        assignment.refresh_from_db()

        self.assertFalse(
            assignment.is_active
        )

        self.assertTrue(
            RestaurantManagerAssignment.objects.filter(
                id=assignment.id,
            ).exists()
        )
