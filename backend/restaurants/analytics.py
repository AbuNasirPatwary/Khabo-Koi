"""Reusable, role-scoped dashboard analytics.

The views decide which restaurants or branches a user may access.  This
module only calculates statistics from those already-scoped querysets, which
keeps the permission boundary easy to audit and prevents accidental leakage.
"""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date

from .models import Booking, FoodPreorder, FoodPreorderItem


class AnalyticsPeriodError(ValueError):
    """Raised when dashboard date-filter query parameters are invalid."""


def parse_analytics_period(query_params):
    """Return a validated inclusive date range for dashboard calculations."""

    today = timezone.localdate()
    selected_range = query_params.get("range", "30d")
    preset_days = {"today": 1, "7d": 7, "30d": 30, "90d": 90}

    if selected_range in preset_days:
        end_date = today
        start_date = today - timedelta(days=preset_days[selected_range] - 1)
    elif selected_range == "custom":
        raw_start = query_params.get("date_from")
        raw_end = query_params.get("date_to")
        start_date = parse_date(raw_start or "")
        end_date = parse_date(raw_end or "")
        if not start_date or not end_date:
            raise AnalyticsPeriodError(
                "Custom range requires valid date_from and date_to values "
                "in YYYY-MM-DD format."
            )
        if start_date > end_date:
            raise AnalyticsPeriodError(
                "date_from cannot be later than date_to."
            )
    else:
        raise AnalyticsPeriodError(
            "range must be one of: today, 7d, 30d, 90d, custom."
        )

    return {
        "range": selected_range,
        "date_from": start_date,
        "date_to": end_date,
    }


def _money(value):
    """Use fixed-point strings so JSON never introduces float rounding."""

    return format(Decimal(value or 0).quantize(Decimal("0.01")), "f")


def _rate(part, whole):
    if not whole:
        return 0.0
    return round((part / whole) * 100, 2)


def _choice_counts(queryset, field_name, choices):
    grouped = {
        row[field_name]: row["total"]
        for row in queryset.values(field_name).annotate(total=Count("id"))
    }
    return {value: grouped.get(value, 0) for value, _label in choices}


def build_dashboard_analytics(
    *, query_params, bookings, preorders, branches
):
    """Build one consistent analytics payload from authorized querysets."""

    period = parse_analytics_period(query_params)
    start_date = period["date_from"]
    end_date = period["date_to"]

    bookings = bookings.filter(
        reservation_date__range=(start_date, end_date)
    )
    preorders = preorders.filter(
        booking__reservation_date__range=(start_date, end_date)
    )

    reservation_statuses = _choice_counts(
        bookings, "status", Booking.STATUS_CHOICES
    )
    reservation_summary = bookings.aggregate(
        total=Count("id"),
        guests=Coalesce(Sum("guest_count"), 0),
    )
    reservation_total = reservation_summary["total"]

    preorder_statuses = _choice_counts(
        preorders, "status", FoodPreorder.STATUS_CHOICES
    )
    payment_statuses = _choice_counts(
        preorders, "payment_status", FoodPreorder.PAYMENT_STATUS_CHOICES
    )

    # Cancelled orders are retained in status counts but never treated as sales.
    sale_preorders = preorders.exclude(status="CANCELLED")
    preorder_totals = sale_preorders.aggregate(
        total_value=Coalesce(
            Sum("total_amount"),
            Decimal("0.00"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
        paid_value=Coalesce(
            Sum("total_amount", filter=Q(payment_status="PAID")),
            Decimal("0.00"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
        advance_value=Coalesce(
            Sum(
                "advance_amount",
                filter=Q(payment_status="ADVANCE_PAID"),
            ),
            Decimal("0.00"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        ),
    )
    collected = preorder_totals["paid_value"] + preorder_totals["advance_value"]
    outstanding = preorder_totals["total_value"] - collected

    trend = _build_trend(bookings, sale_preorders, start_date, end_date)
    top_items = _build_top_items(sale_preorders)
    branch_performance = _build_branch_performance(
        branches, bookings, sale_preorders
    )

    return {
        "period": {
            "range": period["range"],
            "date_from": start_date.isoformat(),
            "date_to": end_date.isoformat(),
        },
        "reservations": {
            "total": reservation_total,
            "statuses": reservation_statuses,
            "guests": reservation_summary["guests"],
            "completion_rate": _rate(
                reservation_statuses["COMPLETED"], reservation_total
            ),
            "cancellation_rate": _rate(
                reservation_statuses["CANCELLED"], reservation_total
            ),
        },
        "preorders": {
            "total": preorders.count(),
            "statuses": preorder_statuses,
            "payment_statuses": payment_statuses,
            "total_value": _money(preorder_totals["total_value"]),
            "collected_amount": _money(collected),
            "outstanding_amount": _money(outstanding),
        },
        "trend": trend,
        "top_items": top_items,
        "branch_performance": branch_performance,
    }


def _build_trend(bookings, sale_preorders, start_date, end_date):
    """Return daily buckets for normal ranges and monthly buckets for long ones."""

    monthly = (end_date - start_date).days > 90
    if monthly:
        booking_rows = bookings.annotate(
            bucket=TruncMonth("reservation_date")
        ).values("bucket").annotate(
            reservations=Count("id"), guests=Coalesce(Sum("guest_count"), 0)
        )
        preorder_rows = sale_preorders.annotate(
            bucket=TruncMonth("booking__reservation_date")
        ).values("bucket").annotate(
            preorders=Count("id"), value=Coalesce(
                Sum("total_amount"),
                Decimal("0.00"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )
        label = lambda value: value.strftime("%Y-%m")
    else:
        booking_rows = bookings.values(bucket=F("reservation_date")).annotate(
            reservations=Count("id"), guests=Coalesce(Sum("guest_count"), 0)
        )
        preorder_rows = sale_preorders.values(
            bucket=F("booking__reservation_date")
        ).annotate(
            preorders=Count("id"), value=Coalesce(
                Sum("total_amount"),
                Decimal("0.00"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )
        label = lambda value: value.isoformat()

    buckets = {}
    for row in booking_rows:
        key = label(row["bucket"])
        buckets[key] = {
            "period": key,
            "reservations": row["reservations"],
            "guests": row["guests"],
            "preorders": 0,
            "preorder_value": "0.00",
        }
    for row in preorder_rows:
        key = label(row["bucket"])
        bucket = buckets.setdefault(key, {
            "period": key,
            "reservations": 0,
            "guests": 0,
            "preorders": 0,
            "preorder_value": "0.00",
        })
        bucket["preorders"] = row["preorders"]
        bucket["preorder_value"] = _money(row["value"])

    return [buckets[key] for key in sorted(buckets)]


def _build_top_items(sale_preorders):
    value_expression = ExpressionWrapper(
        F("quantity") * F("unit_price"),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )
    rows = (
        FoodPreorderItem.objects
        .filter(preorder__in=sale_preorders)
        .values("food_item_id", "food_item__name", "food_item__category")
        .annotate(total_quantity=Sum("quantity"), value=Sum(value_expression))
        .order_by("-total_quantity", "-value", "food_item__name")[:10]
    )
    return [
        {
            "food_item_id": row["food_item_id"],
            "name": row["food_item__name"],
            "category": row["food_item__category"],
            "quantity": row["total_quantity"],
            "value": _money(row["value"]),
        }
        for row in rows
    ]


def _build_branch_performance(branches, bookings, sale_preorders):
    booking_rows = {
        row["branch_id"]: row
        for row in bookings.values("branch_id").annotate(
            reservations=Count("id"),
            guests=Coalesce(Sum("guest_count"), 0),
            completed=Count("id", filter=Q(status="COMPLETED")),
            cancelled=Count("id", filter=Q(status="CANCELLED")),
        )
    }
    preorder_rows = {
        row["booking__branch_id"]: row
        for row in sale_preorders.values("booking__branch_id").annotate(
            preorders=Count("id"),
            preorder_value=Coalesce(
                Sum("total_amount"),
                Decimal("0.00"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            ),
        )
    }

    results = []
    for branch in branches.select_related("restaurant").order_by(
        "restaurant__name", "name"
    ):
        booking = booking_rows.get(branch.id, {})
        preorder = preorder_rows.get(branch.id, {})
        results.append({
            "branch_id": branch.id,
            "branch_name": branch.name,
            "restaurant_id": branch.restaurant_id,
            "restaurant_name": branch.restaurant.name,
            "reservations": booking.get("reservations", 0),
            "guests": booking.get("guests", 0),
            "completed": booking.get("completed", 0),
            "cancelled": booking.get("cancelled", 0),
            "preorders": preorder.get("preorders", 0),
            "preorder_value": _money(preorder.get("preorder_value", 0)),
        })
    return sorted(
        results,
        key=lambda row: (
            -Decimal(row["preorder_value"]),
            -row["completed"],
            row["branch_name"],
        ),
    )
