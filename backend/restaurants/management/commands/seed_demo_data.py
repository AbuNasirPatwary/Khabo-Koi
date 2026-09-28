from datetime import time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from restaurants.models import (
    Booking,
    Branch,
    FoodItem,
    FoodPreorder,
    FoodPreorderItem,
    Restaurant,
    RestaurantTable,
)


class Command(BaseCommand):

    help = 'Create demo restaurant data for Khabo-Koi.'


    def handle(self, *args, **options):

        # =====================================================================
        # RESTAURANTS
        # =====================================================================

        restaurants_data = [
            {
                'name': "Sultan's Dine",
                'cuisine': 'Kacchi & Bengali',
                'description':
                    'Enjoy authentic Bengali cuisine and signature kacchi biryani in a comfortable family dining environment.',
                'rating': 4.8,
            },
            {
                'name': 'Chillox',
                'cuisine': 'Burgers & Fast Food',
                'description':
                    'Enjoy popular burgers, fries and fast food in a relaxed and modern dining environment.',
                'rating': 4.7,
            },
            {
                'name': 'Madchef',
                'cuisine': 'Burgers & Continental',
                'description':
                    'A casual restaurant serving burgers, steaks and continental meals for friends and families.',
                'rating': 4.6,
            },
            {
                'name': 'Kacchi Bhai',
                'cuisine': 'Kacchi & Bengali',
                'description':
                    'Traditional kacchi, borhani and Bengali dishes served with generous portions and authentic flavour.',
                'rating': 4.7,
            },
        ]


        restaurants = {}


        for data in restaurants_data:

            restaurant, _ = Restaurant.objects.update_or_create(

                name=data['name'],

                defaults={
                    'cuisine': data['cuisine'],
                    'description': data['description'],
                    'rating': data['rating'],
                    'image_url': '',
                    'is_active': True,
                },
            )


            restaurants[data['name']] = restaurant


        # =====================================================================
        # BRANCHES
        # =====================================================================

        branches_data = [
            # Sultan's Dine
            ("Sultan's Dine", 'Dhanmondi', 'Dhanmondi, Dhaka'),
            ("Sultan's Dine", 'Gulshan', 'Gulshan, Dhaka'),
            ("Sultan's Dine", 'Uttara', 'Uttara, Dhaka'),

            # Chillox
            ('Chillox', 'Banani', 'Banani, Dhaka'),
            ('Chillox', 'Dhanmondi', 'Dhanmondi, Dhaka'),
            ('Chillox', 'Uttara', 'Uttara, Dhaka'),

            # Madchef
            ('Madchef', 'Uttara', 'Uttara, Dhaka'),
            ('Madchef', 'Banani', 'Banani, Dhaka'),

            # Kacchi Bhai
            ('Kacchi Bhai', 'Mirpur', 'Mirpur, Dhaka'),
            ('Kacchi Bhai', 'Dhanmondi', 'Dhanmondi, Dhaka'),
        ]


        branches = {}


        for restaurant_name, branch_name, address in branches_data:

            branch, _ = Branch.objects.update_or_create(

                restaurant=restaurants[restaurant_name],
                name=branch_name,

                defaults={
                    'address': address,
                    'phone': '',
                    'opening_time': time(11, 0),
                    'closing_time': time(23, 0),
                    'is_active': True,
                },
            )


            branches[
                (restaurant_name, branch_name)
            ] = branch


        # =====================================================================
        # TABLES
        # =====================================================================
        #
        # Total configured tables:
        #
        # Sultan's Dine → 12
        # Chillox       → 8
        # Madchef       → 5
        # Kacchi Bhai   → 2
        #
        # =====================================================================

        tables_data = {

            # -----------------------------------------------------------------
            # Sultan's Dine - 12 tables
            # -----------------------------------------------------------------

            ("Sultan's Dine", 'Dhanmondi'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'INDOOR'),
                ('T3', 4, 'OUTDOOR'),
                ('T4', 6, 'WINDOW'),
            ],

            ("Sultan's Dine", 'Gulshan'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'WINDOW'),
                ('T3', 6, 'INDOOR'),
                ('T4', 8, 'OUTDOOR'),
            ],

            ("Sultan's Dine", 'Uttara'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'INDOOR'),
                ('T3', 6, 'WINDOW'),
                ('T4', 8, 'OUTDOOR'),
            ],


            # -----------------------------------------------------------------
            # Chillox - 8 tables
            # -----------------------------------------------------------------

            ('Chillox', 'Banani'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'INDOOR'),
                ('T3', 4, 'WINDOW'),
                ('T4', 6, 'OUTDOOR'),
            ],

            ('Chillox', 'Dhanmondi'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'WINDOW'),
            ],

            ('Chillox', 'Uttara'): [
                ('T1', 4, 'INDOOR'),
                ('T2', 6, 'OUTDOOR'),
            ],


            # -----------------------------------------------------------------
            # Madchef - 5 tables
            # -----------------------------------------------------------------

            ('Madchef', 'Uttara'): [
                ('T1', 2, 'INDOOR'),
                ('T2', 4, 'WINDOW'),
                ('T3', 6, 'INDOOR'),
            ],

            ('Madchef', 'Banani'): [
                ('T1', 4, 'INDOOR'),
                ('T2', 6, 'OUTDOOR'),
            ],


            # -----------------------------------------------------------------
            # Kacchi Bhai - 2 tables
            # -----------------------------------------------------------------

            ('Kacchi Bhai', 'Mirpur'): [
                ('T1', 4, 'INDOOR'),
            ],

            ('Kacchi Bhai', 'Dhanmondi'): [
                ('T1', 6, 'INDOOR'),
            ],
        }


        for branch_key, table_list in tables_data.items():

            branch = branches[branch_key]


            for (
                table_number,
                capacity,
                seating_type,
            ) in table_list:

                RestaurantTable.objects.update_or_create(

                    branch=branch,
                    table_number=table_number,

                    defaults={
                        'capacity': capacity,
                        'seating_type': seating_type,
                        'is_active': True,
                    },
                )


        # =====================================================================
        # SOME REAL MENU ITEMS
        # =====================================================================

        food_data = [
            {
                'restaurant': "Sultan's Dine",
                'name': 'Mutton Kacchi Biryani',
                'category': 'Kacchi',
                'price': 580,
                'rating': 4.9,
            },
            {
                'restaurant': "Sultan's Dine",
                'name': 'Borhani',
                'category': 'Drinks',
                'price': 90,
                'rating': 4.6,
            },
            {
                'restaurant': 'Chillox',
                'name': 'Classic Beef Burger',
                'category': 'Burger',
                'price': 320,
                'rating': 4.8,
            },
            {
                'restaurant': 'Chillox',
                'name': 'Loaded Fries',
                'category': 'Sides',
                'price': 220,
                'rating': 4.5,
            },
            {
                'restaurant': 'Madchef',
                'name': 'Chicken Burger',
                'category': 'Burger',
                'price': 350,
                'rating': 4.7,
            },
            {
                'restaurant': 'Madchef',
                'name': 'Grilled Chicken Steak',
                'category': 'Continental',
                'price': 490,
                'rating': 4.6,
            },
            {
                'restaurant': 'Kacchi Bhai',
                'name': 'Special Kacchi',
                'category': 'Kacchi',
                'price': 520,
                'rating': 4.8,
            },
            {
                'restaurant': 'Kacchi Bhai',
                'name': 'Chicken Roast',
                'category': 'Bengali',
                'price': 190,
                'rating': 4.5,
            },
        ]

        foods = {}

        for data in food_data:

            food_item, _ = FoodItem.objects.update_or_create(

                restaurant=restaurants[
                    data['restaurant']
                ],

                name=data['name'],

                defaults={
                    'category': data['category'],
                    'description': '',
                    'price': data['price'],
                    'rating': data['rating'],
                    'image_url': '',
                    'is_available': True,
                },
            )

            foods.setdefault(data['restaurant'], []).append(food_item)

        # =====================================================================
        # ANALYTICS DEMO CUSTOMERS
        # =====================================================================
        # These accounts make the generated bookings easy to identify without
        # depending on any real user. An unusable password keeps seed accounts
        # from becoming shared demo credentials by accident.

        User = get_user_model()
        demo_customers = []

        for number in range(1, 5):
            user, created = User.objects.get_or_create(
                username=f'analytics_customer_{number}',
                defaults={
                    'email': f'analytics.customer{number}@example.com',
                    'first_name': 'Analytics',
                    'last_name': f'Customer {number}',
                },
            )

            if created:
                user.set_unusable_password()
                user.save(update_fields=['password'])

            demo_customers.append(user)

        # =====================================================================
        # HISTORICAL BOOKINGS AND FOOD PREORDERS
        # =====================================================================
        # Every branch receives a booking for today plus several historical
        # records. Busier branches intentionally receive more records so the
        # ranking and comparison charts have visibly different results.
        #
        # A stable DEMO-ANALYTICS phone marker identifies each generated row.
        # Re-running the command updates the same rows relative to today's date
        # instead of creating duplicates, while unrelated user data is kept.

        branch_booking_counts = [
            (("Sultan's Dine", 'Dhanmondi'), 6),
            (("Sultan's Dine", 'Gulshan'), 5),
            (("Sultan's Dine", 'Uttara'), 4),
            (('Chillox', 'Banani'), 5),
            (('Chillox', 'Dhanmondi'), 3),
            (('Chillox', 'Uttara'), 2),
            (('Madchef', 'Uttara'), 4),
            (('Madchef', 'Banani'), 3),
            (('Kacchi Bhai', 'Mirpur'), 3),
            (('Kacchi Bhai', 'Dhanmondi'), 2),
        ]
        date_offsets = [0, -7, -21, -45, -90, -150]
        time_slots = [
            (time(12, 0), time(13, 0)),
            (time(13, 30), time(14, 30)),
            (time(18, 0), time(19, 0)),
            (time(19, 30), time(20, 30)),
            (time(21, 0), time(22, 0)),
        ]
        historical_statuses = [
            'COMPLETED',
            'COMPLETED',
            'CANCELLED',
            'COMPLETED',
            'CONFIRMED',
        ]
        today = timezone.localdate()
        booking_number = 0
        preorder_count = 0

        for branch_index, (branch_key, booking_count) in enumerate(
            branch_booking_counts
        ):
            branch = branches[branch_key]
            tables = list(branch.tables.order_by('table_number'))
            restaurant_foods = foods[branch.restaurant.name]

            for position in range(booking_count):
                booking_number += 1
                customer = demo_customers[
                    (branch_index + position) % len(demo_customers)
                ]
                start_time, end_time = time_slots[
                    (branch_index + position) % len(time_slots)
                ]
                status = (
                    ('PENDING', 'CONFIRMED')[branch_index % 2]
                    if position == 0
                    else historical_statuses[
                        (branch_index + position) % len(historical_statuses)
                    ]
                )
                marker = f'DEMO-ANALYTICS-{booking_number:03d}'

                booking, _ = Booking.objects.update_or_create(
                    customer_phone=marker,
                    defaults={
                        'user': customer,
                        'branch': branch,
                        'table': tables[position % len(tables)],
                        'reservation_date': (
                            today + timedelta(days=date_offsets[position])
                        ),
                        'start_time': start_time,
                        'end_time': end_time,
                        'guest_count': 2 + (
                            (branch_index + position) % 5
                        ),
                        'customer_name': customer.get_full_name(),
                        'special_request': (
                            'Analytics demo reservation.'
                        ),
                        'status': status,
                    },
                )

                # Keep a few bookings without preorders so dashboards can show
                # that booking and preorder totals are separate measurements.
                if (branch_index + position) % 5 == 0:
                    continue

                if status == 'COMPLETED':
                    preorder_status = 'COMPLETED'
                    payment_status = 'PAID'
                elif status == 'CANCELLED':
                    preorder_status = 'CANCELLED'
                    payment_status = 'UNPAID'
                else:
                    preorder_status = (
                        'PREPARING' if branch_index % 2 else 'PLACED'
                    )
                    payment_status = (
                        'ADVANCE_PAID' if branch_index % 3 else 'UNPAID'
                    )

                selected_items = [
                    (restaurant_foods[0], 1 + (position % 3)),
                ]
                if (branch_index + position) % 2:
                    selected_items.append((restaurant_foods[1], 1))

                total_amount = sum(
                    (
                        food_item.price * quantity
                        for food_item, quantity in selected_items
                    ),
                    Decimal('0.00'),
                )
                advance_amount = Decimal('0.00')
                if payment_status == 'PAID':
                    advance_amount = total_amount
                elif payment_status == 'ADVANCE_PAID':
                    advance_amount = (
                        total_amount * Decimal('0.25')
                    ).quantize(Decimal('0.01'))

                preorder, _ = FoodPreorder.objects.update_or_create(
                    booking=booking,
                    defaults={
                        'status': preorder_status,
                        'total_amount': total_amount,
                        'advance_amount': advance_amount,
                        'payment_status': payment_status,
                        'payment_method': (
                            'DEMO_PAYMENT'
                            if payment_status != 'UNPAID'
                            else ''
                        ),
                        'transaction_id': (
                            f'DEMO-TXN-{booking_number:03d}'
                            if payment_status != 'UNPAID'
                            else ''
                        ),
                        'special_request': 'Analytics demo preorder.',
                    },
                )

                for food_item, quantity in selected_items:
                    FoodPreorderItem.objects.update_or_create(
                        preorder=preorder,
                        food_item=food_item,
                        defaults={
                            'quantity': quantity,
                            'unit_price': food_item.price,
                        },
                    )

                preorder_count += 1


        self.stdout.write(
            self.style.SUCCESS(
                'Khabo-Koi demo data created successfully: '
                f'{booking_number} analytics bookings and '
                f'{preorder_count} food preorders are ready.'
            )
        )
