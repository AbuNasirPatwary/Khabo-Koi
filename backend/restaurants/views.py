from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_date, parse_time

from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Restaurant,
    Branch,
    FoodItem,
    RestaurantTable,
    Booking,
)

from .serializers import (
    RestaurantSerializer,
    FoodItemSerializer,
    RestaurantTableSerializer,
    BookingSerializer,
)


# =============================================================================
# TEMPORARY RESERVATION DURATION
# =============================================================================
# For our current project version, each reservation uses a 90-minute slot.
#
# Example:
# Start: 8:00 PM
# End:   9:30 PM
#
# We can easily change this policy later.
# =============================================================================

DEFAULT_BOOKING_DURATION_MINUTES = 90


def calculate_end_time(start_time):

    start_datetime = datetime.combine(
        datetime.today(),
        start_time,
    )

    end_datetime = start_datetime + timedelta(
        minutes=DEFAULT_BOOKING_DURATION_MINUTES
    )

    return end_datetime.time()



# =============================================================================
# RESTAURANT LIST
# =============================================================================

class RestaurantListAPIView(ListAPIView):

    serializer_class = RestaurantSerializer


    def get_queryset(self):

        queryset = Restaurant.objects.filter(
            is_active=True
        )


        search = self.request.query_params.get(
            'search'
        )


        if search:

            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(cuisine__icontains=search) |
                Q(branches__name__icontains=search)
            ).distinct()


        return queryset



# =============================================================================
# RESTAURANT DETAILS
# =============================================================================

class RestaurantDetailAPIView(RetrieveAPIView):

    serializer_class = RestaurantSerializer

    queryset = Restaurant.objects.filter(
        is_active=True
    )



# =============================================================================
# FOOD LIST + SEARCH
# =============================================================================

class FoodItemListAPIView(ListAPIView):

    serializer_class = FoodItemSerializer


    def get_queryset(self):

        queryset = FoodItem.objects.filter(
            is_available=True,
            restaurant__is_active=True,
        )


        search = self.request.query_params.get(
            'search'
        )


        if search:

            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(category__icontains=search) |
                Q(restaurant__name__icontains=search) |
                Q(restaurant__branches__name__icontains=search)
            ).distinct()


        return queryset



# =============================================================================
# CHECK TABLE AVAILABILITY
# =============================================================================
#
# POST /api/availability/
#
# Example request:
#
# {
#     "branch_id": 1,
#     "reservation_date": "2026-09-02",
#     "start_time": "20:00",
#     "guest_count": 4,
#     "seating_type": "INDOOR"
# }
#
# seating_type may also be:
# ANY
# INDOOR
# OUTDOOR
# WINDOW
# =============================================================================

class TableAvailabilityAPIView(APIView):

    def post(self, request):

        branch_id = request.data.get(
            'branch_id'
        )

        reservation_date = parse_date(
            request.data.get(
                'reservation_date',
                ''
            )
        )

        start_time = parse_time(
            request.data.get(
                'start_time',
                ''
            )
        )

        guest_count = request.data.get(
            'guest_count'
        )

        seating_type = request.data.get(
            'seating_type',
            'ANY'
        )


        # ---------------------------------------------------------------------
        # BASIC VALIDATION
        # ---------------------------------------------------------------------

        if not branch_id:

            return Response(
                {
                    'error': 'Branch is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not reservation_date:

            return Response(
                {
                    'error': 'Valid reservation date is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not start_time:

            return Response(
                {
                    'error': 'Valid start time is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        try:

            guest_count = int(
                guest_count
            )

        except (TypeError, ValueError):

            return Response(
                {
                    'error': 'Guest count must be a number.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if guest_count < 1:

            return Response(
                {
                    'error': 'At least one guest is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )



        # ---------------------------------------------------------------------
        # FIND BRANCH
        # ---------------------------------------------------------------------

        try:

            branch = Branch.objects.get(
                id=branch_id,
                is_active=True,
            )

        except Branch.DoesNotExist:

            return Response(
                {
                    'error': 'Branch not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )



        end_time = calculate_end_time(
            start_time
        )



        # ---------------------------------------------------------------------
        # FIND TABLES THAT CAN FIT THE PARTY
        # ---------------------------------------------------------------------

        tables = RestaurantTable.objects.filter(
            branch=branch,
            is_active=True,
            capacity__gte=guest_count,
        )


        # Apply seating preference
        if seating_type != 'ANY':

            tables = tables.filter(
                seating_type=seating_type
            )



        available_tables = []


        # ---------------------------------------------------------------------
        # CHECK EACH TABLE AGAINST EXISTING BOOKINGS
        #
        # OVERLAP RULE:
        #
        # requested_start < existing_end
        # AND
        # requested_end > existing_start
        # ---------------------------------------------------------------------

        for table in tables:

            has_conflict = Booking.objects.filter(
                table=table,
                reservation_date=reservation_date,
                start_time__lt=end_time,
                end_time__gt=start_time,
                status__in=[
                    'PENDING',
                    'CONFIRMED',
                ],
            ).exists()


            if not has_conflict:

                available_tables.append(
                    table
                )



        serializer = RestaurantTableSerializer(
            available_tables,
            many=True,
        )


        return Response(
            {
                'restaurant': branch.restaurant.name,
                'branch_id': branch.id,
                'branch': branch.name,
                'reservation_date': reservation_date,
                'start_time': start_time,
                'end_time': end_time,
                'duration_minutes':
                    DEFAULT_BOOKING_DURATION_MINUTES,
                'guest_count': guest_count,
                'seating_type': seating_type,
                'available_tables': serializer.data,
            },
            status=status.HTTP_200_OK,
        )



# =============================================================================
# CREATE BOOKING
# =============================================================================
#
# POST /api/bookings/
#
# This checks availability AGAIN before saving.
#
# That second check is important because another customer could have booked
# the table after the availability search.
# =============================================================================

class BookingCreateAPIView(APIView):

    def post(self, request):

        branch_id = request.data.get(
            'branch_id'
        )

        table_id = request.data.get(
            'table_id'
        )

        reservation_date = parse_date(
            request.data.get(
                'reservation_date',
                ''
            )
        )

        start_time = parse_time(
            request.data.get(
                'start_time',
                ''
            )
        )

        guest_count = request.data.get(
            'guest_count'
        )

        customer_name = request.data.get(
            'customer_name',
            ''
        )

        customer_phone = request.data.get(
            'customer_phone',
            ''
        )


        # ---------------------------------------------------------------------
        # VALIDATION
        # ---------------------------------------------------------------------

        if not branch_id or not table_id:

            return Response(
                {
                    'error':
                        'Branch and table are required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not reservation_date or not start_time:

            return Response(
                {
                    'error':
                        'Valid date and time are required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        try:

            guest_count = int(
                guest_count
            )

        except (TypeError, ValueError):

            return Response(
                {
                    'error':
                        'Guest count must be a number.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if guest_count < 1:

            return Response(
                {
                    'error':
                        'At least one guest is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )



        end_time = calculate_end_time(
            start_time
        )



        # ---------------------------------------------------------------------
        # TRANSACTION
        # ---------------------------------------------------------------------
        # select_for_update locks the selected RestaurantTable row while
        # we perform the final availability check and create the booking.
        #
        # This helps prevent two customers from booking the same table
        # simultaneously.
        # ---------------------------------------------------------------------

        with transaction.atomic():

            try:

                table = (
                    RestaurantTable.objects
                    .select_for_update()
                    .select_related(
                        'branch',
                        'branch__restaurant',
                    )
                    .get(
                        id=table_id,
                        branch_id=branch_id,
                        is_active=True,
                    )
                )

            except RestaurantTable.DoesNotExist:

                return Response(
                    {
                        'error':
                            'Selected table was not found.'
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )



            # Table must actually fit the party
            if table.capacity < guest_count:

                return Response(
                    {
                        'error':
                            'Selected table is too small for this party.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )



            # Final double-booking check
            has_conflict = Booking.objects.filter(
                table=table,
                reservation_date=reservation_date,
                start_time__lt=end_time,
                end_time__gt=start_time,
                status__in=[
                    'PENDING',
                    'CONFIRMED',
                ],
            ).exists()


            if has_conflict:

                return Response(
                    {
                        'error':
                            'This table has just been booked. Please choose another table.'
                    },
                    status=status.HTTP_409_CONFLICT,
                )



            booking = Booking.objects.create(
                branch=table.branch,
                table=table,
                reservation_date=reservation_date,
                start_time=start_time,
                end_time=end_time,
                guest_count=guest_count,
                customer_name=customer_name,
                customer_phone=customer_phone,
                status='CONFIRMED',
            )



        serializer = BookingSerializer(
            booking
        )


        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )