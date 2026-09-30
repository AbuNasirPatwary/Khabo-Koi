"""Unified Selenium test for the main Khabo-Koi customer journey.

This combines the classroom examples into one practical test:

1. Open, refresh, go back, and go forward in the browser.
2. Locate form fields, enter login/search data, click buttons, and assert results.
3. Find multiple restaurant elements and print their visible information.

When run directly, this script prepares its local test customer and starts the
Django and Vite development servers if they are not already running.
"""

import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIRECTORY = REPOSITORY_ROOT / "backend"
FRONTEND_DIRECTORY = REPOSITORY_ROOT / "frontend"

BASE_URL = os.getenv("KHABO_BASE_URL", "http://localhost:5173").rstrip("/")
BACKEND_HEALTH_URL = "http://127.0.0.1:8000/api/restaurants/"

# These credentials belong only to an automatically prepared local test user.
# Environment variables can still override them when required.
CUSTOMER_USERNAME = os.getenv("KHABO_CUSTOMER_USERNAME", "selenium_customer")
CUSTOMER_PASSWORD = os.getenv(
    "KHABO_CUSTOMER_PASSWORD",
    "Selenium-Khabo-827!",
)
BROWSER = os.getenv("KHABO_BROWSER", "chrome").lower()
HEADLESS = os.getenv("KHABO_HEADLESS", "0").lower() in {"1", "true", "yes"}
VISUAL_DELAY = float(os.getenv("KHABO_VISUAL_DELAY", "1.2"))


def service_is_available(url):
    """Return True when a local development service accepts HTTP requests."""

    try:
        with urlopen(url, timeout=2) as response:
            return response.status < 500
    except (URLError, TimeoutError):
        return False


def wait_for_service(url, name, timeout=30):
    """Wait for a development server and fail with a clear error if needed."""

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if service_is_available(url):
            print(f"{name} is ready.", flush=True)
            return
        time.sleep(0.5)

    raise RuntimeError(f"{name} did not start within {timeout} seconds.")


def start_local_services():
    """Start only the servers that are not already running."""

    started_processes = []

    if service_is_available(BACKEND_HEALTH_URL):
        print("Django backend is already running.", flush=True)
    else:
        print("Starting Django backend...", flush=True)
        backend_process = subprocess.Popen(
            [
                sys.executable,
                str(BACKEND_DIRECTORY / "manage.py"),
                "runserver",
                "127.0.0.1:8000",
                "--noreload",
            ],
            cwd=REPOSITORY_ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        started_processes.append(backend_process)
        wait_for_service(BACKEND_HEALTH_URL, "Django backend")

    if service_is_available(f"{BASE_URL}/"):
        print("Vite frontend is already running.", flush=True)
    else:
        print("Starting Vite frontend...", flush=True)
        frontend_process = subprocess.Popen(
            [
                "npm",
                "run",
                "dev",
                "--",
                "--host",
                "127.0.0.1",
            ],
            cwd=FRONTEND_DIRECTORY,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        started_processes.append(frontend_process)
        wait_for_service(f"{BASE_URL}/", "Vite frontend")

    return started_processes


def stop_started_services(processes):
    """Stop only processes created by this test, leaving existing servers alone."""

    for process in reversed(processes):
        if process.poll() is not None:
            continue
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)


def prepare_local_customer():
    """Create or reset the dedicated local Selenium customer's password."""

    sys.path.insert(0, str(BACKEND_DIRECTORY))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    import django

    django.setup()

    from django.contrib.auth import get_user_model

    user_model = get_user_model()
    user, _ = user_model.objects.get_or_create(
        username=CUSTOMER_USERNAME,
        defaults={"email": "selenium@example.com"},
    )
    user.is_active = True
    user.set_password(CUSTOMER_PASSWORD)
    user.save(update_fields=["password", "is_active"])
    print("Local Selenium customer is ready.", flush=True)


def visual_pause(seconds=None):
    """Keep visible browser actions slow enough to follow during a demo."""

    if HEADLESS:
        return
    time.sleep(VISUAL_DELAY if seconds is None else seconds)


def create_driver():
    """Create visible Chrome by default, with Edge also available."""

    if BROWSER == "chrome":
        options = webdriver.ChromeOptions()
        if HEADLESS:
            options.add_argument("--headless=new")
        return webdriver.Chrome(options=options)

    if BROWSER == "edge":
        options = webdriver.EdgeOptions()
        if HEADLESS:
            options.add_argument("--headless=new")
        return webdriver.Edge(options=options)

    raise RuntimeError("KHABO_BROWSER must be either 'edge' or 'chrome'.")


def require_credentials():
    """Fail early with a useful message instead of submitting empty fields."""

    if not CUSTOMER_USERNAME or not CUSTOMER_PASSWORD:
        raise RuntimeError(
            "Set KHABO_CUSTOMER_USERNAME and KHABO_CUSTOMER_PASSWORD "
            "before running this test."
        )


def run_unified_customer_test():
    require_credentials()
    print(f"Starting {BROWSER.title()} WebDriver...", flush=True)
    driver = create_driver()
    print("WebDriver started. Opening Khabo-Koi...", flush=True)
    wait = WebDriverWait(driver, 15)

    try:
        driver.maximize_window()

        # ------------------------------------------------------------------
        # PART 1: Browser navigation from the first classroom example.
        # ------------------------------------------------------------------
        driver.get(BASE_URL)
        visual_pause()
        print("Page title:", driver.title)
        print("Current URL:", driver.current_url)

        assert driver.current_url.rstrip("/") == BASE_URL.rstrip("/")

        driver.refresh()
        wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(., 'Find the right')]")
            )
        )
        visual_pause()
        print("TEST 1 PASSED: Homepage opened and refreshed")

        # ------------------------------------------------------------------
        # PART 2: Locate, fill, clear, click, and assert like code2.
        # ------------------------------------------------------------------
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Sign In"))).click()
        wait.until(EC.url_contains("/login"))

        username_input = wait.until(
            EC.visibility_of_element_located((By.NAME, "username"))
        )
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

        # clear() demonstrates replacing any value that may already exist.
        username_input.clear()
        username_input.send_keys(CUSTOMER_USERNAME)
        password_input.clear()
        password_input.send_keys(CUSTOMER_PASSWORD)
        visual_pause()

        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        visual_pause()

        assert driver.current_url == f"{BASE_URL}/"
        print("TEST 2 PASSED: Customer login form submitted successfully")

        wait.until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Restaurants"))
        ).click()
        wait.until(EC.url_contains("/restaurants"))
        wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(., 'Find your perfect place to dine')]")
            )
        )
        visual_pause()

        # ------------------------------------------------------------------
        # PART 3: Read a collection of elements like code3.
        # ------------------------------------------------------------------
        restaurant_cards = wait.until(
            lambda current_driver: current_driver.find_elements(
                By.XPATH,
                "//article[.//h3]",
            )
            or False
        )

        print(f"\nFound {len(restaurant_cards)} restaurant card(s):")
        for number, card in enumerate(restaurant_cards, start=1):
            print(f"\nRestaurant {number}\n{card.text}")

        assert restaurant_cards, "No restaurant cards were loaded from the API."

        # Use the first real restaurant name as search input so the test does
        # not depend on a particular seeded restaurant name.
        first_restaurant_name = restaurant_cards[0].find_element(By.TAG_NAME, "h3").text
        search_input = driver.find_element(
            By.CSS_SELECTOR,
            "input[placeholder='Search restaurant, cuisine or location']",
        )
        search_input.clear()
        search_input.send_keys(first_restaurant_name)
        visual_pause()

        filtered_cards = wait.until(
            lambda current_driver: [
                card
                for card in current_driver.find_elements(
                    By.XPATH,
                    "//article[.//h3]",
                )
                if card.is_displayed()
            ]
            or False
        )

        assert all(
            first_restaurant_name.lower() in card.text.lower()
            for card in filtered_cards
        )
        print("TEST 3 PASSED: Restaurant list loaded, printed, and filtered")

        # Finish by demonstrating browser history and reload operations.
        driver.back()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        driver.forward()
        wait.until(EC.url_contains("/restaurants"))
        driver.refresh()
        wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(., 'Find your perfect place to dine')]")
            )
        )
        visual_pause()
        print("TEST 4 PASSED: Browser back, forward, and refresh work")

        print("\nALL UNIFIED KHABO-KOI SELENIUM TESTS PASSED")
        visual_pause(4)

    finally:
        driver.quit()


def run_complete_visual_test():
    """Prepare the environment, run the UI test, and clean up safely."""

    started_processes = []
    try:
        prepare_local_customer()
        started_processes = start_local_services()
        run_unified_customer_test()
    finally:
        stop_started_services(started_processes)


if __name__ == "__main__":
    run_complete_visual_test()
