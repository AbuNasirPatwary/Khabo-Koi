
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0003_booking_user"),
    ]

    operations = [
        migrations.CreateModel(
            name="BranchMenuAvailability",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_available", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("branch", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="menu_availability", to="restaurants.branch")),
                ("food_item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="branch_availability", to="restaurants.fooditem")),
            ],
        ),
        migrations.CreateModel(
            name="FoodPreorder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("PLACED","Placed"),("PREPARING","Preparing"),("READY","Ready"),("COMPLETED","Completed"),("CANCELLED","Cancelled")], default="PLACED", max_length=20)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("advance_amount", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("payment_status", models.CharField(choices=[("UNPAID","Unpaid"),("ADVANCE_PAID","Advance Paid"),("PAID","Paid")], default="UNPAID", max_length=20)),
                ("payment_method", models.CharField(blank=True, max_length=30)),
                ("transaction_id", models.CharField(blank=True, max_length=80)),
                ("special_request", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="food_preorder", to="restaurants.booking")),
            ],
        ),
        migrations.CreateModel(
            name="FoodPreorderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("food_item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="preorder_items", to="restaurants.fooditem")),
                ("preorder", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="restaurants.foodpreorder")),
            ],
        ),
        migrations.AddConstraint(
            model_name="branchmenuavailability",
            constraint=models.UniqueConstraint(fields=("branch","food_item"), name="unique_branch_food_availability"),
        ),
        migrations.AddConstraint(
            model_name="foodpreorderitem",
            constraint=models.UniqueConstraint(fields=("preorder","food_item"), name="unique_food_item_per_preorder"),
        ),
    ]
