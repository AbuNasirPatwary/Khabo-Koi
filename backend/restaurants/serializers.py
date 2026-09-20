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

    @transaction.atomic
    def update(self, restaurant, validated_data):

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
