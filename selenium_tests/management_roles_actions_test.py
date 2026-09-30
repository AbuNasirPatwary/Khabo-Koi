"""End-to-end Selenium test for Khabo-Koi's three management portals.

The script prepares isolated local records, starts Django/Vite when necessary,
and then uses the browser exactly as a user would.  Visible Chrome is the
default so this doubles as a live project demonstration.

Covered roles and actions:

* Restaurant Manager: profile update; branch, menu, and table CRUD; reservation
  status transition; operational-history visibility.
* Branch Manager: branch profile update; table CRUD; branch menu availability;
  reservation and preorder transitions; notification/history pages.
* Platform Admin: user role/status changes; restaurant-manager and
  branch-manager assignments; booking/history oversight; restaurant status.

Run this only against a local development database.  All mutable fixtures use
the ``selenium_``/``Selenium`` prefix so normal application records are not
selected by the test.
"""

from datetime import date, time, timedelta
import os
from pathlib import Path
import sys

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from khabo_koi_unified_test import (
    BACKEND_DIRECTORY,
    BASE_URL,
    create_driver,
    start_local_services,
    stop_started_services,
    visual_pause,
)


PASSWORD = os.getenv("KHABO_MANAGEMENT_PASSWORD", "Selenium-Khabo-827!")
ADMIN_USERNAME = "selenium_admin"
MANAGER_USERNAME = "selenium_manager"
BRANCH_MANAGER_USERNAME = "selenium_branch_manager"
MANAGER_CANDIDATE_USERNAME = "selenium_manager_candidate"
BRANCH_CANDIDATE_USERNAME = "selenium_branch_candidate"
ADMIN_TARGET_USERNAME = "selenium_admin_target"
CUSTOMER_USERNAME = "selenium_management_customer"

RESTAURANT_NAME = "Selenium Test Restaurant"
BRANCH_NAME = "Selenium Main Branch"
MANAGER_BOOKING_NAME = "Selenium Manager Booking"
BRANCH_BOOKING_NAME = "Selenium Branch Booking"


def prepare_management_fixtures():
    """Create/reset dedicated records used by the browser scenarios."""

    sys.path.insert(0, str(BACKEND_DIRECTORY))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    import django

    django.setup()

    from django.contrib.auth import get_user_model
    from accounts.models import (
        BranchManagerAssignment,
        RestaurantManagerAssignment,
        UserProfile,
    )
    from restaurants.models import (
        Booking,
        Branch,
        BranchMenuAvailability,
        FoodItem,
        FoodPreorder,
        FoodPreorderItem,
        OperationalStatusHistory,
        Restaurant,
        RestaurantTable,
    )

    user_model = get_user_model()

    def reset_user(username, email, role, *, staff=False, superuser=False):
        user, _ = user_model.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        user.email = email
        user.is_active = True
        user.is_staff = staff
        user.is_superuser = superuser
        user.set_password(PASSWORD)
        user.save()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save(update_fields=["role", "updated_at"])
        return user

    admin = reset_user(
        ADMIN_USERNAME,
        "selenium.admin@example.com",
        UserProfile.Role.ADMIN,
        staff=True,
        superuser=True,
    )
    manager = reset_user(
        MANAGER_USERNAME,
        "selenium.manager@example.com",
        UserProfile.Role.RESTAURANT_MANAGER,
    )
    branch_manager = reset_user(
        BRANCH_MANAGER_USERNAME,
        "selenium.branch.manager@example.com",
        UserProfile.Role.BRANCH_MANAGER,
    )
    manager_candidate = reset_user(
        MANAGER_CANDIDATE_USERNAME,
        "selenium.manager.candidate@example.com",
        UserProfile.Role.RESTAURANT_MANAGER,
    )
    branch_candidate = reset_user(
        BRANCH_CANDIDATE_USERNAME,
        "selenium.branch.candidate@example.com",
        UserProfile.Role.BRANCH_MANAGER,
    )
    admin_target = reset_user(
        ADMIN_TARGET_USERNAME,
        "selenium.admin.target@example.com",
        UserProfile.Role.CUSTOMER,
    )
    customer = reset_user(
        CUSTOMER_USERNAME,
        "selenium.management.customer@example.com",
        UserProfile.Role.CUSTOMER,
    )

    restaurant, _ = Restaurant.objects.get_or_create(name=RESTAURANT_NAME)
    restaurant.cuisine = "Automated Test Cuisine"
    restaurant.description = "Restaurant used only by the management Selenium test."
    restaurant.rating = 4.5
    restaurant.is_active = True
    restaurant.save()

    branch, _ = Branch.objects.get_or_create(
        restaurant=restaurant,
        name=BRANCH_NAME,
    )
    branch.address = "Selenium Avenue, Dhaka"
    branch.phone = "01700000000"
    branch.opening_time = time(9, 0)
    branch.closing_time = time(22, 0)
    branch.is_active = True
    branch.save()

    base_table, _ = RestaurantTable.objects.get_or_create(
        branch=branch,
        table_number="SEL-BASE",
        defaults={"capacity": 4, "seating_type": "INDOOR"},
    )
    base_table.capacity = 4
    base_table.seating_type = "INDOOR"
    base_table.is_active = True
    base_table.save()

    food_item, _ = FoodItem.objects.get_or_create(
        restaurant=restaurant,
        name="Selenium Test Platter",
        defaults={"category": "Main", "price": "650.00"},
    )
    food_item.category = "Main"
    food_item.description = "A menu item reserved for browser automation."
    food_item.price = "650.00"
    food_item.is_available = True
    food_item.save()
    BranchMenuAvailability.objects.update_or_create(
        branch=branch,
        food_item=food_item,
        defaults={"is_available": True},
    )

    RestaurantManagerAssignment.objects.update_or_create(
        user=manager,
        restaurant=restaurant,
        defaults={"is_active": True, "assigned_by": admin},
    )
    BranchManagerAssignment.objects.filter(user=branch_manager).update(is_active=False)
    BranchManagerAssignment.objects.update_or_create(
        user=branch_manager,
        branch=branch,
        defaults={"is_active": True, "assigned_by": admin},
    )

    # The admin scenario creates these two assignments in the browser.
    RestaurantManagerAssignment.objects.filter(
        user=manager_candidate,
        restaurant=restaurant,
    ).delete()
    BranchManagerAssignment.objects.filter(user=branch_candidate).delete()

    # Remove only disposable objects created by an earlier run.
    RestaurantTable.objects.filter(
        branch=branch,
        table_number__in=["SEL-MGR", "SEL-BM"],
    ).delete()
    Branch.objects.filter(
        restaurant=restaurant,
        name="Selenium UI Branch",
    ).delete()
    FoodItem.objects.filter(
        restaurant=restaurant,
        name="Selenium UI Dish",
    ).delete()

    tomorrow = date.today() + timedelta(days=1)

    def reset_booking(customer_name, start_hour):
        booking, _ = Booking.objects.get_or_create(
            branch=branch,
            table=base_table,
            customer_name=customer_name,
            defaults={
                "user": customer,
                "reservation_date": tomorrow,
                "start_time": time(start_hour, 0),
                "end_time": time(start_hour + 1, 0),
                "guest_count": 2,
                "customer_phone": "01800000000",
            },
        )
        booking.user = customer
        booking.reservation_date = tomorrow
        booking.start_time = time(start_hour, 0)
        booking.end_time = time(start_hour + 1, 0)
        booking.guest_count = 2
        booking.customer_phone = "01800000000"
        booking.status = "PENDING"
        booking.save()
        return booking

    manager_booking = reset_booking(MANAGER_BOOKING_NAME, 12)
    branch_booking = reset_booking(BRANCH_BOOKING_NAME, 14)

    preorder, _ = FoodPreorder.objects.get_or_create(booking=branch_booking)
    preorder.status = "PLACED"
    preorder.total_amount = "650.00"
    preorder.advance_amount = "130.00"
    preorder.payment_status = "ADVANCE_PAID"
    preorder.save()
    FoodPreorderItem.objects.update_or_create(
        preorder=preorder,
        food_item=food_item,
        defaults={"quantity": 1, "unit_price": "650.00"},
    )

    # Reset audit history only for the two dedicated browser-test workflows.
    OperationalStatusHistory.objects.filter(
        booking__in=[manager_booking, branch_booking]
    ).delete()
    OperationalStatusHistory.objects.filter(preorder=preorder).delete()

    print("Dedicated management Selenium records are ready.", flush=True)
    return {
        "admin_target": admin_target,
        "manager_candidate": manager_candidate,
        "branch_candidate": branch_candidate,
    }


def set_value(element, value):
    """Replace a field value and return the element for compact test steps."""

    element.clear()
    element.send_keys(str(value))
    return element


def select_containing(element, text):
    """Select an option by stable partial text rather than database IDs."""

    select = Select(element)
    for option in select.options:
        if text.lower() in option.text.lower():
            select.select_by_value(option.get_attribute("value"))
            return
    raise AssertionError(f"No option containing {text!r} was found.")


def open_page(driver, wait, path, heading):
    driver.get(f"{BASE_URL}{path}")
    wait.until(EC.url_contains(path))
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//h1[contains(normalize-space(), {heading!r})]")
        )
    )
    visual_pause()


def login(driver, wait, path, username, expected_path):
    """Sign into any management portal using its visible login form."""

    driver.get(f"{BASE_URL}{path}")
    username_input = wait.until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, "form input:not([type='password'])")
        )
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "form input[type='password']")
    set_value(username_input, username)
    set_value(password_input, PASSWORD)
    visual_pause()
    driver.find_element(
        By.XPATH,
        "//form//button[not(@type) or @type='submit']",
    ).click()
    wait.until(EC.url_contains(expected_path))
    visual_pause()


def row_containing(driver, text):
    return driver.find_element(
        By.XPATH,
        f"//tr[contains(normalize-space(), {text!r})]",
    )


def article_containing(driver, text):
    return driver.find_element(
        By.XPATH,
        f"//article[contains(normalize-space(), {text!r})]",
    )


def click_exact(container, label):
    button = container.find_element(
        By.XPATH,
        f".//button[normalize-space()={label!r}]",
    )
    button.click()
    return button


def confirm_dialog(driver, wait, label):
    dialog = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='dialog']"))
    )
    click_exact(dialog, label)
    wait.until(EC.invisibility_of_element(dialog))
    visual_pause()


def wait_for_text(driver, wait, text):
    return wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//*[contains(normalize-space(), {text!r})]")
        )
    )


def pass_step(role, message):
    print(f"PASS [{role}]: {message}", flush=True)


def run_manager_scenario():
    role = "Restaurant Manager"
    driver = create_driver()
    wait = WebDriverWait(driver, 20)
    try:
        driver.maximize_window()
        login(driver, wait, "/manager/login", MANAGER_USERNAME, "/manager/dashboard")
        wait_for_text(driver, wait, "Manager Dashboard")
        pass_step(role, "login and analytics dashboard")

        open_page(driver, wait, "/manager/restaurant-profile", "Restaurant Profile")
        description = driver.find_element(By.NAME, "description")
        set_value(description, "Updated by the Selenium manager action test.")
        driver.find_element(By.XPATH, "//button[normalize-space()='Save restaurant profile']").click()
        wait_for_text(driver, wait, "Restaurant profile updated")
        pass_step(role, "restaurant profile update")

        open_page(driver, wait, "/manager/branches", "Branches")
        set_value(driver.find_element(By.NAME, "name"), "Selenium UI Branch")
        set_value(driver.find_element(By.NAME, "phone"), "01711111111")
        set_value(driver.find_element(By.NAME, "address"), "UI Test Road, Dhaka")
        driver.find_element(By.XPATH, "//button[normalize-space()='Create branch']").click()
        wait_for_text(driver, wait, "Branch created")
        branch_card = article_containing(driver, "Selenium UI Branch")
        click_exact(branch_card, "Edit")
        set_value(driver.find_element(By.NAME, "phone"), "01722222222")
        driver.find_element(By.XPATH, "//button[normalize-space()='Save changes']").click()
        wait_for_text(driver, wait, "Branch updated")
        branch_card = article_containing(driver, "Selenium UI Branch")
        click_exact(branch_card, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        wait_for_text(driver, wait, "Branch deactivated")
        pass_step(role, "branch create, edit, and deactivate")

        open_page(driver, wait, "/manager/menu", "Menu")
        set_value(driver.find_element(By.NAME, "name"), "Selenium UI Dish")
        set_value(driver.find_element(By.NAME, "category"), "Dessert")
        set_value(driver.find_element(By.NAME, "price"), "275")
        set_value(driver.find_element(By.NAME, "description"), "Created through Selenium")
        driver.find_element(By.XPATH, "//button[normalize-space()='Create menu item']").click()
        wait_for_text(driver, wait, "Menu item created")
        menu_card = article_containing(driver, "Selenium UI Dish")
        click_exact(menu_card, "Edit")
        set_value(driver.find_element(By.NAME, "price"), "300")
        driver.find_element(By.XPATH, "//button[normalize-space()='Save changes']").click()
        wait_for_text(driver, wait, "Menu item updated")
        menu_card = article_containing(driver, "Selenium UI Dish")
        click_exact(menu_card, "Make unavailable")
        confirm_dialog(driver, wait, "Make unavailable")
        wait_for_text(driver, wait, "Menu item marked unavailable")
        pass_step(role, "menu item create, edit, and availability change")

        open_page(driver, wait, "/manager/tables", "Tables")
        form = driver.find_element(By.TAG_NAME, "form")
        select_containing(form.find_element(By.NAME, "branch_id"), BRANCH_NAME)
        set_value(form.find_element(By.NAME, "table_number"), "SEL-MGR")
        set_value(form.find_element(By.NAME, "capacity"), "4")
        Select(form.find_element(By.NAME, "seating_type")).select_by_value("WINDOW")
        click_exact(form, "Create table")
        wait_for_text(driver, wait, "Table created")
        table_row = row_containing(driver, "SEL-MGR")
        click_exact(table_row, "Edit")
        set_value(driver.find_element(By.NAME, "capacity"), "6")
        driver.find_element(By.XPATH, "//button[normalize-space()='Save changes']").click()
        wait_for_text(driver, wait, "Table updated")
        table_row = row_containing(driver, "SEL-MGR")
        click_exact(table_row, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        wait_for_text(driver, wait, "Table deactivated")
        pass_step(role, "table create, edit, and deactivate")

        open_page(driver, wait, "/manager/reservations", "Reservations")
        search = driver.find_element(By.NAME, "search")
        set_value(search, MANAGER_BOOKING_NAME)
        driver.find_element(By.XPATH, "//button[normalize-space()='Apply filters']").click()
        booking_row = wait.until(lambda current: row_containing(current, MANAGER_BOOKING_NAME))
        click_exact(booking_row, "CONFIRMED")
        wait.until(EC.alert_is_present()).accept()
        wait_for_text(driver, wait, "updated")
        pass_step(role, "reservation filtering and Pending to Confirmed transition")

        open_page(driver, wait, "/manager/operations/history", "Operational History")
        set_value(driver.find_element(By.NAME, "search"), MANAGER_BOOKING_NAME)
        driver.find_element(By.XPATH, "//button[normalize-space()='Apply filters']").click()
        wait_for_text(driver, wait, MANAGER_BOOKING_NAME)
        pass_step(role, "audit history visibility")
        driver.find_element(By.XPATH, "//button[normalize-space()='Sign out']").click()
        wait.until(EC.url_contains("/manager/login"))
        pass_step(role, "secure sign out")
    finally:
        driver.quit()


def run_branch_manager_scenario():
    role = "Branch Manager"
    driver = create_driver()
    wait = WebDriverWait(driver, 20)
    try:
        driver.maximize_window()
        login(
            driver,
            wait,
            "/branch-manager/login",
            BRANCH_MANAGER_USERNAME,
            "/branch-manager/dashboard",
        )
        wait_for_text(driver, wait, "Dashboard")
        pass_step(role, "login and branch-scoped analytics dashboard")

        open_page(driver, wait, "/branch-manager/profile", "Branch Profile")
        form = driver.find_element(By.TAG_NAME, "form")
        phone = form.find_element(By.XPATH, ".//label[contains(., 'Phone')]//input")
        set_value(phone, "01733333333")
        click_exact(form, "Save branch details")
        wait_for_text(driver, wait, "Branch profile updated")
        pass_step(role, "branch contact profile update")

        open_page(driver, wait, "/branch-manager/tables", "Tables")
        form = driver.find_element(By.TAG_NAME, "form")
        set_value(form.find_element(By.CSS_SELECTOR, "input[placeholder='Table number']"), "SEL-BM")
        set_value(form.find_element(By.CSS_SELECTOR, "input[type='number']"), "3")
        click_exact(form, "Add table")
        table_card = wait.until(lambda current: article_containing(current, "SEL-BM"))
        click_exact(table_card, "Edit")
        form = driver.find_element(By.TAG_NAME, "form")
        set_value(form.find_element(By.CSS_SELECTOR, "input[type='number']"), "5")
        click_exact(form, "Save changes")
        table_card = article_containing(driver, "SEL-BM")
        click_exact(table_card, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        pass_step(role, "branch table create, edit, and deactivate")

        open_page(driver, wait, "/branch-manager/menu", "Menu Availability")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']"), "Selenium Test Platter")
        menu_card = wait.until(lambda current: article_containing(current, "Selenium Test Platter"))
        menu_card.find_element(By.CSS_SELECTOR, "button[aria-label^='Change availability']").click()
        confirm_dialog(driver, wait, "Make unavailable")
        menu_card = article_containing(driver, "Selenium Test Platter")
        menu_card.find_element(By.CSS_SELECTOR, "button[aria-label^='Change availability']").click()
        confirm_dialog(driver, wait, "Make available")
        pass_step(role, "branch-specific menu availability off and on")

        open_page(driver, wait, "/branch-manager/reservations", "Reservations")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder='Customer or phone']"), BRANCH_BOOKING_NAME)
        driver.find_element(By.XPATH, "//button[normalize-space()='Apply filters']").click()
        booking_row = wait.until(lambda current: row_containing(current, BRANCH_BOOKING_NAME))
        click_exact(booking_row, "CONFIRMED")
        pass_step(role, "branch reservation filtering and confirmation")

        open_page(driver, wait, "/branch-manager/preorders", "Food Pre-orders")
        preorder_card = wait.until(lambda current: article_containing(current, BRANCH_BOOKING_NAME))
        click_exact(preorder_card, "PREPARING")
        wait.until(
            lambda current: "PREPARING" in article_containing(
                current,
                BRANCH_BOOKING_NAME,
            ).text
        )
        pass_step(role, "food preorder moved from Placed to Preparing")

        open_page(driver, wait, "/branch-manager/notifications", "Notifications")
        pass_step(role, "notification centre access")
        open_page(driver, wait, "/branch-manager/operations/history", "Operational History")
        wait_for_text(driver, wait, BRANCH_BOOKING_NAME)
        pass_step(role, "branch-scoped audit history visibility")
        driver.find_element(By.XPATH, "//button[normalize-space()='Sign out']").click()
        wait.until(EC.url_contains("/branch-manager/login"))
        pass_step(role, "secure sign out")
    finally:
        driver.quit()


def run_admin_scenario():
    role = "Platform Admin"
    driver = create_driver()
    wait = WebDriverWait(driver, 20)
    try:
        driver.maximize_window()
        login(driver, wait, "/platform-admin/login", ADMIN_USERNAME, "/platform-admin/dashboard")
        wait_for_text(driver, wait, "Platform at a glance")
        pass_step(role, "login and platform analytics dashboard")

        open_page(driver, wait, "/platform-admin/users", "User Management")
        search = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']")
        set_value(search, ADMIN_TARGET_USERNAME)
        user_row = wait.until(lambda current: row_containing(current, ADMIN_TARGET_USERNAME))
        Select(user_row.find_element(By.TAG_NAME, "select")).select_by_value("RESTAURANT_MANAGER")
        click_exact(user_row, "Save")
        confirm_dialog(driver, wait, "Change role")
        wait_for_text(driver, wait, f"{ADMIN_TARGET_USERNAME}'s role was updated")
        user_row = row_containing(driver, ADMIN_TARGET_USERNAME)
        Select(user_row.find_element(By.TAG_NAME, "select")).select_by_value("CUSTOMER")
        click_exact(user_row, "Save")
        confirm_dialog(driver, wait, "Change role")
        wait_for_text(driver, wait, f"{ADMIN_TARGET_USERNAME}'s role was updated")
        user_row = row_containing(driver, ADMIN_TARGET_USERNAME)
        click_exact(user_row, "Suspend")
        confirm_dialog(driver, wait, "Suspend")
        wait_for_text(driver, wait, f"{ADMIN_TARGET_USERNAME}'s account was suspended")
        user_row = row_containing(driver, ADMIN_TARGET_USERNAME)
        click_exact(user_row, "Reactivate")
        confirm_dialog(driver, wait, "Reactivate")
        wait_for_text(driver, wait, f"{ADMIN_TARGET_USERNAME}'s account was reactivated")
        pass_step(role, "user role changes plus suspend/reactivate")

        open_page(driver, wait, "/platform-admin/manager-assignments", "Manager Access")
        form = driver.find_element(By.TAG_NAME, "form")
        selects = form.find_elements(By.TAG_NAME, "select")
        select_containing(selects[0], MANAGER_CANDIDATE_USERNAME)
        select_containing(selects[1], RESTAURANT_NAME)
        click_exact(form, "Assign access")
        wait_for_text(driver, wait, "Restaurant access was assigned successfully")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']"), MANAGER_CANDIDATE_USERNAME)
        assignment_row = row_containing(driver, MANAGER_CANDIDATE_USERNAME)
        click_exact(assignment_row, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        assignment_row = wait.until(lambda current: row_containing(current, MANAGER_CANDIDATE_USERNAME))
        click_exact(assignment_row, "Reactivate")
        confirm_dialog(driver, wait, "Reactivate")
        pass_step(role, "restaurant-manager assignment create/deactivate/reactivate")

        open_page(driver, wait, "/platform-admin/branch-manager-assignments", "Branch Manager Access")
        form = driver.find_element(By.TAG_NAME, "form")
        selects = form.find_elements(By.TAG_NAME, "select")
        select_containing(selects[0], BRANCH_CANDIDATE_USERNAME)
        select_containing(selects[1], BRANCH_NAME)
        click_exact(form, "Assign branch")
        wait_for_text(driver, wait, "Branch access assigned")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']"), BRANCH_CANDIDATE_USERNAME)
        assignment_row = row_containing(driver, BRANCH_CANDIDATE_USERNAME)
        click_exact(assignment_row, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        assignment_row = wait.until(lambda current: row_containing(current, BRANCH_CANDIDATE_USERNAME))
        click_exact(assignment_row, "Reactivate")
        confirm_dialog(driver, wait, "Reactivate")
        pass_step(role, "branch-manager assignment create/deactivate/reactivate")

        open_page(driver, wait, "/platform-admin/bookings", "Booking Oversight")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']"), BRANCH_BOOKING_NAME)
        wait_for_text(driver, wait, BRANCH_BOOKING_NAME)
        pass_step(role, "platform-wide booking search and oversight")

        open_page(driver, wait, "/platform-admin/operations/history", "Operational History")
        set_value(driver.find_element(By.NAME, "search"), BRANCH_BOOKING_NAME)
        driver.find_element(By.XPATH, "//button[normalize-space()='Apply filters']").click()
        wait_for_text(driver, wait, BRANCH_BOOKING_NAME)
        pass_step(role, "platform-wide operational audit history")

        # Restaurant activation is last: deactivation intentionally revokes
        # active assignments, so it must not interrupt the earlier role tests.
        open_page(driver, wait, "/platform-admin/restaurants", "Restaurant Oversight")
        set_value(driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Search']"), RESTAURANT_NAME)
        restaurant_card = wait.until(lambda current: article_containing(current, RESTAURANT_NAME))
        click_exact(restaurant_card, "Deactivate")
        confirm_dialog(driver, wait, "Deactivate")
        restaurant_card = wait.until(lambda current: article_containing(current, RESTAURANT_NAME))
        click_exact(restaurant_card, "Activate")
        confirm_dialog(driver, wait, "Activate")
        pass_step(role, "restaurant deactivate/reactivate")
        driver.find_element(By.XPATH, "//button[normalize-space()='Sign out']").click()
        wait.until(EC.url_contains("/platform-admin/login"))
        pass_step(role, "secure sign out")
    finally:
        driver.quit()


def run_management_roles_test():
    """Prepare the app and run all role scenarios in dependency-safe order."""

    prepare_management_fixtures()
    started_processes = start_local_services()
    try:
        print("\nRunning Restaurant Manager actions...", flush=True)
        run_manager_scenario()
        print("\nRunning Branch Manager actions...", flush=True)
        run_branch_manager_scenario()
        print("\nRunning Platform Admin actions...", flush=True)
        run_admin_scenario()
        print("\nALL MANAGEMENT SELENIUM TESTS PASSED", flush=True)
    finally:
        stop_started_services(started_processes)


if __name__ == "__main__":
    run_management_roles_test()
