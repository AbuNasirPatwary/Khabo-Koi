import subprocess
import sys
from pathlib import Path


# =========================================================
# PROJECT PATHS
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANAGE_PY = PROJECT_ROOT / "backend" / "manage.py"


# =========================================================
# DJANGO TEST DATA SETUP
# =========================================================

SETUP_CODE = r"""
from datetime import date, timedelta, time
from django.contrib.auth import get_user_model

from accounts.models import (
    UserProfile,
    RestaurantManagerAssignment,
)

from restaurants.models import (
    Restaurant,
    Branch,
    RestaurantTable,
    Booking,
)


User = get_user_model()


# =========================================================
# 1. CREATE / RESET SELENIUM CUSTOMER
# =========================================================

customer, _ = User.objects.get_or_create(
    username="selenium_customer",
    defaults={
        "email": "selenium_customer@example.com",
    },
)

customer.email = "selenium_customer@example.com"
customer.set_password("testpass123")
customer.save()

customer_profile, _ = UserProfile.objects.get_or_create(
    user=customer
)

customer_profile.role = UserProfile.Role.CUSTOMER
customer_profile.save()

print(
    "Customer ready:",
    customer.username,
)


# =========================================================
# 2. CREATE / RESET SELENIUM MANAGER
# =========================================================

manager, _ = User.objects.get_or_create(
    username="selenium_manager",
    defaults={
        "email": "selenium_manager@example.com",
    },
)

manager.email = "selenium_manager@example.com"
manager.set_password("testpass123")
manager.save()

manager_profile, _ = UserProfile.objects.get_or_create(
    user=manager
)

manager_profile.role = (
    UserProfile.Role.RESTAURANT_MANAGER
)

manager_profile.save()

print(
    "Manager ready:",
    manager.username,
)


# =========================================================
# 3. PREPARE RESTAURANT
# =========================================================

restaurant = Restaurant.objects.get(
    id=1
)

restaurant.is_active = True
restaurant.save()

branch = Branch.objects.filter(
    restaurant=restaurant,
).first()

if branch is None:
    raise RuntimeError(
        "Restaurant 1 does not have a branch."
    )

branch.is_active = True
branch.save()

table = RestaurantTable.objects.filter(
    branch=branch,
).first()

if table is None:
    raise RuntimeError(
        "The selected branch does not have a table."
    )

table.is_active = True
table.save()

print(
    "Restaurant ready:",
    restaurant.name,
)

print(
    "Branch ready:",
    branch.name,
)

print(
    "Table ready:",
    table.table_number,
)


# =========================================================
# 4. ASSIGN MANAGER TO RESTAURANT
# =========================================================

RestaurantManagerAssignment.objects.update_or_create(
    user=manager,
    restaurant=restaurant,
    defaults={
        "is_active": True,
    },
)

print(
    "Manager restaurant assignment ready"
)


# =========================================================
# 5. CLEAN OLD SELENIUM BOOKINGS
# =========================================================

customer_deleted, _ = Booking.objects.filter(
    customer_name="Selenium Test Customer"
).delete()

manager_deleted, _ = Booking.objects.filter(
    customer_name="Selenium Pending Customer"
).delete()

print(
    "Old customer test bookings removed:",
    customer_deleted,
)

print(
    "Old manager test bookings removed:",
    manager_deleted,
)


# =========================================================
# 6. CREATE FRESH PENDING MANAGER TEST BOOKING
# =========================================================

test_date = (
    date.today()
    + timedelta(days=2)
)

booking = Booking.objects.create(
    branch=branch,
    table=table,
    reservation_date=test_date,
    start_time=time(15, 0),
    end_time=time(16, 30),
    guest_count=2,
    customer_name="Selenium Pending Customer",
    customer_phone="01722222222",
    status="PENDING",
)

print(
    "Fresh manager test booking:",
    booking.id,
)

print(
    "Initial status:",
    booking.status,
)


# =========================================================
# COMPLETE
# =========================================================

print()
print(
    "=========================================="
)

print(
    "SELENIUM TEST DATA SETUP COMPLETE"
)

print(
    "=========================================="
)

print(
    "Customer username: selenium_customer"
)

print(
    "Manager username:  selenium_manager"
)

print(
    "Password:          testpass123"
)

print(
    "Manager booking:  ",
    booking.id,
)

print(
    "Booking status:   ",
    booking.status,
)
"""


def main():

    subprocess.run(
        [
            sys.executable,
            str(MANAGE_PY),
            "shell",
            "-c",
            SETUP_CODE,
        ],
        cwd=PROJECT_ROOT,
        check=True,
    )


if __name__ == "__main__":
    main()