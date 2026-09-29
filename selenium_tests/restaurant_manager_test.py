from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


# =============================================================================
# RESTAURANT MANAGER SELENIUM TEST
# =============================================================================

BASE_URL = "http://localhost:5173"

MANAGER_USERNAME = os.getenv("KHABO_MANAGER_USERNAME")
MANAGER_PASSWORD = os.getenv("KHABO_MANAGER_PASSWORD")

if not MANAGER_USERNAME or not MANAGER_PASSWORD:
    raise RuntimeError(
        "Restaurant Manager test credentials are not set."
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
# TEST 1 - RESTAURANT MANAGER LOGIN
# =============================================================================

driver.get(f"{BASE_URL}/manager/login")

driver.find_element(
    By.NAME,
    "username",
).send_keys(MANAGER_USERNAME)

driver.find_element(
    By.NAME,
    "password",
).send_keys(MANAGER_PASSWORD)

driver.find_element(
    By.XPATH,
    "//button[@type='submit']",
).click()


wait.until(
    EC.url_contains("/manager/dashboard")
)

dashboard_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'Manager Dashboard')]"
        )
    )
)

assert "Manager Dashboard" in dashboard_heading.text

print("TEST 1 PASSED: Restaurant Manager login successful")


# =============================================================================
# TEST 2 - RESERVATIONS
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/manager/reservations']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/manager/reservations']"
).click()


wait.until(
    EC.url_contains("/manager/reservations")
)

reservations_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'Reservations')]"
        )
    )
)

assert "Reservations" in reservations_heading.text

print("TEST 2 PASSED: Manager can access Reservations")


# =============================================================================
# TEST 3 - MENU
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (
            By.CSS_SELECTOR,
            "a[href='/manager/menu']"
        )
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/manager/menu']"
).click()


wait.until(
    EC.url_contains("/manager/menu")
)

menu_heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'Menu')]"
        )
    )
)

assert menu_heading.text.strip() == "Menu"

print("TEST 3 PASSED: Manager can access Menu")


print("\nRESTAURANT MANAGER SELENIUM TESTS PASSED")