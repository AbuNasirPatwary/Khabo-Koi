import os

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


def generate_dining_response(message):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

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
    except OpenAIError as error:
        raise RuntimeError("The AI service is currently unavailable.") from error

    answer = response.output_text.strip()

    if not answer:
        raise RuntimeError("The AI service returned an empty response.")

    return answer