from django.contrib.auth.models import User
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import (
    UserProfile,
    RestaurantManagerAssignment,
)

from .models import (
    Restaurant,
    Branch,
)


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

class ManagerBranchAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-branch-list-create'
        )

        self.restaurant = Restaurant.objects.create(
            name='Manager Restaurant',
            cuisine='Test Cuisine',
        )

        self.other_restaurant = Restaurant.objects.create(
            name='Other Restaurant',
            cuisine='Other Cuisine',
        )

        self.manager = User.objects.create_user(
            username='branch_manager_test',
            password='testpass123',
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
            username='branch_customer_test',
            password='testpass123',
        )

    def test_manager_sees_only_assigned_restaurant_branches(self):

        own_branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Own Branch',
            address='Own Address',
        )

        Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Branch',
            address='Other Address',
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
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]['id'],
            own_branch.id,
        )

        self.assertEqual(
            response.data[0]['restaurant'],
            self.restaurant.id,
        )

    def test_manager_can_create_branch_for_assigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'name': 'New Branch',
                'address': 'New Address',
                'phone': '0123456789',
                'opening_time': '10:00:00',
                'closing_time': '22:00:00',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        branch = Branch.objects.get(
            name='New Branch'
        )

        self.assertEqual(
            branch.restaurant,
            self.restaurant,
        )

    def test_manager_cannot_create_branch_for_unassigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'restaurant_id': self.other_restaurant.id,
                'name': 'Unauthorized Branch',
                'address': 'Should Not Be Created',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertFalse(
            Branch.objects.filter(
                name='Unauthorized Branch'
            ).exists()
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

    def test_manager_can_get_own_branch_detail(self):

        branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Own Detail Branch',
            address='Own Address',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data['id'],
            branch.id,
        )

    def test_manager_cannot_get_unassigned_branch(self):

        branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Detail Branch',
            address='Other Address',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_manager_can_update_own_branch(self):

        branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Old Branch Name',
            address='Old Address',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.patch(
            url,
            {
                'name': 'Updated Branch Name',
                'address': 'Updated Address',
                'phone': '01700000000',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        branch.refresh_from_db()

        self.assertEqual(
            branch.name,
            'Updated Branch Name',
        )

        self.assertEqual(
            branch.address,
            'Updated Address',
        )

    def test_manager_cannot_update_unassigned_branch(self):

        branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Branch',
            address='Other Address',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.patch(
            url,
            {
                'name': 'Should Not Change',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        branch.refresh_from_db()

        self.assertEqual(
            branch.name,
            'Other Branch',
        )

    def test_manager_can_deactivate_own_branch(self):

        branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Active Branch',
            address='Some Address',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        branch.refresh_from_db()

        self.assertFalse(
            branch.is_active
        )

        self.assertTrue(
            Branch.objects.filter(
                id=branch.id
            ).exists()
        )

    def test_manager_cannot_deactivate_unassigned_branch(self):

        branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Active Branch',
            address='Other Address',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-branch-detail',
            args=[branch.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        branch.refresh_from_db()

        self.assertTrue(
            branch.is_active
        )