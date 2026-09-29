from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


# =============================================================================
# PLATFORM ADMIN SELENIUM TEST
# =============================================================================

BASE_URL = "http://localhost:5173"

ADMIN_USERNAME = os.getenv("KHABO_ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("KHABO_ADMIN_PASSWORD")

if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    raise RuntimeError(
        "Admin test credentials are not set."
    )


# =============================================================================
# DRIVER SETUP
# =============================================================================

options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)

service_obj = Service()

driver = webdriver.Edge(
    options=options,
    service=service_obj,
)

driver.maximize_window()

wait = WebDriverWait(driver, 10)


# =============================================================================
# TEST 1 - PLATFORM ADMIN LOGIN
# =============================================================================

driver.get(f"{BASE_URL}/platform-admin/login")

driver.find_element(
    By.NAME,
    "username",
).send_keys(ADMIN_USERNAME)

driver.find_element(
    By.NAME,
    "password",
).send_keys(ADMIN_PASSWORD)

driver.find_element(
    By.XPATH,
    "//button[@type='submit']",
).click()


wait.until(
    EC.url_contains("/platform-admin/dashboard")
)

dashboard_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'Admin Dashboard')]"
        )
    )
)

assert "Admin Dashboard" in dashboard_heading.text

print("TEST 1 PASSED: Platform Admin login successful")


# =============================================================================
# TEST 2 - RESTAURANT MANAGEMENT
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/platform-admin/restaurants']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/platform-admin/restaurants']"
).click()


wait.until(
    EC.url_contains("/platform-admin/restaurants")
)

restaurant_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'Restaurant Oversight')]"
        )
    )
)

assert "Restaurant Oversight" in restaurant_heading.text

print("TEST 2 PASSED: Admin can access Restaurant management")


# =============================================================================
# TEST 3 - USER MANAGEMENT
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/platform-admin/users']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/platform-admin/users']"
).click()


wait.until(
    EC.url_contains("/platform-admin/users")
)

users_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'User Management')]"
        )
    )
)

assert "User Management" in users_heading.text

print("TEST 3 PASSED: Admin can access User Management")


print("\nPLATFORM ADMIN SELENIUM TESTS PASSED")