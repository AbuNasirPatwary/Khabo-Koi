from django.contrib.auth.models import User
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import (
    UserProfile,
    RestaurantManagerAssignment,
)

from .models import Restaurant


class ManagerRestaurantAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-restaurant'
        )

        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            cuisine="Test Cuisine",
            description="Test description",
            rating=4.5,
            is_active=True,
        )

        self.other_restaurant = Restaurant.objects.create(
            name="Other Restaurant",
            cuisine="Other Cuisine",
            description="Other description",
            rating=4.0,
            is_active=True,
        )
        self.manager = User.objects.create_user(
            username="manager_test",
            password="testpass123",
        )

        self.manager.profile.role = (
            UserProfile.Role.RESTAURANT_MANAGER
        )
        self.manager.profile.save()

        RestaurantManagerAssignment.objects.create(
            user=self.manager,
            restaurant=self.restaurant,
            is_active=True,
        )

        self.customer = User.objects.create_user(
            username="customer_test",
            password="testpass123",
        )
    def test_anonymous_user_receives_401(self):

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
    def test_customer_receives_403(self):

        refresh = RefreshToken.for_user(
            self.customer
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
    def test_manager_sees_only_assigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]['id'],
            self.restaurant.id,
        )

        returned_ids = [
            restaurant['id']
            for restaurant in response.data
        ]

        self.assertNotIn(
            self.other_restaurant.id,
            returned_ids,
        )
    def test_manager_with_inactive_assignment_receives_403(self):

        RestaurantManagerAssignment.objects.filter(
            user=self.manager,
            restaurant=self.restaurant,
        ).update(
            is_active=False
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
    def test_manager_can_update_assigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.patch(
            self.url,
            {
                'name': 'Updated Restaurant',
                'cuisine': 'Updated Cuisine',
                'description': 'Updated description',
                'image_url': 'https://example.com/image.jpg',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.restaurant.refresh_from_db()

        self.assertEqual(
            self.restaurant.name,
            'Updated Restaurant',
        )

        self.assertEqual(
            self.restaurant.cuisine,
            'Updated Cuisine',
        )
    def test_manager_cannot_update_unassigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.patch(
            self.url,
            {
                'restaurant_id': self.other_restaurant.id,
                'name': 'Should Not Change',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.other_restaurant.refresh_from_db()

        self.assertEqual(
            self.other_restaurant.name,
            'Other Restaurant',
        )
    def test_manager_cannot_update_protected_restaurant_fields(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        original_rating = self.restaurant.rating
        original_is_active = self.restaurant.is_active

        response = self.client.patch(
            self.url,
            {
                'rating': 1.0,
                'is_active': False,
                'name': 'Allowed New Name',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.restaurant.refresh_from_db()

        self.assertEqual(
            self.restaurant.name,
            'Allowed New Name',
        )

        self.assertEqual(
            self.restaurant.rating,
            original_rating,
        )

        self.assertEqual(
            self.restaurant.is_active,
            original_is_active,
        )