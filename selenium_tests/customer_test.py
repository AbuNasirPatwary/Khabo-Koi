from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


# =============================================================================
# CUSTOMER SELENIUM TEST
# =============================================================================

BASE_URL = "http://localhost:5173"

# Keep credentials outside the source code.
CUSTOMER_USERNAME = os.getenv("KHABO_CUSTOMER_USERNAME")
CUSTOMER_PASSWORD = os.getenv("KHABO_CUSTOMER_PASSWORD")


# =============================================================================
# DRIVER SETUP
# =============================================================================

options = webdriver.EdgeOptions()

# Keeps the browser open after the script finishes.
options.add_experimental_option("detach", True)

service_obj = Service()

driver = webdriver.Edge(
    options=options,
    service=service_obj,
)

driver.maximize_window()

wait = WebDriverWait(driver, 10)


# =============================================================================
# TEST 1 - CUSTOMER LOGIN
# =============================================================================

driver.get(f"{BASE_URL}/login")

driver.find_element(
    By.NAME,
    "username",
).send_keys(CUSTOMER_USERNAME)

driver.find_element(
    By.NAME,
    "password",
).send_keys(CUSTOMER_PASSWORD)

driver.find_element(
    By.XPATH,
    "//button[@type='submit']",
).click()


# Wait until login redirects customer to home page.
wait.until(
    EC.url_to_be(f"{BASE_URL}/")
)

assert driver.current_url == f"{BASE_URL}/"

print("TEST 1 PASSED: Customer login successful")


# =============================================================================
# TEST 2 - RESTAURANTS PAGE
# =============================================================================

restaurants_link = wait.until(
    EC.element_to_be_clickable(
        (By.LINK_TEXT, "Restaurants")
    )
)

restaurants_link.click()

wait.until(
    EC.url_contains("/restaurants")
)

assert "/restaurants" in driver.current_url

print("TEST 2 PASSED: Customer can open Restaurants page")


# =============================================================================
# TEST 3 - AI ASSISTANT PAGE
# =============================================================================

wait.until(
    EC.presence_of_element_located(
        (By.CSS_SELECTOR, "a[href='/ai-assistant']")
    )
)

driver.find_element(
    By.CSS_SELECTOR,
    "a[href='/ai-assistant']"
).click()



wait.until(
    EC.url_contains("/ai-assistant")
)

heading = wait.until(
    EC.visibility_of_element_located(
        (
            By.XPATH,
            "//h1[contains(text(),'What do you feel like eating?')]"
        )
    )
)

assert "What do you feel like eating?" in heading.text

print("TEST 3 PASSED: Customer can access AI Dining Assistant")


print("\nCUSTOMER SELENIUM TESTS PASSED")