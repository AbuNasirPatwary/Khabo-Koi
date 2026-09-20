from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import (
    APIRequestFactory,
    APITestCase,
)

from restaurants.models import Restaurant

from .models import (
    RestaurantManagerAssignment,
    UserProfile,
)
from .permissions import (
    HasActiveRestaurantAssignment,
    IsPlatformAdmin,
    IsRestaurantManager,
    get_managed_restaurant_ids,
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
# =============================================================================
# ROLE AND ASSIGNMENT PERMISSION TESTS
# =============================================================================
# These tests prove that authentication, role and restaurant assignment are
# separate security requirements.
#
# A logged-in user is not automatically a Manager or Platform Admin.
# A Manager role does not automatically grant access to every restaurant.
# A Django staff account is not automatically a Khabo-Koi Platform Admin.
# =============================================================================

class RolePermissionTests(TestCase):

    def setUp(self):

        # APIRequestFactory creates lightweight requests that can be passed
        # directly to DRF permission classes.
        self.request_factory = APIRequestFactory()

        self.customer = User.objects.create_user(
            username="permission-customer",
            email="permission-customer@example.com",
            password="test-password-123",
        )

        self.manager = User.objects.create_user(
            username="permission-manager",
            email="permission-manager@example.com",
            password="test-password-123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.platform_admin = User.objects.create_user(
            username="permission-admin",
            email="permission-admin@example.com",
            password="test-password-123",
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        # This user can access Django Admin because is_staff=True, but must not
        # automatically receive access to the Khabo-Koi Platform Admin portal.
        self.django_staff_user = User.objects.create_user(
            username="django-staff",
            email="django-staff@example.com",
            password="test-password-123",
            is_staff=True,
        )

        self.restaurant_one = Restaurant.objects.create(
            name="Restaurant One",
            cuisine="Test Cuisine",
        )

        self.restaurant_two = Restaurant.objects.create(
            name="Restaurant Two",
            cuisine="Test Cuisine",
        )

    def create_request(self, user):

        request = self.request_factory.get(
            "/test-permission/"
        )

        # In a real API request DRF authentication sets request.user.
        # Assigning it directly lets us test permission behavior in isolation.
        request.user = user

        return request

    def test_anonymous_user_is_denied_by_all_permissions(self):

        request = self.create_request(
            AnonymousUser()
        )

        self.assertFalse(
            IsRestaurantManager().has_permission(
                request,
                view=None,
            )
        )

        self.assertFalse(
            IsPlatformAdmin().has_permission(
                request,
                view=None,
            )
        )

        self.assertFalse(
            HasActiveRestaurantAssignment().has_permission(
                request,
                view=None,
            )
        )

    def test_customer_is_not_manager_or_platform_admin(self):

        request = self.create_request(
            self.customer
        )

        self.assertFalse(
            IsRestaurantManager().has_permission(
                request,
                view=None,
            )
        )

        self.assertFalse(
            IsPlatformAdmin().has_permission(
                request,
                view=None,
            )
        )

    def test_customer_with_assignment_is_still_not_manager(self):

        # An assignment alone must not grant Manager access. The user must
        # also have the RESTAURANT_MANAGER role.
        RestaurantManagerAssignment.objects.create(
            user=self.customer,
            restaurant=self.restaurant_one,
        )

        request = self.create_request(
            self.customer
        )

        self.assertFalse(
            HasActiveRestaurantAssignment().has_permission(
                request,
                view=None,
            )
        )

    def test_restaurant_manager_role_is_accepted(self):

        request = self.create_request(
            self.manager
        )

        self.assertTrue(
            IsRestaurantManager().has_permission(
                request,
                view=None,
            )
        )

        self.assertFalse(
            IsPlatformAdmin().has_permission(
                request,
                view=None,
            )
        )

    def test_platform_admin_role_is_accepted(self):

        request = self.create_request(
            self.platform_admin
        )

        self.assertTrue(
            IsPlatformAdmin().has_permission(
                request,
                view=None,
            )
        )

        self.assertFalse(
            IsRestaurantManager().has_permission(
                request,
                view=None,
            )
        )

    def test_django_staff_is_not_automatically_platform_admin(self):

        request = self.create_request(
            self.django_staff_user
        )

        self.assertFalse(
            IsPlatformAdmin().has_permission(
                request,
                view=None,
            )
        )

    def test_inactive_manager_is_denied(self):

        self.manager.is_active = False

        self.manager.save(
            update_fields=[
                "is_active",
            ]
        )

        request = self.create_request(
            self.manager
        )

        self.assertFalse(
            IsRestaurantManager().has_permission(
                request,
                view=None,
            )
        )

    def test_manager_without_assignment_is_denied_assignment_access(self):

        request = self.create_request(
            self.manager
        )

        self.assertFalse(
            HasActiveRestaurantAssignment().has_permission(
                request,
                view=None,
            )
        )

    def test_manager_with_active_assignment_is_accepted(self):

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant_one,
            assigned_by=self.platform_admin,
        )

        request = self.create_request(
            self.manager
        )

        self.assertTrue(
            HasActiveRestaurantAssignment().has_permission(
                request,
                view=None,
            )
        )

    def test_inactive_assignment_does_not_grant_access(self):

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant_one,
            assigned_by=self.platform_admin,
            is_active=False,
        )

        request = self.create_request(
            self.manager
        )

        self.assertFalse(
            HasActiveRestaurantAssignment().has_permission(
                request,
                view=None,
            )
        )

    def test_managed_restaurant_ids_include_only_active_assignments(self):

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant_one,
            assigned_by=self.platform_admin,
            is_active=True,
        )

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant_two,
            assigned_by=self.platform_admin,
            is_active=False,
        )

        managed_restaurant_ids = list(
            get_managed_restaurant_ids(
                self.manager
            )
        )

        self.assertEqual(
            managed_restaurant_ids,
            [
                self.restaurant_one.id,
            ],
        )
# =============================================================================
# AUTHENTICATED PROFILE API TESTS
# =============================================================================
# These tests exercise the real /api/accounts/profile/ endpoint.
#
# The endpoint gives React enough information to:
#
# - display the authenticated user's identity;
# - choose the correct Customer, Manager or Admin interface;
# - show a Restaurant Manager only their actively assigned restaurants.
#
# It must never expose passwords, JWT tokens or inactive assignments.
# =============================================================================

class ProfileAPITests(APITestCase):

    def setUp(self):

        self.profile_url = reverse(
            "profile"
        )

        self.customer = User.objects.create_user(
            username="profile-customer",
            email="profile-customer@example.com",
            password="test-password-123",
        )

        self.manager = User.objects.create_user(
            username="profile-manager",
            email="profile-manager@example.com",
            password="test-password-123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.platform_admin = User.objects.create_user(
            username="profile-admin",
            email="profile-admin@example.com",
            password="test-password-123",
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        # The names intentionally use reverse alphabetical creation order.
        # This lets the test prove that the API sorts them by name.
        self.zulu_restaurant = Restaurant.objects.create(
            name="Zulu Restaurant",
            cuisine="Test Cuisine",
        )

        self.alpha_restaurant = Restaurant.objects.create(
            name="Alpha Restaurant",
            cuisine="Test Cuisine",
        )

        self.inactive_restaurant = Restaurant.objects.create(
            name="Inactive Restaurant",
            cuisine="Test Cuisine",
        )

    def authenticate(self, user):

        # force_authenticate keeps these tests focused on the profile endpoint.
        # JWT login behavior is provided separately by SimpleJWT.
        self.client.force_authenticate(
            user=user
        )

    def test_anonymous_user_cannot_access_profile(self):

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_receives_identity_role_and_no_assignments(self):

        self.authenticate(
            self.customer
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data,
            {
                "id": self.customer.id,
                "username": self.customer.username,
                "email": self.customer.email,
                "role": UserProfile.Role.CUSTOMER,
                "assigned_restaurants": [],
            },
        )

    def test_manager_receives_only_active_assigned_restaurants(self):

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.zulu_restaurant,
            assigned_by=self.platform_admin,
            is_active=True,
        )

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.alpha_restaurant,
            assigned_by=self.platform_admin,
            is_active=True,
        )

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.inactive_restaurant,
            assigned_by=self.platform_admin,
            is_active=False,
        )

        self.authenticate(
            self.manager
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        # Active assignments are ordered alphabetically for predictable UI.
        self.assertEqual(
            response.data["assigned_restaurants"],
            [
                {
                    "id": self.alpha_restaurant.id,
                    "name": self.alpha_restaurant.name,
                },
                {
                    "id": self.zulu_restaurant.id,
                    "name": self.zulu_restaurant.name,
                },
            ],
        )

    def test_platform_admin_receives_admin_role_and_no_assignments(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["role"],
            UserProfile.Role.ADMIN,
        )

        self.assertEqual(
            response.data["assigned_restaurants"],
            [],
        )

    def test_customer_assignment_does_not_leak_manager_access(self):

        # Even if incorrect data assigns a restaurant to a Customer, the API
        # must not treat that Customer as a Restaurant Manager.
        RestaurantManagerAssignment.objects.create(
            user=self.customer,
            restaurant=self.alpha_restaurant,
            assigned_by=self.platform_admin,
        )

        self.authenticate(
            self.customer
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.data["assigned_restaurants"],
            [],
        )

    def test_profile_does_not_expose_sensitive_fields(self):

        self.authenticate(
            self.manager
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertNotIn(
            "password",
            response.data,
        )

        self.assertNotIn(
            "access",
            response.data,
        )

        self.assertNotIn(
            "refresh",
            response.data,
        )


# =============================================================================
# PLATFORM ADMIN USER LIST API TESTS
# =============================================================================
# These tests verify that the user overview is available only to an explicit
# Khabo-Koi Platform Admin.
#
# Being authenticated, having the Restaurant Manager role, or having Django's
# is_staff flag must not independently grant Platform Admin access.
# =============================================================================

class PlatformAdminUserListAPITests(APITestCase):

    def setUp(self):

        self.user_list_url = reverse(
            "platform_admin_user_list"
        )

        self.customer = User.objects.create_user(
            username="zulu-customer",
            email="customer@example.com",
            password="test-password-123",
        )

        self.manager = User.objects.create_user(
            username="alpha-manager",
            email="manager@example.com",
            password="test-password-123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.platform_admin = User.objects.create_user(
            username="middle-admin",
            email="admin@example.com",
            password="test-password-123",
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        # Django staff access and Khabo-Koi Platform Admin access are separate.
        self.django_staff_user = User.objects.create_user(
            username="django-staff",
            email="django-staff@example.com",
            password="test-password-123",
            is_staff=True,
        )

        # Suspended accounts must remain visible in the Admin overview.
        self.inactive_customer = User.objects.create_user(
            username="inactive-customer",
            email="inactive@example.com",
            password="test-password-123",
            is_active=False,
        )

    def authenticate(self, user):

        # JWT behavior is tested separately. force_authenticate lets these
        # tests focus specifically on endpoint authorization and output.
        self.client.force_authenticate(
            user=user
        )

    def test_anonymous_user_cannot_list_users(self):

        response = self.client.get(
            self.user_list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_list_users(self):

        self.authenticate(
            self.customer
        )

        response = self.client.get(
            self.user_list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_restaurant_manager_cannot_list_users(self):

        self.authenticate(
            self.manager
        )

        response = self.client.get(
            self.user_list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_django_staff_user_is_not_platform_admin(self):

        self.authenticate(
            self.django_staff_user
        )

        response = self.client.get(
            self.user_list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_platform_admin_receives_all_users_in_username_order(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.get(
            self.user_list_url
        )

        expected_usernames = list(
            User.objects
            .order_by(
                "username",
            )
            .values_list(
                "username",
                flat=True,
            )
        )

        returned_usernames = [
            user_data["username"]
            for user_data in response.data
        ]

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            returned_usernames,
            expected_usernames,
        )

        users_by_username = {
            user_data["username"]: user_data
            for user_data in response.data
        }

        # The Admin table must show product roles, not Django staff status.
        self.assertEqual(
            users_by_username[
                self.manager.username
            ]["role"],
            UserProfile.Role.RESTAURANT_MANAGER,
        )

        self.assertEqual(
            users_by_username[
                self.platform_admin.username
            ]["role"],
            UserProfile.Role.ADMIN,
        )

        self.assertEqual(
            users_by_username[
                self.django_staff_user.username
            ]["role"],
            UserProfile.Role.CUSTOMER,
        )

        inactive_user_data = next(
            user_data
            for user_data in response.data
            if user_data["id"]
            == self.inactive_customer.id
        )

        self.assertFalse(
            inactive_user_data["is_active"]
        )

    def test_user_list_exposes_only_approved_fields(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.get(
            self.user_list_url
        )

        approved_fields = {
            "id",
            "username",
            "email",
            "role",
            "is_active",
            "date_joined",
        }

        for user_data in response.data:

            self.assertEqual(
                set(user_data.keys()),
                approved_fields,
            )

            self.assertNotIn(
                "password",
                user_data,
            )

            self.assertNotIn(
                "is_staff",
                user_data,
            )

            self.assertNotIn(
                "is_superuser",
                user_data,
            )


# =============================================================================
# PLATFORM ADMIN ROLE UPDATE API TESTS
# =============================================================================
# Role changes alter authorization, so this endpoint receives stricter tests
# than an ordinary profile-editing endpoint.
#
# The tests prove that only a Platform Admin may change another user's role,
# invalid roles are rejected, self-demotion is blocked, and Manager access is
# removed safely when a Manager is changed to another role.
# =============================================================================

class PlatformAdminRoleUpdateAPITests(APITestCase):

    def setUp(self):

        self.customer = User.objects.create_user(
            username="role-customer",
            email="role-customer@example.com",
            password="test-password-123",
        )

        self.manager = User.objects.create_user(
            username="role-manager",
            email="role-manager@example.com",
            password="test-password-123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.platform_admin = User.objects.create_user(
            username="role-admin",
            email="role-admin@example.com",
            password="test-password-123",
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        self.restaurant = Restaurant.objects.create(
            name="Role Test Restaurant",
            cuisine="Test Cuisine",
        )

    def role_url(self, user):

        return reverse(
            "platform_admin_role_update",
            kwargs={
                "user_id": user.id,
            },
        )

    def authenticate(self, user):

        self.client.force_authenticate(
            user=user
        )

    def test_anonymous_user_cannot_change_role(self):

        response = self.client.patch(
            self.role_url(
                self.customer
            ),
            {
                "role": UserProfile.Role.RESTAURANT_MANAGER,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_change_role(self):

        self.authenticate(
            self.customer
        )

        response = self.client.patch(
            self.role_url(
                self.manager
            ),
            {
                "role": UserProfile.Role.CUSTOMER,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_restaurant_manager_cannot_change_role(self):

        self.authenticate(
            self.manager
        )

        response = self.client.patch(
            self.role_url(
                self.customer
            ),
            {
                "role": UserProfile.Role.RESTAURANT_MANAGER,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_platform_admin_can_promote_customer_to_manager(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.patch(
            self.role_url(
                self.customer
            ),
            {
                "role": UserProfile.Role.RESTAURANT_MANAGER,
            },
            format="json",
        )

        self.customer.profile.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            self.customer.profile.role,
            UserProfile.Role.RESTAURANT_MANAGER,
        )

        self.assertEqual(
            response.data["role"],
            UserProfile.Role.RESTAURANT_MANAGER,
        )

        # A Manager role alone grants no restaurant access. The Platform Admin
        # must create a restaurant assignment in a separate operation.
        self.assertFalse(
            self.customer.restaurant_assignments.exists()
        )

    def test_invalid_role_is_rejected_without_changing_profile(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.patch(
            self.role_url(
                self.customer
            ),
            {
                "role": "NOT_A_REAL_ROLE",
            },
            format="json",
        )

        self.customer.profile.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            self.customer.profile.role,
            UserProfile.Role.CUSTOMER,
        )

    def test_platform_admin_cannot_change_own_role(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.patch(
            self.role_url(
                self.platform_admin
            ),
            {
                "role": UserProfile.Role.CUSTOMER,
            },
            format="json",
        )

        self.platform_admin.profile.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            self.platform_admin.profile.role,
            UserProfile.Role.ADMIN,
        )

    def test_demoting_manager_deactivates_restaurant_assignments(self):

        assignment = RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant,
            assigned_by=self.platform_admin,
            is_active=True,
        )

        self.authenticate(
            self.platform_admin
        )

        response = self.client.patch(
            self.role_url(
                self.manager
            ),
            {
                "role": UserProfile.Role.CUSTOMER,
            },
            format="json",
        )

        self.manager.profile.refresh_from_db()
        assignment.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            self.manager.profile.role,
            UserProfile.Role.CUSTOMER,
        )

        self.assertFalse(
            assignment.is_active
        )

    def test_role_endpoint_rejects_put_requests(self):

        self.authenticate(
            self.platform_admin
        )

        response = self.client.put(
            self.role_url(
                self.customer
            ),
            {
                "role": UserProfile.Role.RESTAURANT_MANAGER,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_missing_user_returns_not_found(self):

        self.authenticate(
            self.platform_admin
        )

        missing_user_url = reverse(
            "platform_admin_role_update",
            kwargs={
                "user_id": 999999,
            },
        )

        response = self.client.patch(
            missing_user_url,
            {
                "role": UserProfile.Role.CUSTOMER,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
