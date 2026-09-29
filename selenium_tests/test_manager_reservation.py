import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# =========================================================
# CONFIGURATION
# =========================================================

BASE_URL = os.getenv(
    "E2E_BASE_URL",
    "http://localhost:5173",
)

MANAGER_USERNAME = os.getenv(
    "E2E_MANAGER_USERNAME",
    "selenium_manager",
)

MANAGER_PASSWORD = os.getenv(
    "E2E_MANAGER_PASSWORD",
    "testpass123",
)

TEST_CUSTOMER = os.getenv(
    "E2E_TEST_CUSTOMER",
    "Selenium Pending Customer",
)

# Presentation-friendly pause between major actions.
DEMO_DELAY = 2


def demo_pause():
    time.sleep(DEMO_DELAY)


def wait_for_text(driver, text, timeout=15):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                f"//*[contains(normalize-space(), '{text}')]",
            )
        )
    )


def get_reservation_row(driver):
    """
    Find the reservation table row belonging to our
    dedicated Selenium customer.
    """

    return WebDriverWait(driver, 15).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                f"//tr[.//*[contains("
                f"normalize-space(), '{TEST_CUSTOMER}'"
                f")]]",
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
        # 1. MANAGER LOGIN
        # =====================================================

        print()
        print("STEP 1: Restaurant Manager Login")

        driver.get(
            f"{BASE_URL}/manager/login"
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
            MANAGER_USERNAME
        )

        password_input.send_keys(
            MANAGER_PASSWORD
        )

        demo_pause()

        driver.find_element(
            By.CSS_SELECTOR,
            'button[type="submit"]',
        ).click()

        # Successful Manager login redirects to dashboard.
        wait.until(
            EC.url_contains(
                "/manager/dashboard"
            )
        )

        print(
            "PASS: Restaurant Manager login successful"
        )

        demo_pause()


        # =====================================================
        # 2. OPEN MANAGER RESERVATIONS
        # =====================================================

        print()
        print("STEP 2: Open Manager Reservations")

        driver.get(
            f"{BASE_URL}/manager/reservations"
        )

        wait_for_text(
            driver,
            "Reservation queue",
        )

        print(
            "PASS: Manager Reservations page opened"
        )

        demo_pause()


        # =====================================================
        # 3. SEARCH FOR TEST CUSTOMER
        # =====================================================

        print()
        print(
            "STEP 3: Search for Selenium Pending Customer"
        )

        search_input = wait.until(
            EC.presence_of_element_located(
                (
                    By.NAME,
                    "search",
                )
            )
        )

        search_input.clear()

        search_input.send_keys(
            TEST_CUSTOMER
        )

        demo_pause()

        apply_button = driver.find_element(
            By.XPATH,
            "//button[contains("
            "normalize-space(), 'Apply filters')]",
        )

        apply_button.click()

        wait_for_text(
            driver,
            TEST_CUSTOMER,
        )

        print(
            "PASS: Pending reservation located"
        )

        demo_pause()


        # =====================================================
        # 4. VERIFY INITIAL STATUS = PENDING
        # =====================================================

        print()
        print("STEP 4: Verify Initial Status")

        reservation_row = get_reservation_row(
            driver
        )

        if "PENDING" not in reservation_row.text:

            raise AssertionError(
                "Expected reservation status PENDING, "
                f"but row contains:\n{reservation_row.text}"
            )

        print(
            "PASS: Reservation status is PENDING"
        )

        demo_pause()


        # =====================================================
        # 5. CLICK CONFIRMED
        # =====================================================

        print()
        print(
            "STEP 5: Change PENDING to CONFIRMED"
        )

        confirm_button = reservation_row.find_element(
            By.XPATH,
            ".//button["
            "normalize-space()='CONFIRMED'"
            "]",
        )

        confirm_button.click()

        print(
            "PASS: CONFIRMED action selected"
        )

        demo_pause()


        # =====================================================
        # 6. ACCEPT BROWSER CONFIRMATION
        # =====================================================

        print()
        print(
            "STEP 6: Accept Confirmation Dialog"
        )

        alert = wait.until(
            EC.alert_is_present()
        )

        print(
            "Dialog:",
            alert.text,
        )

        demo_pause()

        alert.accept()

        print(
            "PASS: Confirmation dialog accepted"
        )

        demo_pause()


        # =====================================================
        # 7. VERIFY SUCCESS MESSAGE
        # =====================================================

        print()
        print(
            "STEP 7: Verify Status Update Success"
        )

        success_message = wait.until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    '[role="status"]',
                )
            )
        )

        if "updated" not in success_message.text.lower():

            raise AssertionError(
                "Expected reservation update success "
                f"message, but received: "
                f"{success_message.text}"
            )

        print(
            "PASS:",
            success_message.text,
        )

        demo_pause()


        # =====================================================
        # 8. VERIFY STATUS NOW CONFIRMED
        # =====================================================

        print()
        print(
            "STEP 8: Verify New Reservation Status"
        )

        # React re-renders the row after the API update,
        # so locate the row again instead of using the old
        # Selenium element.
        reservation_row = get_reservation_row(
            driver
        )

        wait.until(
            lambda current_driver:
                "CONFIRMED"
                in get_reservation_row(
                    current_driver
                ).text
        )

        reservation_row = get_reservation_row(
            driver
        )

        if "CONFIRMED" not in reservation_row.text:

            raise AssertionError(
                "Reservation did not change to CONFIRMED."
            )

        print(
            "PASS: Reservation status changed "
            "from PENDING to CONFIRMED"
        )

        print()
        print(
            "============================================"
        )
        print(
            "MANAGER RESERVATION SELENIUM TEST: PASSED"
        )
        print(
            "============================================"
        )

        # Keep the final CONFIRMED state visible
        # for the instructor/demo.
        time.sleep(4)


    finally:
        print("Test finished. Browser will remain open.")


if __name__ == "__main__":
    main()