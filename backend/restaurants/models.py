from django.db import models
from django.contrib.auth.models import User


# =============================================================================
# RESTAURANT
# =============================================================================
# One restaurant brand/company.
#
# Example:
# Sultan's Dine
# Chillox
# Madchef
# =============================================================================

class Restaurant(models.Model):

    name = models.CharField(max_length=150)

    cuisine = models.CharField(
        max_length=150,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0,
    )

    image_url = models.URLField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    def __str__(self):
        return self.name



# =============================================================================
# BRANCH
# =============================================================================
# A restaurant can have multiple branches.
#
# Example:
#
# Sultan's Dine
#     ├── Dhanmondi
#     ├── Gulshan
#     └── Uttara
# =============================================================================

class Branch(models.Model):

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='branches',
    )

    name = models.CharField(
        max_length=120,
    )

    address = models.CharField(
        max_length=255,
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    opening_time = models.TimeField(
        null=True,
        blank=True,
    )

    closing_time = models.TimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )


    def __str__(self):
        return f'{self.restaurant.name} - {self.name}'



# =============================================================================
# FOOD ITEM
# =============================================================================
# Menu items belonging to a restaurant.
#
# Later React's Browse Food page will receive these through an API.
#
# Example:
# Classic Beef Burger
# Mutton Kacchi Biryani
# =============================================================================

class FoodItem(models.Model):

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='food_items',
    )

    name = models.CharField(
        max_length=150,
    )

    category = models.CharField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0,
    )

    image_url = models.URLField(
        blank=True,
    )

    is_available = models.BooleanField(
        default=True,
    )


    def __str__(self):
        return f'{self.name} - {self.restaurant.name}'



# =============================================================================
# RESTAURANT TABLE
# =============================================================================
# Individual reservable tables belong to a specific restaurant branch.
#
# Example:
#
# Sultan's Dine - Dhanmondi
#     ├── T1 → 2 seats
#     ├── T2 → 4 seats
#     └── T3 → 6 seats
#
# The Booking model will later reference one of these tables.
# =============================================================================

class RestaurantTable(models.Model):

    SEATING_CHOICES = [
        ('INDOOR', 'Indoor'),
        ('OUTDOOR', 'Outdoor'),
        ('WINDOW', 'Window Side'),
    ]


    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='tables',
    )

    table_number = models.CharField(
        max_length=20,
    )

    capacity = models.PositiveIntegerField()

    seating_type = models.CharField(
        max_length=20,
        choices=SEATING_CHOICES,
        default='INDOOR',
    )

    is_active = models.BooleanField(
        default=True,
    )


    class Meta:

        # Prevent duplicate table numbers inside the same branch.
        constraints = [
            models.UniqueConstraint(
                fields=['branch', 'table_number'],
                name='unique_table_per_branch',
            )
        ]


    def __str__(self):
        return (
            f'{self.branch.restaurant.name} - '
            f'{self.branch.name} - '
            f'{self.table_number}'
        )

# =============================================================================
# BOOKING
# =============================================================================
# A booking connects a customer reservation to:
#
# Restaurant Branch
#       ↓
# Restaurant Table
#       ↓
# Date + Start Time + End Time
#
# Later Django will check this table to prevent double booking.
# =============================================================================

class Booking(models.Model):
    user = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name='bookings',
    null=True,
    blank=True,
    )
    

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]


    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='bookings',
    )


    table = models.ForeignKey(
        RestaurantTable,
        on_delete=models.CASCADE,
        related_name='bookings',
    )


    reservation_date = models.DateField()


    start_time = models.TimeField()


    end_time = models.TimeField()


    guest_count = models.PositiveIntegerField()


    customer_name = models.CharField(
        max_length=150,
        blank=True,
    )


    customer_phone = models.CharField(
        max_length=30,
        blank=True,
    )


    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CONFIRMED',
    )


    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    def __str__(self):

        return (
            f'{self.branch.restaurant.name} - '
            f'{self.table.table_number} - '
            f'{self.reservation_date} '
            f'{self.start_time}'
        )