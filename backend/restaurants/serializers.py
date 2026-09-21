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
# MANAGER RESTAURANT
# =============================================================================
# Restaurant profile data exposed to an authenticated Restaurant Manager.
#
# Rating and activation status are visible but cannot be changed through the
# Manager API. Ownership and restaurant selection are enforced in the view.
# =============================================================================

class ManagerRestaurantSerializer(serializers.ModelSerializer):

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
        ]

        read_only_fields = [
            'id',
            'rating',
            'is_active',
        ]

# =============================================================================
# MANAGER BRANCH
# =============================================================================
# Branch data managed by an authenticated Restaurant Manager.
#
# The restaurant field is read-only because the backend view decides which
# restaurant the Manager is allowed to manage. The browser must never freely
# assign a branch to another restaurant.
# =============================================================================

class ManagerBranchSerializer(serializers.ModelSerializer):

    restaurant_name = serializers.CharField(
        source='restaurant.name',
        read_only=True,
    )

    class Meta:
        model = Branch

        fields = [
            'id',
            'restaurant',
            'restaurant_name',
            'name',
            'address',
            'phone',
            'opening_time',
            'closing_time',
            'is_active',
        ]

        read_only_fields = [
            'id',
            'restaurant',
            'restaurant_name',
        ]