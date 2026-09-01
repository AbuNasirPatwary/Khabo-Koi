from datetime import time

from django.core.management.base import BaseCommand

from restaurants.models import (
    Restaurant,
    Branch,
    FoodItem,
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
                'restaurant': 'Chillox',
                'name': 'Classic Beef Burger',
                'category': 'Burger',
                'price': 320,
                'rating': 4.8,
            },
            {
                'restaurant': 'Madchef',
                'name': 'Chicken Burger',
                'category': 'Burger',
                'price': 350,
                'rating': 4.7,
            },
            {
                'restaurant': 'Kacchi Bhai',
                'name': 'Special Kacchi',
                'category': 'Kacchi',
                'price': 520,
                'rating': 4.8,
            },
        ]


        for data in food_data:

            FoodItem.objects.update_or_create(

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


        self.stdout.write(
            self.style.SUCCESS(
                'Khabo-Koi demo data created successfully.'
            )
        )