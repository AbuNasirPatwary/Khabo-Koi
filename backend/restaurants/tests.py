from datetime import date, timedelta, time
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
    FoodItem,
    RestaurantTable,
    Booking,
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

class ManagerMenuAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-menu-list-create'
        )

        self.restaurant = Restaurant.objects.create(
            name='Menu Restaurant',
            cuisine='Test Cuisine',
        )

        self.other_restaurant = Restaurant.objects.create(
            name='Other Menu Restaurant',
            cuisine='Other Cuisine',
        )

        self.manager = User.objects.create_user(
            username='menu_manager_test',
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
            username='menu_customer_test',
            password='testpass123',
        )

    def test_manager_sees_only_assigned_restaurant_menu_items(self):

        own_item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Own Burger',
            category='Burger',
            description='Own item',
            price=250,
            rating=4.5,
            is_available=True,
        )

        FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Other Burger',
            category='Burger',
            description='Other item',
            price=300,
            rating=4.0,
            is_available=True,
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
            own_item.id,
        )

        self.assertEqual(
            response.data[0]['restaurant'],
            self.restaurant.id,
        )

    def test_manager_can_create_menu_item_for_assigned_restaurant(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'name': 'Chicken Burger',
                'category': 'Burger',
                'description': 'Grilled chicken burger',
                'price': '350.00',
                'image_url': 'https://example.com/burger.jpg',
                'is_available': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        item = FoodItem.objects.get(
            name='Chicken Burger'
        )

        self.assertEqual(
            item.restaurant,
            self.restaurant,
        )

        self.assertEqual(
            item.price,
            350,
        )


    def test_manager_cannot_create_menu_item_for_unassigned_restaurant(self):

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
                'name': 'Unauthorized Item',
                'category': 'Burger',
                'description': 'Should not be created',
                'price': '400.00',
                'is_available': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertFalse(
            FoodItem.objects.filter(
                name='Unauthorized Item'
            ).exists()
        )

    def test_negative_menu_price_is_rejected(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'name': 'Invalid Item',
                'category': 'Test',
                'description': 'Invalid price',
                'price': '-50.00',
                'is_available': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            FoodItem.objects.filter(
                name='Invalid Item'
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

    def test_manager_can_get_own_menu_item_detail(self):

        item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Own Item',
            category='Burger',
            price=250,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
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
            item.id,
        )


    def test_manager_cannot_get_unassigned_menu_item(self):

        item = FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Other Item',
            category='Burger',
            price=300,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_manager_can_update_own_menu_item(self):

        item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Old Item',
            category='Burger',
            price=250,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
        )

        response = self.client.patch(
            url,
            {
                'name': 'Updated Item',
                'category': 'Updated Category',
                'price': '299.00',
                'is_available': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Updated Item',
        )

        self.assertEqual(
            item.price,
            299,
        )

    def test_manager_cannot_update_unassigned_menu_item(self):

        item = FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Other Item',
            category='Burger',
            price=300,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
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

        item.refresh_from_db()

        self.assertEqual(
            item.name,
            'Other Item',
        )

    def test_manager_can_deactivate_own_menu_item(self):

        item = FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Active Item',
            category='Burger',
            price=250,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        item.refresh_from_db()

        self.assertFalse(
            item.is_available
        )

        self.assertTrue(
            FoodItem.objects.filter(
                id=item.id
            ).exists()
        )

    def test_manager_cannot_deactivate_unassigned_menu_item(self):

        item = FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Other Active Item',
            category='Burger',
            price=300,
            is_available=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-menu-detail',
            args=[item.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        item.refresh_from_db()

        self.assertTrue(
            item.is_available
        )

class ManagerTableAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-table-list-create'
        )

        self.restaurant = Restaurant.objects.create(
            name='Table Restaurant',
            cuisine='Test Cuisine',
        )

        self.other_restaurant = Restaurant.objects.create(
            name='Other Table Restaurant',
            cuisine='Other Cuisine',
        )

        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
        )

        self.other_branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
        )

        self.manager = User.objects.create_user(
            username='table_manager_test',
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
            username='table_customer_test',
            password='testpass123',
        )

    def test_manager_sees_only_assigned_restaurant_tables(self):

        own_table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T1',
            capacity=4,
            seating_type='INDOOR',
        )

        RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='T2',
            capacity=4,
            seating_type='INDOOR',
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
            own_table.id,
        )


    def test_manager_can_create_table_for_owned_branch(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'branch_id': self.branch.id,
                'table_number': 'T10',
                'capacity': 6,
                'seating_type': 'WINDOW',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        table = RestaurantTable.objects.get(
            table_number='T10'
        )

        self.assertEqual(
            table.branch,
            self.branch,
        )

        self.assertEqual(
            table.capacity,
            6,
        )

    def test_manager_cannot_create_table_for_unassigned_branch(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'branch_id': self.other_branch.id,
                'table_number': 'T20',
                'capacity': 4,
                'seating_type': 'INDOOR',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertFalse(
            RestaurantTable.objects.filter(
                branch=self.other_branch,
                table_number='T20',
            ).exists()
        )


    def test_table_capacity_must_be_greater_than_zero(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'branch_id': self.branch.id,
                'table_number': 'T30',
                'capacity': 0,
                'seating_type': 'INDOOR',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


    def test_invalid_seating_type_is_rejected(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'branch_id': self.branch.id,
                'table_number': 'T40',
                'capacity': 4,
                'seating_type': 'INVALID',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


    def test_duplicate_table_number_in_same_branch_is_rejected(self):

        RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T50',
            capacity=4,
            seating_type='INDOOR',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.post(
            self.url,
            {
                'branch_id': self.branch.id,
                'table_number': 'T50',
                'capacity': 6,
                'seating_type': 'WINDOW',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            RestaurantTable.objects.filter(
                branch=self.branch,
                table_number='T50',
            ).count(),
            1,
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

    def test_manager_can_get_own_table_detail(self):

        table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T60',
            capacity=4,
            seating_type='INDOOR',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
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
            table.id,
        )


    def test_manager_cannot_get_unassigned_table(self):

        table = RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='T70',
            capacity=4,
            seating_type='INDOOR',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_manager_can_update_own_table(self):

        table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T80',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.patch(
            url,
            {
                'table_number': 'T81',
                'capacity': 6,
                'seating_type': 'WINDOW',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        table.refresh_from_db()

        self.assertEqual(
            table.table_number,
            'T81',
        )

        self.assertEqual(
            table.capacity,
            6,
        )

        self.assertEqual(
            table.seating_type,
            'WINDOW',
        )


    def test_manager_cannot_update_unassigned_table(self):

        table = RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='T90',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.patch(
            url,
            {
                'capacity': 8,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        table.refresh_from_db()

        self.assertEqual(
            table.capacity,
            4,
        )

    def test_duplicate_table_number_on_update_is_rejected(self):

        RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T100',
            capacity=4,
            seating_type='INDOOR',
        )

        table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T101',
            capacity=4,
            seating_type='WINDOW',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.patch(
            url,
            {
                'table_number': 'T100',
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        table.refresh_from_db()

        self.assertEqual(
            table.table_number,
            'T101',
        )


    def test_manager_can_deactivate_own_table(self):

        table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T110',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        table.refresh_from_db()

        self.assertFalse(
            table.is_active
        )

        self.assertTrue(
            RestaurantTable.objects.filter(
                id=table.id
            ).exists()
        )


    def test_manager_cannot_deactivate_unassigned_table(self):

        table = RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='T120',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.delete(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        table.refresh_from_db()

        self.assertTrue(
            table.is_active
        )

    def test_manager_cannot_move_table_to_unassigned_branch(self):

        table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='T130',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-table-detail',
            args=[table.id],
        )

        response = self.client.patch(
            url,
            {
                'branch_id': self.other_branch.id,
                'capacity': 6,
            },
            format='json',
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        table.refresh_from_db()

        # Normal editable fields can change...
        self.assertEqual(
            table.capacity,
            6,
        )

        # ...but the table must remain in its original owned branch.
        self.assertEqual(
            table.branch,
            self.branch,
        )

        self.assertNotEqual(
            table.branch,
            self.other_branch,
        )

class ManagerReservationAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-reservation-list'
        )

        self.restaurant = Restaurant.objects.create(
            name='Reservation Restaurant',
            cuisine='Test Cuisine',
        )

        self.other_restaurant = Restaurant.objects.create(
            name='Other Reservation Restaurant',
            cuisine='Other Cuisine',
        )

        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
        )

        self.other_branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
        )

        self.table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='R1',
            capacity=4,
            seating_type='INDOOR',
        )

        self.other_table = RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='R2',
            capacity=4,
            seating_type='INDOOR',
        )

        self.manager = User.objects.create_user(
            username='reservation_manager_test',
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
            username='reservation_customer_test',
            password='testpass123',
        )

        self.own_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today(),
            start_time=time(18, 0),
            end_time=time(19, 30),
            guest_count=2,
            customer_name='Rakibul Customer',
            customer_phone='01700000000',
            status='CONFIRMED',
        )

        self.other_booking = Booking.objects.create(
            user=self.customer,
            branch=self.other_branch,
            table=self.other_table,
            reservation_date=date.today(),
            start_time=time(19, 0),
            end_time=time(20, 30),
            guest_count=2,
            customer_name='Other Customer',
            customer_phone='01800000000',
            status='CONFIRMED',
        )

    def test_manager_sees_only_owned_restaurant_reservations(self):

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
            self.own_booking.id,
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

    def test_manager_can_filter_reservations_by_status(self):

        pending_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today() + timedelta(days=1),
            start_time=time(16, 0),
            end_time=time(17, 30),
            guest_count=3,
            customer_name='Pending Customer',
            customer_phone='01900000000',
            status='PENDING',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'status': 'PENDING',
            },
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
            pending_booking.id,
        )


    def test_manager_can_filter_reservations_by_date(self):

        tomorrow = date.today() + timedelta(days=1)

        tomorrow_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=tomorrow,
            start_time=time(17, 0),
            end_time=time(18, 30),
            guest_count=2,
            customer_name='Tomorrow Customer',
            customer_phone='01600000000',
            status='CONFIRMED',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'date': tomorrow.isoformat(),
            },
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
            tomorrow_booking.id,
        )


    def test_manager_can_search_reservations_by_customer(self):

        searched_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today() + timedelta(days=2),
            start_time=time(15, 0),
            end_time=time(16, 30),
            guest_count=4,
            customer_name='Special Search Name',
            customer_phone='01512345678',
            status='CONFIRMED',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'search': 'Special Search',
            },
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
            searched_booking.id,
        )

    def test_manager_can_filter_reservations_by_branch(self):

        second_branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Second Branch',
            address='Dhaka',
            phone='01300000000',
            opening_time='09:00',
            closing_time='22:00',
        )

        second_table = RestaurantTable.objects.create(
            branch=second_branch,
            table_number='R3',
            capacity=4,
            seating_type='INDOOR',
        )

        branch_booking = Booking.objects.create(
            user=self.customer,
            branch=second_branch,
            table=second_table,
            reservation_date=date.today(),
            start_time=time(16, 0),
            end_time=time(17, 30),
            guest_count=2,
            customer_name='Branch Customer',
            customer_phone='01400000000',
            status='CONFIRMED',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'branch': second_branch.id,
            },
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
            branch_booking.id,
        )


    def test_manager_can_filter_reservations_by_table(self):

        second_table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='R4',
            capacity=6,
            seating_type='WINDOW',
        )

        table_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=second_table,
            reservation_date=date.today(),
            start_time=time(15, 0),
            end_time=time(16, 30),
            guest_count=3,
            customer_name='Table Customer',
            customer_phone='01312345678',
            status='CONFIRMED',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'table': second_table.id,
            },
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
            table_booking.id,
        )


    def test_manager_can_filter_reservations_by_scope(self):

        past_booking = Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today() - timedelta(days=1),
            start_time=time(14, 0),
            end_time=time(15, 30),
            guest_count=2,
            customer_name='Past Customer',
            customer_phone='01200000000',
            status='COMPLETED',
        )

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        response = self.client.get(
            self.url,
            {
                'scope': 'history',
            },
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
            past_booking.id,
        )

    def test_manager_can_get_own_reservation_detail(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-reservation-detail',
            args=[self.own_booking.id],
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
            self.own_booking.id,
        )

        self.assertEqual(
            response.data['restaurant_id'],
            self.restaurant.id,
        )


    def test_manager_cannot_get_unassigned_reservation_detail(self):

        refresh = RefreshToken.for_user(
            self.manager
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )

        url = reverse(
            'manager-reservation-detail',
            args=[self.other_booking.id],
        )

        response = self.client.get(
            url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

class ManagerDashboardAPITests(APITestCase):

    def setUp(self):

        self.url = reverse(
            'manager-dashboard'
        )

        self.restaurant = Restaurant.objects.create(
            name='Dashboard Restaurant',
            cuisine='Test Cuisine',
        )

        self.other_restaurant = Restaurant.objects.create(
            name='Other Dashboard Restaurant',
            cuisine='Other Cuisine',
        )

        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
            is_active=True,
        )

        self.other_branch = Branch.objects.create(
            restaurant=self.other_restaurant,
            name='Other Branch',
            address='Dhaka',
            phone='0123456789',
            opening_time='09:00',
            closing_time='22:00',
            is_active=True,
        )

        self.table = RestaurantTable.objects.create(
            branch=self.branch,
            table_number='D1',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        self.other_table = RestaurantTable.objects.create(
            branch=self.other_branch,
            table_number='D2',
            capacity=4,
            seating_type='INDOOR',
            is_active=True,
        )

        FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Manager Food',
            category='Main',
            price=300,
            is_available=True,
        )

        FoodItem.objects.create(
            restaurant=self.other_restaurant,
            name='Other Food',
            category='Main',
            price=400,
            is_available=True,
        )

        self.manager = User.objects.create_user(
            username='dashboard_manager_test',
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
            username='dashboard_customer_test',
            password='testpass123',
        )

        Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today(),
            start_time=time(18, 0),
            end_time=time(19, 30),
            guest_count=2,
            customer_name='Dashboard Customer',
            customer_phone='01700000000',
            status='PENDING',
        )

        Booking.objects.create(
            user=self.customer,
            branch=self.other_branch,
            table=self.other_table,
            reservation_date=date.today(),
            start_time=time(18, 0),
            end_time=time(19, 30),
            guest_count=2,
            customer_name='Other Customer',
            customer_phone='01800000000',
            status='PENDING',
        )

    def test_dashboard_counts_only_managed_restaurant_data(self):

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
            response.data['restaurants'],
            1,
        )

        self.assertEqual(
            response.data['reservations']['total'],
            1,
        )

        self.assertEqual(
            response.data['reservations']['today'],
            1,
        )

        self.assertEqual(
            response.data['reservations']['pending'],
            1,
        )

        self.assertEqual(
            response.data['branches']['total'],
            1,
        )

        self.assertEqual(
            response.data['tables']['total'],
            1,
        )

        self.assertEqual(
            response.data['menu_items']['total'],
            1,
        )


    def test_dashboard_anonymous_user_receives_401(self):

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


    def test_dashboard_customer_receives_403(self):

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

    def test_dashboard_active_available_and_upcoming_counts(self):

        Branch.objects.create(
            restaurant=self.restaurant,
            name='Inactive Branch',
            address='Dhaka',
            phone='01911111111',
            opening_time='09:00',
            closing_time='22:00',
            is_active=False,
        )

        RestaurantTable.objects.create(
            branch=self.branch,
            table_number='D3',
            capacity=4,
            seating_type='WINDOW',
            is_active=False,
        )

        FoodItem.objects.create(
            restaurant=self.restaurant,
            name='Unavailable Food',
            category='Main',
            price=250,
            is_available=False,
        )

        Booking.objects.create(
            user=self.customer,
            branch=self.branch,
            table=self.table,
            reservation_date=date.today() + timedelta(days=1),
            start_time=time(16, 0),
            end_time=time(17, 30),
            guest_count=2,
            customer_name='Future Customer',
            customer_phone='01922222222',
            status='CONFIRMED',
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
            response.data['reservations']['upcoming'],
            1,
        )

        self.assertEqual(
            response.data['branches']['total'],
            2,
        )

        self.assertEqual(
            response.data['branches']['active'],
            1,
        )

        self.assertEqual(
            response.data['tables']['total'],
            2,
        )

        self.assertEqual(
            response.data['tables']['active'],
            1,
        )

        self.assertEqual(
            response.data['menu_items']['total'],
            2,
        )

        self.assertEqual(
            response.data['menu_items']['available'],
            1,
        )