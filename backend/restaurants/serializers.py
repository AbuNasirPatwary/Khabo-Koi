from django.db import transaction
from rest_framework import serializers

from .models import (
    Restaurant,
    Branch,
    FoodItem,
    RestaurantTable,
    Booking,
)


# =============================================================================
# RESTAURANT TABLE
# =============================================================================

class RestaurantTableSerializer(serializers.ModelSerializer):

    class Meta:
        model = RestaurantTable

        fields = [
            'id',
            'table_number',
            'capacity',
            'seating_type',
            'is_active',
        ]


# =============================================================================
# BRANCH
# =============================================================================

class BranchSerializer(serializers.ModelSerializer):

    tables = RestaurantTableSerializer(
        many=True,
        read_only=True,
    )


    class Meta:
        model = Branch

        fields = [
            'id',
            'name',
            'address',
            'phone',
            'opening_time',
            'closing_time',
            'is_active',
            'tables',
        ]


# =============================================================================
# FOOD ITEM
# =============================================================================

class FoodItemSerializer(serializers.ModelSerializer):

    restaurant_name = serializers.CharField(
        source='restaurant.name',
        read_only=True,
    )


    class Meta:
        model = FoodItem

        fields = [
            'id',
            'restaurant',
            'restaurant_name',
            'name',
            'category',
            'description',
            'price',
            'rating',
            'image_url',
            'is_available',
        ]


# =============================================================================
# RESTAURANT
# =============================================================================

class RestaurantSerializer(serializers.ModelSerializer):

    branches = BranchSerializer(
        many=True,
        read_only=True,
    )

    food_items = FoodItemSerializer(
        many=True,
        read_only=True,
    )


    class Meta:
        model = Restaurant

        fields = [
            'id',
            'name',
            'cuisine',
            'description',
            'rating',
            'image_url',
            'is_active',
            'branches',
            'food_items',
        ]


# =============================================================================
# PLATFORM ADMIN RESTAURANT OVERSIGHT
# =============================================================================
# The public restaurant serializer includes nested menus and branches. The
# Admin list instead returns compact operational counts and includes inactive
# restaurants so they can be reviewed and restored.
# =============================================================================

class PlatformAdminRestaurantSerializer(serializers.ModelSerializer):

    branch_count = serializers.IntegerField(
        read_only=True,
    )

    food_item_count = serializers.IntegerField(
        read_only=True,
    )

    active_manager_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:

        model = Restaurant

        fields = [
            'id',
            'name',
            'cuisine',
            'description',
            'rating',
            'image_url',
            'is_active',
            'created_at',
            'branch_count',
            'food_item_count',
            'active_manager_count',
        ]

        read_only_fields = fields


class PlatformAdminRestaurantStatusSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Restaurant

        fields = [
            'is_active',
        ]

    def validate(self, attributes):

        if 'is_active' not in attributes:
            raise serializers.ValidationError({
                'is_active': 'This field is required.',
            })

        return attributes

    @transaction.atomic
    def update(self, restaurant, validated_data):

        restaurant = Restaurant.objects.select_for_update().get(
            id=restaurant.id,
        )

        is_active = validated_data['is_active']

        restaurant.is_active = is_active
        restaurant.save(
            update_fields=[
                'is_active',
            ]
        )

        # A disabled restaurant must not remain accessible through an old
        # Manager assignment. Reactivation is deliberately manual so access is
        # never restored without an Admin reviewing it.
        if not is_active:
            restaurant.manager_assignments.update(
                is_active=False,
            )

        return restaurant


# =============================================================================
# BOOKING
# =============================================================================

class BookingSerializer(serializers.ModelSerializer):

    restaurant_name = serializers.CharField(
        source='branch.restaurant.name',
        read_only=True,
    )

    branch_name = serializers.CharField(
        source='branch.name',
        read_only=True,
    )

    table_number = serializers.CharField(
        source='table.table_number',
        read_only=True,
    )


    class Meta:
        model = Booking

        fields = [
            'id',
            'user',
            'restaurant_name',
            'branch',
            'branch_name',
            'table',
            'table_number',
            'reservation_date',
            'start_time',
            'end_time',
            'guest_count',
            'customer_name',
            'customer_phone',
            'status',
            'created_at',
        ]


# =============================================================================
# PLATFORM ADMIN BOOKING OVERSIGHT
# =============================================================================
# Admins need readable customer and location details across the whole platform.
# This serializer remains read-only and intentionally contains no payment data
# because Khabo-Koi does not yet have a payment model or transaction records.
# =============================================================================

class PlatformAdminBookingSerializer(serializers.ModelSerializer):

    user = serializers.SerializerMethodField()
    restaurant = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    table = serializers.SerializerMethodField()

    class Meta:

        model = Booking

        fields = [
            'id',
            'user',
            'restaurant',
            'branch',
            'table',
            'reservation_date',
            'start_time',
            'end_time',
            'guest_count',
            'customer_name',
            'customer_phone',
            'status',
            'created_at',
        ]

        read_only_fields = fields

    def get_user(self, booking):

        if booking.user is None:
            return None

        return {
            'id': booking.user_id,
            'username': booking.user.username,
            'email': booking.user.email,
        }

    def get_restaurant(self, booking):

        return {
            'id': booking.branch.restaurant_id,
            'name': booking.branch.restaurant.name,
        }

    def get_branch(self, booking):

        return {
            'id': booking.branch_id,
            'name': booking.branch.name,
        }

    def get_table(self, booking):

        return {
            'id': booking.table_id,
            'table_number': booking.table.table_number,
            'capacity': booking.table.capacity,
            'seating_type': booking.table.seating_type,
        }
