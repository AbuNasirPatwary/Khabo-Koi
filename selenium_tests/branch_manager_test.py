from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


# =============================================================================
# BRANCH MANAGER SELENIUM TEST
# =============================================================================

BASE_URL = "http://localhost:5173"

BRANCH_MANAGER_USERNAME = os.getenv("KHABO_BRANCH_MANAGER_USERNAME")
BRANCH_MANAGER_PASSWORD = os.getenv("KHABO_BRANCH_MANAGER_PASSWORD")

if not BRANCH_MANAGER_USERNAME or not BRANCH_MANAGER_PASSWORD:
    raise RuntimeError(
        "Branch Manager test credentials are not set."
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
# TEST 1 - BRANCH MANAGER LOGIN
# =============================================================================

driver.get(f"{BASE_URL}/branch-manager/login")

# Username input has no name attribute,
# so select the first normal text input.
driver.find_element(
    By.CSS_SELECTOR,
    "form input:not([type='password'])"
).send_keys(BRANCH_MANAGER_USERNAME)

driver.find_element(
    By.CSS_SELECTOR,
    "form input[type='password']"
).send_keys(BRANCH_MANAGER_PASSWORD)

driver.find_element(
    By.XPATH,
    "//form//button[contains(., 'Sign In')]"
).click()


wait.until(
    EC.url_contains("/branch-manager/dashboard")
)

dashboard_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[normalize-space()='Dashboard']"
        )
    )
)

assert dashboard_heading.text.strip() == "Dashboard"

print("TEST 1 PASSED: Branch Manager login successful")


# =============================================================================
# TEST 2 - RESERVATIONS
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/branch-manager/reservations']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/branch-manager/reservations']"
).click()


wait.until(
    EC.url_contains("/branch-manager/reservations")
)

reservations_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[normalize-space()='Reservations']"
        )
    )
)

assert reservations_heading.text.strip() == "Reservations"

print("TEST 2 PASSED: Branch Manager can access Reservations")


# =============================================================================
# TEST 3 - FOOD PRE-ORDERS
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/branch-manager/preorders']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/branch-manager/preorders']"
).click()


wait.until(
    EC.url_contains("/branch-manager/preorders")
)

preorders_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[normalize-space()='Food Pre-orders']"
        )
    )
)

assert preorders_heading.text.strip() == "Food Pre-orders"

print("TEST 3 PASSED: Branch Manager can access Food Pre-orders")


print("\nBRANCH MANAGER SELENIUM TESTS PASSED")