import os
import time
from datetime import date, timedelta

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# =========================================================
# CONFIGURATION
# =========================================================

BASE_URL = os.getenv(
    "E2E_BASE_URL",
    "http://localhost:5173",
)

CUSTOMER_USERNAME = os.getenv(
    "E2E_CUSTOMER_USERNAME",
    "selenium_customer",
)

CUSTOMER_PASSWORD = os.getenv(
    "E2E_CUSTOMER_PASSWORD",
    "testpass123",
)

RESTAURANT_ID = os.getenv(
    "E2E_RESTAURANT_ID",
    "1",
)

# Delay between visible Selenium actions.
# This makes the test easier to follow during a presentation.
DEMO_DELAY = 2


def demo_pause():
    time.sleep(DEMO_DELAY)


def wait_for_page(driver, text, timeout=15):
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                f"//*[contains(normalize-space(), '{text}')]",
            )
        )
    )


def main():

    # =========================================================
    # START CHROME
    # =========================================================

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_experimental_option("detach", True)

    driver = webdriver.Chrome(options=chrome_options)

    driver.maximize_window()

    wait = WebDriverWait(
        driver,
        15,
    )

    try:

        # =====================================================
        # 1. CUSTOMER LOGIN
        # =====================================================

        print("\nSTEP 1: Customer Login")

        driver.get(
            f"{BASE_URL}/login"
        )

        username_input = wait.until(
            EC.presence_of_element_located(
                (
                    By.NAME,
                    "username",
                )
            )
        )

        password_input = driver.find_element(
            By.NAME,
            "password",
        )

        username_input.send_keys(
            CUSTOMER_USERNAME
        )

        password_input.send_keys(
            CUSTOMER_PASSWORD
        )

        demo_pause()

        driver.find_element(
            By.CSS_SELECTOR,
            'button[type="submit"]',
        ).click()

        wait.until(
            lambda current_driver:
                current_driver.current_url
                != f"{BASE_URL}/login"
        )

        print(
            "PASS: Customer login successful"
        )

        demo_pause()


        # =====================================================
        # 2. OPEN RESTAURANT RESERVATION PAGE
        # =====================================================

        print(
            "\nSTEP 2: Open Restaurant Reservation Page"
        )

        driver.get(
            f"{BASE_URL}/restaurants/"
            f"{RESTAURANT_ID}#reservation"
        )

        wait_for_page(
            driver,
            "Reserve your table",
        )

        print(
            "PASS: Restaurant reservation page opened"
        )

        demo_pause()


        # =====================================================
        # 3. SELECT BRANCH
        # =====================================================

        print("\nSTEP 3: Select Branch")

        branch_select = wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    "//label[contains(., 'Branch')]"
                    "/following-sibling::select",
                )
            )
        )

        branch_options = Select(
            branch_select
        )

        if len(branch_options.options) < 2:
            raise AssertionError(
                "No branch option is available."
            )

        # Index 0 is normally the placeholder.
        # Index 1 selects the first real branch.
        branch_options.select_by_index(1)

        print(
            "PASS: Branch selected"
        )

        demo_pause()


        # =====================================================
        # 4. SELECT RESERVATION DATE
        # =====================================================

        print(
            "\nSTEP 4: Select Reservation Date"
        )

        tomorrow = (
            date.today()
            + timedelta(days=1)
        ).isoformat()

        date_input = driver.find_element(
            By.CSS_SELECTOR,
            'input[type="date"]',
        )

        # React-controlled input:
        # use the native HTML input setter so React detects
        # the change correctly.
        driver.execute_script(
            """
            const input = arguments[0];
            const value = arguments[1];

            const setter =
                Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value'
                ).set;

            setter.call(
                input,
                value
            );

            input.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );

            input.dispatchEvent(
                new Event(
                    'change',
                    {
                        bubbles: true
                    }
                )
            );
            """,
            date_input,
            tomorrow,
        )

        print(
            f"PASS: Reservation date selected "
            f"({tomorrow})"
        )

        demo_pause()


        # =====================================================
        # 5. SELECT ARRIVAL TIME
        # =====================================================

        print(
            "\nSTEP 5: Select Arrival Time"
        )

        time_select = driver.find_element(
            By.XPATH,
            "//label[contains(., 'Arrival Time')]"
            "/following-sibling::select",
        )

        time_options = Select(
            time_select
        )

        if len(time_options.options) < 2:
            raise AssertionError(
                "No reservation time is available."
            )

        time_options.select_by_index(1)

        print(
            "PASS: Arrival time selected"
        )

        demo_pause()


        # =====================================================
        # 6. SELECT NUMBER OF GUESTS
        # =====================================================

        print(
            "\nSTEP 6: Select Number of Guests"
        )

        guest_select = driver.find_element(
            By.XPATH,
            "//label[contains(., 'Number of Guests')]"
            "/following-sibling::select",
        )

        guest_options = Select(
            guest_select
        )

        guest_options.select_by_value(
            "2"
        )

        print(
            "PASS: Guest count selected"
        )

        demo_pause()


        # =====================================================
        # 7. ENTER CUSTOMER INFORMATION
        # =====================================================

        print(
            "\nSTEP 7: Enter Customer Information"
        )

        customer_name_input = (
            driver.find_element(
                By.CSS_SELECTOR,
                'input[placeholder="Your name"]',
            )
        )

        customer_phone_input = (
            driver.find_element(
                By.CSS_SELECTOR,
                'input[placeholder="Phone number"]',
            )
        )

        customer_name_input.clear()

        customer_name_input.send_keys(
            "Selenium Test Customer"
        )

        customer_phone_input.clear()

        customer_phone_input.send_keys(
            "01711111111"
        )

        print(
            "PASS: Customer information entered"
        )

        demo_pause()


        # =====================================================
        # 8. CHECK TABLE AVAILABILITY
        # =====================================================

        print(
            "\nSTEP 8: Check Table Availability"
        )

        check_button = driver.find_element(
            By.XPATH,
            "//button[contains("
            "., 'Check Table Availability')]",
        )

        check_button.click()

        # Give the viewer time to see the request happen.
        demo_pause()

        # If the frontend displays a reservation error,
        # print it in the terminal for easier debugging.
        error_elements = driver.find_elements(
            By.CSS_SELECTOR,
            "div.text-red-600",
        )

        for element in error_elements:

            if element.text.strip():

                print(
                    "PAGE ERROR:",
                    element.text.strip(),
                )

        wait.until(
            EC.presence_of_element_located(
                (
                    By.XPATH,
                    "//*[contains("
                    "., 'Available Tables')]",
                )
            )
        )

        print(
            "PASS: Table availability checked"
        )

        demo_pause()


        # =====================================================
        # 9. SELECT FIRST AVAILABLE TABLE
        # =====================================================

        print(
            "\nSTEP 9: Select Available Table"
        )

        table_buttons = driver.find_elements(
            By.XPATH,
            "//h3[contains(., 'Available Tables')]"
            "/following::*[self::button]",
        )

        if not table_buttons:

            raise AssertionError(
                "No available table found for "
                "the selected date/time."
            )

        table_buttons[0].click()

        print(
            "PASS: Available table selected"
        )

        demo_pause()


        # =====================================================
        # 10. CREATE RESERVATION
        # =====================================================

        print(
            "\nSTEP 10: Create Reservation"
        )

        reserve_button = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//button["
                    "starts-with("
                    "normalize-space(), "
                    "'Reserve '"
                    ")"
                    "]",
                )
            )
        )

        reserve_button.click()

        wait_for_page(
            driver,
            "Reservation Confirmed",
        )

        print(
            "PASS: Reservation created successfully"
        )

        # Let the viewer see the green
        # Reservation Confirmed message.
        demo_pause()


        # =====================================================
        # 11. OPEN MY BOOKINGS
        # =====================================================

        print(
            "\nSTEP 11: Open My Bookings"
        )

        driver.get(
            f"{BASE_URL}/my-bookings"
        )

        wait_for_page(
            driver,
            "My Bookings",
        )

        demo_pause()


        # =====================================================
        # 12. VERIFY NEW BOOKING
        # =====================================================

        print(
            "\nSTEP 12: Verify Reservation in My Bookings"
        )

        wait_for_page(
            driver,
            tomorrow,
        )

        wait_for_page(
            driver,
            tomorrow,
        )

        print(
            "PASS: New reservation appears "
            "in My Bookings"
        )

        print()
        print(
            "=========================================="
        )
        print(
            "CUSTOMER BOOKING SELENIUM TEST: PASSED"
        )
        print(
            "=========================================="
        )

        # Keep the final My Bookings page visible
        # slightly longer for the presentation.
        time.sleep(4)


    finally:
        print("Test finished. Browser will remain open.")


if __name__ == "__main__":
    main()