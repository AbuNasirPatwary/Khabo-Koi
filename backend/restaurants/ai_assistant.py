import os
import re

from openai import OpenAI, OpenAIError

from .models import Restaurant


MODEL_NAME = "openai/gpt-oss-20b"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"


SYSTEM_INSTRUCTIONS = """
You are Khabo-Koi AI Dining Assistant for a restaurant discovery and
reservation platform in Dhaka, Bangladesh.

Rules:
- Use ONLY the Khabo-Koi restaurant data provided in the prompt.
- Never invent restaurants, branches, food items, prices, ratings, or locations.
- Prices are in Bangladeshi Taka (BDT / ৳).
- If the requested information is not in the provided data, say that clearly.
- If a user asks for live table availability, explain that they should use
  Khabo-Koi's reservation flow because live table availability is not included
  in your current context.
- Recommend relevant choices when the data supports them.
- Keep answers concise, friendly, and practical.
"""


def build_restaurant_context():
    restaurants = (
        Restaurant.objects
        .filter(is_active=True)
        .prefetch_related("branches", "food_items")
        .order_by("name")
    )

    lines = []

    for restaurant in restaurants:
        lines.append(
            f"Restaurant: {restaurant.name} | "
            f"Cuisine: {restaurant.cuisine or 'Not specified'} | "
            f"Rating: {restaurant.rating}"
        )

        active_branches = [
            branch
            for branch in restaurant.branches.all()
            if branch.is_active
        ]

        if active_branches:
            lines.append("Branches:")
            for branch in active_branches:
                lines.append(
                    f"- {branch.name} | "
                    f"Address: {branch.address or 'Not specified'}"
                )
        else:
            lines.append("Branches: None currently active")

        available_foods = [
            food
            for food in restaurant.food_items.all()
            if food.is_available
        ]

        if available_foods:
            lines.append("Available menu items:")
            for food in available_foods[:30]:
                lines.append(
                    f"- {food.name} | "
                    f"Category: {food.category} | "
                    f"Price: ৳{food.price} | "
                    f"Rating: {food.rating}"
                )
        else:
            lines.append("Available menu items: None")

        lines.append("")

    return "\n".join(lines)


def _extract_budget(message):
    """Read a simple upper-price limit such as "under 500 taka"."""

    match = re.search(
        r"(?:under|below|within|maximum|max|less than)\s*"
        r"(?:৳|bdt|tk|taka)?\s*(\d+(?:\.\d+)?)",
        message.lower(),
    )
    return float(match.group(1)) if match else None


def generate_local_dining_response(message):
    """Return database-backed recommendations when Groq is unavailable.

    This is deliberately not presented as generative AI. It searches only the
    active restaurants, branches, and available menu items already stored in
    Khabo-Koi, which keeps the assistant useful during demos without inventing
    any restaurant information.
    """

    restaurants = list(
        Restaurant.objects
        .filter(is_active=True)
        .prefetch_related("branches", "food_items")
        .order_by("name")
    )

    if not restaurants:
        return "No active restaurants are available in Khabo-Koi right now."

    query = message.lower()
    budget = _extract_budget(message)
    ignored_words = {
        "a", "an", "and", "any", "bdt", "below", "best", "can", "find",
        "for", "food", "good", "i", "in", "is", "item", "less", "max",
        "maximum", "me", "of", "or", "please", "recommend", "restaurant",
        "show", "some", "taka", "than", "the", "to", "under", "want",
        "with", "within", "you",
    }
    search_terms = {
        word for word in re.findall(r"[a-z0-9]+", query)
        if len(word) > 2 and not word.isdigit() and word not in ignored_words
    }

    menu_matches = []
    restaurant_matches = []

    for restaurant in restaurants:
        active_branches = [
            branch for branch in restaurant.branches.all()
            if branch.is_active
        ]
        restaurant_text = " ".join([
            restaurant.name,
            restaurant.cuisine,
            restaurant.description,
            *(branch.name for branch in active_branches),
            *(branch.address for branch in active_branches),
        ]).lower()
        restaurant_score = sum(term in restaurant_text for term in search_terms)
        if restaurant_score or not search_terms:
            restaurant_matches.append((restaurant_score, restaurant, active_branches))

        for food in restaurant.food_items.all():
            if not food.is_available:
                continue
            if budget is not None and float(food.price) > budget:
                continue
            food_text = " ".join([
                food.name,
                food.category,
                food.description,
                restaurant.name,
            ]).lower()
            score = sum(term in food_text for term in search_terms)
            if score or not search_terms:
                menu_matches.append((score, food, restaurant))

    # Prefer direct keyword matches, then higher ratings and lower prices.
    menu_matches.sort(
        key=lambda row: (
            -row[0],
            -float(row[1].rating),
            float(row[1].price),
        )
    )
    restaurant_matches.sort(
        key=lambda row: (-row[0], -float(row[1].rating), row[1].name)
    )

    lines = []
    if menu_matches:
        lines.append("Here are menu choices from Khabo-Koi:")
        for _, food, restaurant in menu_matches[:5]:
            lines.append(
                f"- {food.name} at {restaurant.name} — "
                f"{food.category}, ৳{food.price}, rating {food.rating}"
            )
    elif budget is not None:
        lines.append(
            f"I could not find an available menu item within ৳{budget:g}."
        )

    if not lines and restaurant_matches:
        lines.append("These restaurants may suit your request:")
        for _, restaurant, branches in restaurant_matches[:5]:
            branch_names = ", ".join(branch.name for branch in branches)
            lines.append(
                f"- {restaurant.name} — {restaurant.cuisine or 'Cuisine not specified'}, "
                f"rating {restaurant.rating}"
                f"{f'; branches: {branch_names}' if branch_names else ''}"
            )

    if not lines:
        top_restaurants = sorted(
            restaurants,
            key=lambda restaurant: (-float(restaurant.rating), restaurant.name),
        )[:5]
        lines.append(
            "I could not find an exact match. These are the highest-rated "
            "active restaurants in Khabo-Koi:"
        )
        lines.extend(
            f"- {restaurant.name} — {restaurant.cuisine or 'Cuisine not specified'}, "
            f"rating {restaurant.rating}"
            for restaurant in top_restaurants
        )

    lines.append(
        "Open the restaurant page to check details and current table availability."
    )
    return "\n".join(lines)


def generate_dining_response(message):
    api_key = os.getenv("GROQ_API_KEY")

    # A missing or placeholder key should not make the whole customer feature
    # unusable. The local fallback remains strictly grounded in database data.
    if (
        not api_key
        or not api_key.startswith("gsk_")
        or "YOUR_GROQ_API_KEY" in api_key.upper()
    ):
        return generate_local_dining_response(message)

    client = OpenAI(
        api_key=api_key,
        base_url=GROQ_BASE_URL,
    )

    restaurant_context = build_restaurant_context()

    prompt = f"""
KHABO-KOI DATABASE DATA:

{restaurant_context}

USER QUESTION:
{message}
"""

    try:
        response = client.responses.create(
            model=MODEL_NAME,
            instructions=SYSTEM_INSTRUCTIONS,
            input=prompt,
        )
    except OpenAIError:
        return generate_local_dining_response(message)

    answer = response.output_text.strip()

    if not answer:
        return generate_local_dining_response(message)

    return answer
