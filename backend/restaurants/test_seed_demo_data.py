from datetime import timedelta
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from restaurants.models import (
    Booking,
    Branch,
    FoodItem,
    FoodPreorder,
    FoodPreorderItem,
    Restaurant,
)


class SeedDemoDataCommandTests(TestCase):
    """Protect the repeatable analytics dataset used for demonstrations."""

    def run_seed_command(self):
        output = StringIO()
        call_command('seed_demo_data', stdout=output)
        return output.getvalue()

    def test_command_creates_meaningful_cross_branch_analytics_data(self):
        output = self.run_seed_command()
        demo_bookings = Booking.objects.filter(
            customer_phone__startswith='DEMO-ANALYTICS-'
        )
        demo_preorders = FoodPreorder.objects.filter(
            booking__in=demo_bookings
        )
        today = timezone.localdate()

        self.assertIn('37 analytics bookings', output)
        self.assertEqual(Restaurant.objects.count(), 4)
        self.assertEqual(Branch.objects.count(), 10)
        self.assertEqual(FoodItem.objects.count(), 8)
        self.assertEqual(demo_bookings.count(), 37)
        self.assertGreaterEqual(demo_preorders.count(), 25)
        self.assertEqual(
            demo_bookings.filter(reservation_date=today).count(),
            10,
        )
        self.assertTrue(
            demo_bookings.filter(
                reservation_date__lte=today - timedelta(days=140)
            ).exists()
        )
        self.assertEqual(
            set(demo_bookings.values_list('status', flat=True)),
            {'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'},
        )
        self.assertEqual(
            set(demo_preorders.values_list('payment_status', flat=True)),
            {'UNPAID', 'ADVANCE_PAID', 'PAID'},
        )

    def test_command_is_idempotent_and_preserves_unrelated_records(self):
        unrelated = Restaurant.objects.create(name='User Created Restaurant')

        self.run_seed_command()
        first_counts = {
            'users': get_user_model().objects.filter(
                username__startswith='analytics_customer_'
            ).count(),
            'bookings': Booking.objects.filter(
                customer_phone__startswith='DEMO-ANALYTICS-'
            ).count(),
            'preorders': FoodPreorder.objects.filter(
                booking__customer_phone__startswith='DEMO-ANALYTICS-'
            ).count(),
            'preorder_items': FoodPreorderItem.objects.filter(
                preorder__booking__customer_phone__startswith=(
                    'DEMO-ANALYTICS-'
                )
            ).count(),
        }
        self.run_seed_command()
        second_counts = {
            'users': get_user_model().objects.filter(
                username__startswith='analytics_customer_'
            ).count(),
            'bookings': Booking.objects.filter(
                customer_phone__startswith='DEMO-ANALYTICS-'
            ).count(),
            'preorders': FoodPreorder.objects.filter(
                booking__customer_phone__startswith='DEMO-ANALYTICS-'
            ).count(),
            'preorder_items': FoodPreorderItem.objects.filter(
                preorder__booking__customer_phone__startswith=(
                    'DEMO-ANALYTICS-'
                )
            ).count(),
        }

        self.assertEqual(first_counts, second_counts)
        self.assertEqual(first_counts['users'], 4)
        self.assertEqual(first_counts['bookings'], 37)
        self.assertTrue(Restaurant.objects.filter(pk=unrelated.pk).exists())

    def test_preorder_totals_and_items_match_each_booking_restaurant(self):
        self.run_seed_command()

        for preorder in FoodPreorder.objects.filter(
            booking__customer_phone__startswith='DEMO-ANALYTICS-'
        ).prefetch_related('items__food_item'):
            calculated_total = sum(
                (
                    item.unit_price * item.quantity
                    for item in preorder.items.all()
                ),
                Decimal('0.00'),
            )

            self.assertEqual(preorder.total_amount, calculated_total)
            self.assertGreater(preorder.items.count(), 0)
            self.assertTrue(all(
                item.food_item.restaurant_id
                == preorder.booking.branch.restaurant_id
                for item in preorder.items.all()
            ))
