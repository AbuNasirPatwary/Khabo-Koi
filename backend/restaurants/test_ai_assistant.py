from unittest.mock import patch

from django.test import TestCase

from .ai_assistant import generate_dining_response
from .models import Branch, FoodItem, Restaurant


class DiningAssistantFallbackTests(TestCase):
    """The customer chat must remain useful without an external API key."""

    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Fallback Kitchen",
            cuisine="Bangladeshi",
            rating="4.7",
            is_active=True,
        )
        Branch.objects.create(
            restaurant=self.restaurant,
            name="Dhanmondi",
            address="Road 27, Dhanmondi",
            is_active=True,
        )
        FoodItem.objects.create(
            restaurant=self.restaurant,
            name="Chicken Biryani",
            category="Biryani",
            price="350.00",
            rating="4.8",
            is_available=True,
        )
        FoodItem.objects.create(
            restaurant=self.restaurant,
            name="Premium Platter",
            category="Platter",
            price="950.00",
            rating="4.9",
            is_available=True,
        )

    @patch.dict("os.environ", {}, clear=False)
    def test_missing_key_uses_database_backed_recommendation(self):
        with patch("restaurants.ai_assistant.os.getenv", return_value=None):
            answer = generate_dining_response("Recommend biryani under 500 taka")

        self.assertIn("Chicken Biryani", answer)
        self.assertIn("Fallback Kitchen", answer)
        self.assertNotIn("Premium Platter", answer)

    def test_placeholder_key_also_uses_local_fallback(self):
        with patch(
            "restaurants.ai_assistant.os.getenv",
            return_value="YOUR_GROQ_API_KEY",
        ):
            answer = generate_dining_response("Where can I eat in Dhanmondi?")

        self.assertIn("Fallback Kitchen", answer)
        self.assertIn("Dhanmondi", answer)
