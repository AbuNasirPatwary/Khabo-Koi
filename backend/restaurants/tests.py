from datetime import date, time

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import (
    RestaurantManagerAssignment,
    UserProfile,
)

from .models import (
    Booking,
    Branch,
    FoodItem,
    Restaurant,
    RestaurantTable,
)


User = get_user_model()


# =============================================================================
# PLATFORM ADMIN RESTAURANT OVERSIGHT API TESTS
# =============================================================================
# These tests prove that restaurant visibility and status control are reserved
# for the explicit Khabo-Koi ADMIN role, not merely any authenticated user.
# =============================================================================

class PlatformAdminRestaurantAPITests(APITestCase):

    def setUp(self):

        self.list_url = reverse(
            'platform-admin-restaurant-list'
        )

        self.platform_admin = User.objects.create_user(
            username='restaurant-admin',
            email='restaurant-admin@example.com',
            password='test-password-123',
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        self.customer = User.objects.create_user(
            username='restaurant-customer',
            email='restaurant-customer@example.com',
            password='test-password-123',
        )

        self.manager = User.objects.create_user(
            username='restaurant-manager',
            email='restaurant-manager@example.com',
            password='test-password-123',
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.active_restaurant = Restaurant.objects.create(
            name='Active Restaurant',
            cuisine='Bangladeshi',
            is_active=True,
        )

        self.inactive_restaurant = Restaurant.objects.create(
            name='Inactive Restaurant',
            cuisine='Fusion',
            is_active=False,
        )

        Branch.objects.create(
            restaurant=self.active_restaurant,
            name='Dhanmondi',
        )

        FoodItem.objects.create(
            restaurant=self.active_restaurant,
            name='Kacchi',
            category='Main Course',
            price='450.00',
        )

        self.assignment = (
            RestaurantManagerAssignment.objects.create(
                user=self.manager,
                restaurant=self.active_restaurant,
                assigned_by=self.platform_admin,
            )
        )

    def authenticate(self, user):

        self.client.force_authenticate(
            user=user,
        )

    def status_url(self, restaurant):

        return reverse(
            'platform-admin-restaurant-status',
            kwargs={
                'pk': restaurant.id,
            },
        )

    def test_anonymous_user_cannot_list_restaurants(self):

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_list_restaurants(self):

        self.authenticate(self.customer)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_list_restaurants(self):

        self.authenticate(self.manager)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_platform_admin_sees_active_and_inactive_restaurants(self):

        self.authenticate(self.platform_admin)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            restaurant['id']
            for restaurant in response.data
        }

        self.assertEqual(
            returned_ids,
            {
                self.active_restaurant.id,
                self.inactive_restaurant.id,
            },
        )

    def test_platform_admin_list_contains_operational_counts(self):

        self.authenticate(self.platform_admin)

        response = self.client.get(
            self.list_url,
        )

        active_data = next(
            restaurant
            for restaurant in response.data
            if restaurant['id'] == self.active_restaurant.id
        )

        self.assertEqual(active_data['branch_count'], 1)
        self.assertEqual(active_data['food_item_count'], 1)
        self.assertEqual(active_data['active_manager_count'], 1)

    def test_platform_admin_can_deactivate_restaurant(self):

        self.authenticate(self.platform_admin)

        response = self.client.patch(
            self.status_url(self.active_restaurant),
            {
                'is_active': False,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.active_restaurant.refresh_from_db()
        self.assignment.refresh_from_db()

        self.assertFalse(self.active_restaurant.is_active)
        self.assertFalse(self.assignment.is_active)

    def test_reactivation_does_not_restore_manager_access(self):

        self.active_restaurant.is_active = False
        self.active_restaurant.save(
            update_fields=['is_active']
        )

        self.assignment.is_active = False
        self.assignment.save(
            update_fields=['is_active']
        )

        self.authenticate(self.platform_admin)

        response = self.client.patch(
            self.status_url(self.active_restaurant),
            {
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.active_restaurant.refresh_from_db()
        self.assignment.refresh_from_db()

        self.assertTrue(self.active_restaurant.is_active)
        self.assertFalse(self.assignment.is_active)

    def test_customer_cannot_change_restaurant_status(self):

        self.authenticate(self.customer)

        response = self.client.patch(
            self.status_url(self.active_restaurant),
            {
                'is_active': False,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.active_restaurant.refresh_from_db()

        self.assertTrue(self.active_restaurant.is_active)


# =============================================================================
# PLATFORM ADMIN BOOKING OVERSIGHT API TESTS
# =============================================================================

class PlatformAdminBookingAPITests(APITestCase):

    def setUp(self):

        self.list_url = reverse(
            'platform-admin-booking-list'
        )

        self.platform_admin = User.objects.create_user(
            username='booking-admin',
            email='booking-admin@example.com',
            password='test-password-123',
        )

        self.platform_admin.profile.role = (
            UserProfile.Role.ADMIN
        )

        self.platform_admin.profile.save()

        self.customer = User.objects.create_user(
            username='booking-customer',
            email='booking-customer@example.com',
            password='test-password-123',
        )

        self.manager = User.objects.create_user(
            username='booking-manager',
            email='booking-manager@example.com',
            password='test-password-123',
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )

        self.manager.profile.save()

        self.restaurant = Restaurant.objects.create(
            name='Booking Restaurant',
            cuisine='Bangladeshi',
        )

        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Gulshan',
        )

        self.table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T-10',
            capacity=4,
            seating_type='WINDOW',
        )

        self.customer_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date(2026, 10, 5),
            start_time=time(18, 0),
            end_time=time(19, 30),
            guest_count=3,
            customer_name='Booking Customer',
            customer_phone='01700000000',
            status='CONFIRMED',
        )

        self.guest_booking = Booking.objects.create(
            user=None,
            branch=self.branch,
            table=self.table,
            reservation_date=date(2026, 10, 6),
            start_time=time(20, 0),
            end_time=time(21, 30),
            guest_count=2,
            customer_name='Legacy Guest',
            customer_phone='01800000000',
            status='CANCELLED',
        )

    def authenticate(self, user):

        self.client.force_authenticate(
            user=user,
        )

    def test_anonymous_user_cannot_list_platform_bookings(self):

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_list_platform_bookings(self):

        self.authenticate(self.customer)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_manager_cannot_list_platform_bookings(self):

        self.authenticate(self.manager)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_platform_admin_sees_all_bookings(self):

        self.authenticate(self.platform_admin)

        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = {
            booking['id']
            for booking in response.data
        }

        self.assertEqual(
            returned_ids,
            {
                self.customer_booking.id,
                self.guest_booking.id,
            },
        )

    def test_booking_response_contains_readable_operational_details(self):

        self.authenticate(self.platform_admin)

        response = self.client.get(
            self.list_url,
        )

        booking_data = next(
            booking
            for booking in response.data
            if booking['id'] == self.customer_booking.id
        )

        self.assertEqual(
            booking_data['user']['username'],
            self.customer.username,
        )

        self.assertEqual(
            booking_data['restaurant']['name'],
            self.restaurant.name,
        )

        self.assertEqual(
            booking_data['branch']['name'],
            self.branch.name,
        )

        self.assertEqual(
            booking_data['table']['table_number'],
            self.table.table_number,
        )

        self.assertNotIn('payment', booking_data)
        self.assertNotIn('password', booking_data)

    def test_legacy_booking_without_user_is_supported(self):

        self.authenticate(self.platform_admin)

        response = self.client.get(
            self.list_url,
        )

        booking_data = next(
            booking
            for booking in response.data
            if booking['id'] == self.guest_booking.id
        )

        self.assertIsNone(booking_data['user'])

    def test_booking_oversight_endpoint_is_read_only(self):

        self.authenticate(self.platform_admin)

        response = self.client.post(
            self.list_url,
            {},
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
