
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_backfill_existing_user_profiles"),
        ("restaurants", "0003_booking_user"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BranchManagerAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("is_active", models.BooleanField(default=True)),
                ("assigned_at", models.DateTimeField(auto_now_add=True)),
                ("assigned_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="branch_manager_assignments_created", to=settings.AUTH_USER_MODEL)),
                ("branch", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="branch_manager_assignments", to="restaurants.branch")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="branch_manager_assignments", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="branchmanagerassignment",
            constraint=models.UniqueConstraint(fields=("user", "branch"), name="unique_branch_manager_branch_assignment"),
        ),
        migrations.AddConstraint(
            model_name="branchmanagerassignment",
            constraint=models.UniqueConstraint(condition=models.Q(("is_active", True)), fields=("user",), name="unique_active_branch_manager_assignment"),
        ),
    ]
