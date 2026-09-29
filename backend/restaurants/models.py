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

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
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
    
    special_request = models.TextField(
        blank=True,
        default='',
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


# =============================================================================
# BRANCH-SPECIFIC MENU AVAILABILITY
# =============================================================================
class BranchMenuAvailability(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="menu_availability",
    )
    food_item = models.ForeignKey(
        FoodItem,
        on_delete=models.CASCADE,
        related_name="branch_availability",
    )
    is_available = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "food_item"],
                name="unique_branch_food_availability",
            )
        ]

    def __str__(self):
        return f"{self.branch} - {self.food_item.name}"


class FoodPreorder(models.Model):
    STATUS_CHOICES = [
        ("PLACED", "Placed"),
        ("PREPARING", "Preparing"),
        ("READY", "Ready"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("UNPAID", "Unpaid"),
        ("ADVANCE_PAID", "Advance Paid"),
        ("PAID", "Paid"),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="food_preorder",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PLACED",
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    advance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="UNPAID",
    )
    payment_method = models.CharField(max_length=30, blank=True)
    transaction_id = models.CharField(max_length=80, blank=True)
    special_request = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preorder #{self.id} - Booking #{self.booking_id}"


class FoodPreorderItem(models.Model):
    preorder = models.ForeignKey(
        FoodPreorder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    food_item = models.ForeignKey(
        FoodItem,
        on_delete=models.PROTECT,
        related_name="preorder_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["preorder", "food_item"],
                name="unique_food_item_per_preorder",
            )
        ]

    def __str__(self):
        return f"{self.food_item.name} x {self.quantity}"


class OperationalStatusHistory(models.Model):
    """Immutable audit record for reservation and pre-order status changes."""

    TARGET_CHOICES = [
        ("BOOKING", "Booking"),
        ("PREORDER", "Food pre-order"),
    ]

    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.PROTECT,
        related_name="status_history",
        null=True,
        blank=True,
    )
    preorder = models.ForeignKey(
        FoodPreorder,
        on_delete=models.PROTECT,
        related_name="status_history",
        null=True,
        blank=True,
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.PROTECT,
        related_name="operational_status_history",
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        related_name="operational_status_history",
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="operational_status_changes",
        null=True,
        blank=True,
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(
                        target_type="BOOKING",
                        booking__isnull=False,
                        preorder__isnull=True,
                    )
                    | models.Q(
                        target_type="PREORDER",
                        booking__isnull=True,
                        preorder__isnull=False,
                    )
                ),
                name="history_target_matches_type",
            ),
            models.CheckConstraint(
                condition=~models.Q(old_status=models.F("new_status")),
                name="history_records_real_change",
            ),
        ]
        indexes = [
            models.Index(fields=["target_type", "created_at"]),
            models.Index(fields=["restaurant", "created_at"]),
            models.Index(fields=["branch", "created_at"]),
        ]

    def __str__(self):
        return (
            f"{self.get_target_type_display()} "
            f"{self.old_status} -> {self.new_status}"
        )
