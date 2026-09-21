
from datetime import datetime, timedelta
from datetime import date

from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_date, parse_time

from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    IsRestaurantManager,
    HasActiveRestaurantAssignment,
    get_managed_restaurant_ids,
)

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
    ManagerRestaurantSerializer,
    ManagerBranchSerializer,
    ManagerFoodItemSerializer,
    ManagerRestaurantTableSerializer,
    ManagerReservationSerializer,
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
    
    permission_classes = [IsAuthenticated]

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
                user=request.user,
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

class MyBookingsAPIView(ListAPIView):

    serializer_class = BookingSerializer

    permission_classes = [IsAuthenticated]


    def get_queryset(self):

        return Booking.objects.filter(
            user=self.request.user
        ).order_by(
            '-created_at'
        )

# =============================================================================
# MANAGER RESTAURANT DETAILS
# =============================================================================
# GET /api/manager/restaurant/
#
# Returns only restaurants actively assigned to the authenticated
# Restaurant Manager.
# =============================================================================

class ManagerRestaurantAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        restaurants = Restaurant.objects.filter(
            id__in=restaurant_ids,
        ).order_by(
            'name'
        )

        serializer = ManagerRestaurantSerializer(
            restaurants,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    def patch(self, request):

        restaurant_ids = list(
            get_managed_restaurant_ids(
                request.user
            )
        )

        requested_restaurant_id = request.data.get(
            'restaurant_id'
        )

        # If the Manager has multiple restaurants, require them
        # to identify which assigned restaurant they want to edit.
        if requested_restaurant_id is None:

            if len(restaurant_ids) != 1:

                return Response(
                    {
                        'error':
                            'restaurant_id is required when managing multiple restaurants.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            restaurant_id = restaurant_ids[0]

        else:

            try:
                restaurant_id = int(
                    requested_restaurant_id
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        'error':
                            'restaurant_id must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


        # Only allow access to an actively assigned restaurant.
        try:

            restaurant = Restaurant.objects.get(
                id=restaurant_id,
                id__in=restaurant_ids,
            )

        except Restaurant.DoesNotExist:

            return Response(
                {
                    'error':
                        'Restaurant not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        # Manager may edit only approved profile fields.
        allowed_fields = {
            'name',
            'cuisine',
            'description',
            'image_url',
        }

        update_data = {
            key: value
            for key, value in request.data.items()
            if key in allowed_fields
        }


        serializer = ManagerRestaurantSerializer(
            restaurant,
            data=update_data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()


        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

# =============================================================================
# MANAGER BRANCH LIST + CREATE
# =============================================================================
# GET  /api/manager/branches/
# POST /api/manager/branches/
#
# Managers may only view and create branches for restaurants to which they
# have an active assignment.
# =============================================================================

class ManagerBranchListCreateAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        branches = (
            Branch.objects
            .filter(
                restaurant_id__in=restaurant_ids,
            )
            .select_related(
                'restaurant',
            )
            .order_by(
                'restaurant__name',
                'name',
            )
        )

        serializer = ManagerBranchSerializer(
            branches,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def post(self, request):

        restaurant_ids = list(
            get_managed_restaurant_ids(
                request.user
            )
        )

        requested_restaurant_id = request.data.get(
            'restaurant_id'
        )

        # If the Manager controls only one restaurant,
        # the backend can safely select it automatically.
        if requested_restaurant_id is None:

            if len(restaurant_ids) != 1:

                return Response(
                    {
                        'error':
                            'restaurant_id is required when managing multiple restaurants.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            restaurant_id = restaurant_ids[0]

        else:

            try:

                restaurant_id = int(
                    requested_restaurant_id
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        'error':
                            'restaurant_id must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


        # Never allow the browser to choose an unassigned restaurant.
        if restaurant_id not in restaurant_ids:

            return Response(
                {
                    'error':
                        'Restaurant not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        restaurant = Restaurant.objects.get(
            id=restaurant_id
        )


        serializer = ManagerBranchSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        branch = serializer.save(
            restaurant=restaurant
        )


        return Response(
            ManagerBranchSerializer(branch).data,
            status=status.HTTP_201_CREATED,
        )

    # =============================================================================
# MANAGER BRANCH DETAIL + UPDATE + DEACTIVATE
# =============================================================================
# GET    /api/manager/branches/<id>/
# PATCH  /api/manager/branches/<id>/
# DELETE /api/manager/branches/<id>/
#
# DELETE performs a soft deactivation by setting is_active=False.
# =============================================================================

class ManagerBranchDetailAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get_branch(self, request, pk):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        try:

            return Branch.objects.select_related(
                'restaurant'
            ).get(
                id=pk,
                restaurant_id__in=restaurant_ids,
            )

        except Branch.DoesNotExist:

            return None


    def get(self, request, pk):

        branch = self.get_branch(
            request,
            pk,
        )

        if branch is None:

            return Response(
                {
                    'error': 'Branch not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerBranchSerializer(
            branch
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def patch(self, request, pk):

        branch = self.get_branch(
            request,
            pk,
        )

        if branch is None:

            return Response(
                {
                    'error': 'Branch not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerBranchSerializer(
            branch,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def delete(self, request, pk):

        branch = self.get_branch(
            request,
            pk,
        )

        if branch is None:

            return Response(
                {
                    'error': 'Branch not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        branch.is_active = False
        branch.save(
            update_fields=[
                'is_active',
            ]
        )

        return Response(
            {
                'message': 'Branch deactivated successfully.'
            },
            status=status.HTTP_200_OK,
        )

# =============================================================================
# MANAGER MENU LIST + CREATE
# =============================================================================
# GET  /api/manager/menu/
# POST /api/manager/menu/
#
# Managers may only view and create menu items for restaurants to which they
# have an active assignment.
# =============================================================================

class ManagerMenuListCreateAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        items = (
            FoodItem.objects
            .filter(
                restaurant_id__in=restaurant_ids,
            )
            .select_related(
                'restaurant',
            )
            .order_by(
                'restaurant__name',
                'name',
            )
        )

        serializer = ManagerFoodItemSerializer(
            items,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def post(self, request):

        restaurant_ids = list(
            get_managed_restaurant_ids(
                request.user
            )
        )

        requested_restaurant_id = request.data.get(
            'restaurant_id'
        )

        if requested_restaurant_id is None:

            if len(restaurant_ids) != 1:

                return Response(
                    {
                        'error':
                            'restaurant_id is required when managing multiple restaurants.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            restaurant_id = restaurant_ids[0]

        else:

            try:

                restaurant_id = int(
                    requested_restaurant_id
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        'error':
                            'restaurant_id must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


        if restaurant_id not in restaurant_ids:

            return Response(
                {
                    'error':
                        'Restaurant not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        restaurant = Restaurant.objects.get(
            id=restaurant_id
        )


        serializer = ManagerFoodItemSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        item = serializer.save(
            restaurant=restaurant
        )


        return Response(
            ManagerFoodItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )

# =============================================================================
# MANAGER MENU DETAIL + UPDATE + DEACTIVATE
# =============================================================================
# GET    /api/manager/menu/<id>/
# PATCH  /api/manager/menu/<id>/
# DELETE /api/manager/menu/<id>/
#
# DELETE performs a soft deactivation by setting is_available=False.
# =============================================================================

class ManagerMenuDetailAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get_item(self, request, pk):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        try:

            return FoodItem.objects.select_related(
                'restaurant'
            ).get(
                id=pk,
                restaurant_id__in=restaurant_ids,
            )

        except FoodItem.DoesNotExist:

            return None


    def get(self, request, pk):

        item = self.get_item(
            request,
            pk,
        )

        if item is None:

            return Response(
                {
                    'error': 'Menu item not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerFoodItemSerializer(
            item
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def patch(self, request, pk):

        item = self.get_item(
            request,
            pk,
        )

        if item is None:

            return Response(
                {
                    'error': 'Menu item not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerFoodItemSerializer(
            item,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def delete(self, request, pk):

        item = self.get_item(
            request,
            pk,
        )

        if item is None:

            return Response(
                {
                    'error': 'Menu item not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        item.is_available = False
        item.save(
            update_fields=[
                'is_available',
            ]
        )

        return Response(
            {
                'message':
                    'Menu item deactivated successfully.'
            },
            status=status.HTTP_200_OK,
        )

# =============================================================================
# MANAGER TABLE LIST + CREATE
# =============================================================================
# GET  /api/manager/tables/
# POST /api/manager/tables/
#
# A table may only belong to a branch whose restaurant is actively assigned
# to the authenticated Restaurant Manager.
# =============================================================================

class ManagerTableListCreateAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        tables = (
            RestaurantTable.objects
            .filter(
                branch__restaurant_id__in=restaurant_ids,
            )
            .select_related(
                'branch',
                'branch__restaurant',
            )
            .order_by(
                'branch__restaurant__name',
                'branch__name',
                'table_number',
            )
        )

        serializer = ManagerRestaurantTableSerializer(
            tables,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def post(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        branch_id = request.data.get(
            'branch_id'
        )

        if not branch_id:

            return Response(
                {
                    'error': 'branch_id is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            branch_id = int(
                branch_id
            )

        except (TypeError, ValueError):

            return Response(
                {
                    'error':
                        'branch_id must be a valid number.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        try:

            branch = Branch.objects.get(
                id=branch_id,
                restaurant_id__in=restaurant_ids,
            )

        except Branch.DoesNotExist:

            return Response(
                {
                    'error': 'Branch not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        table_number = request.data.get(
            'table_number'
        )

        if (
            table_number
            and RestaurantTable.objects.filter(
                branch=branch,
                table_number=table_number,
            ).exists()
        ):

            return Response(
                {
                    'error':
                        'Table number already exists in this branch.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        table_data = request.data.copy()

        table_data.pop(
            'branch_id',
            None,
        )


        serializer = ManagerRestaurantTableSerializer(
            data=table_data
        )

        serializer.is_valid(
            raise_exception=True
        )

        table = serializer.save(
            branch=branch
        )


        return Response(
            ManagerRestaurantTableSerializer(table).data,
            status=status.HTTP_201_CREATED,
        )

# =============================================================================
# MANAGER TABLE DETAIL + UPDATE + DEACTIVATE
# =============================================================================
# GET    /api/manager/tables/<id>/
# PATCH  /api/manager/tables/<id>/
# DELETE /api/manager/tables/<id>/
#
# DELETE performs a soft deactivation by setting is_active=False.
# =============================================================================

class ManagerTableDetailAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get_table(self, request, pk):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        try:
            return (
                RestaurantTable.objects
                .select_related(
                    'branch',
                    'branch__restaurant',
                )
                .get(
                    id=pk,
                    branch__restaurant_id__in=restaurant_ids,
                )
            )

        except RestaurantTable.DoesNotExist:
            return None


    def get(self, request, pk):

        table = self.get_table(
            request,
            pk,
        )

        if table is None:
            return Response(
                {
                    'error': 'Table not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerRestaurantTableSerializer(
            table
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def patch(self, request, pk):

        table = self.get_table(
            request,
            pk,
        )

        if table is None:
            return Response(
                {
                    'error': 'Table not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_table_number = request.data.get(
            'table_number'
        )

        if (
            new_table_number
            and RestaurantTable.objects.filter(
                branch=table.branch,
                table_number=new_table_number,
            )
            .exclude(
                id=table.id
            )
            .exists()
        ):
            return Response(
                {
                    'error':
                        'Table number already exists in this branch.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        table_data = request.data.copy()

        # Branch cannot be changed through PATCH.
        table_data.pop(
            'branch_id',
            None,
        )

        serializer = ManagerRestaurantTableSerializer(
            table,
            data=table_data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    def delete(self, request, pk):

        table = self.get_table(
            request,
            pk,
        )

        if table is None:
            return Response(
                {
                    'error': 'Table not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        table.is_active = False

        table.save(
            update_fields=[
                'is_active',
            ]
        )

        return Response(
            {
                'message':
                    'Table deactivated successfully.'
            },
            status=status.HTTP_200_OK,
        )
    # =============================================================================
# MANAGER RESERVATION LIST
# =============================================================================
# GET /api/manager/reservations/
#
# Optional filters:
#   ?status=CONFIRMED
#   ?date=2026-09-21
#   ?branch=1
#   ?table=3
#   ?search=Rakibul
#   ?scope=today
#   ?scope=upcoming
#   ?scope=history
# =============================================================================

class ManagerReservationListAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        bookings = (
            Booking.objects
            .filter(
                branch__restaurant_id__in=restaurant_ids,
            )
            .select_related(
                'user',
                'branch',
                'branch__restaurant',
                'table',
            )
        )

        # -------------------------------------------------------------
        # Status filter
        # -------------------------------------------------------------
        reservation_status = request.query_params.get(
            'status'
        )

        if reservation_status:

            valid_statuses = [
                choice[0]
                for choice in Booking._meta.get_field('status').choices
                ]
            if reservation_status not in valid_statuses:

                return Response(
                    {
                        'error': 'Invalid reservation status.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bookings = bookings.filter(
                status=reservation_status
            )

        # -------------------------------------------------------------
        # Exact date filter
        # -------------------------------------------------------------
        reservation_date = request.query_params.get(
            'date'
        )

        if reservation_date:

            try:
                parsed_date = date.fromisoformat(
                    reservation_date
                )

            except ValueError:

                return Response(
                    {
                        'error':
                            'date must use YYYY-MM-DD format.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bookings = bookings.filter(
                reservation_date=parsed_date
            )

        # -------------------------------------------------------------
        # Branch filter
        # -------------------------------------------------------------
        branch_id = request.query_params.get(
            'branch'
        )

        if branch_id:

            try:
                branch_id = int(
                    branch_id
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        'error': 'branch must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bookings = bookings.filter(
                branch_id=branch_id
            )

        # -------------------------------------------------------------
        # Table filter
        # -------------------------------------------------------------
        table_id = request.query_params.get(
            'table'
        )

        if table_id:

            try:
                table_id = int(
                    table_id
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        'error': 'table must be a valid number.'
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bookings = bookings.filter(
                table_id=table_id
            )

        # -------------------------------------------------------------
        # Customer search
        # -------------------------------------------------------------
        search = request.query_params.get(
            'search'
        )

        if search:

            bookings = bookings.filter(
                Q(
                    customer_name__icontains=search
                )
                |
                Q(
                    customer_phone__icontains=search
                )
            )

        # -------------------------------------------------------------
        # Today / upcoming / history
        # -------------------------------------------------------------
        scope = request.query_params.get(
            'scope'
        )

        today = date.today()

        if scope == 'today':

            bookings = bookings.filter(
                reservation_date=today
            )

        elif scope == 'upcoming':

            bookings = bookings.filter(
                reservation_date__gte=today
            )

        elif scope == 'history':

            bookings = bookings.filter(
                reservation_date__lt=today
            )

        elif scope:

            return Response(
                {
                    'error':
                        'scope must be today, upcoming, or history.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        bookings = bookings.order_by(
            '-reservation_date',
            '-start_time',
        )

        serializer = ManagerReservationSerializer(
            bookings,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # =============================================================================
# MANAGER RESERVATION DETAIL
# =============================================================================
# GET /api/manager/reservations/<id>/
#
# A Manager may only view reservations that belong to restaurants
# they are actively assigned to.
# =============================================================================

class ManagerReservationDetailAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get_booking(self, request, pk):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        try:
            return (
                Booking.objects
                .select_related(
                    'user',
                    'branch',
                    'branch__restaurant',
                    'table',
                )
                .get(
                    id=pk,
                    branch__restaurant_id__in=restaurant_ids,
                )
            )

        except Booking.DoesNotExist:
            return None


    def get(self, request, pk):

        booking = self.get_booking(
            request,
            pk,
        )

        if booking is None:

            return Response(
                {
                    'error': 'Reservation not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ManagerReservationSerializer(
            booking
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# =============================================================================
# MANAGER RESERVATION STATUS UPDATE
# =============================================================================
# PATCH /api/manager/reservations/<id>/status/
#
# Allowed transitions:
# PENDING   -> CONFIRMED, CANCELLED
# CONFIRMED -> COMPLETED, CANCELLED
# CANCELLED -> no new status
# COMPLETED -> no new status
#
# Updating to the current status is allowed as an idempotent no-op.
# =============================================================================

class ManagerReservationStatusAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    ALLOWED_TRANSITIONS = {
        'PENDING': {
            'PENDING',
            'CONFIRMED',
            'CANCELLED',
        },
        'CONFIRMED': {
            'CONFIRMED',
            'COMPLETED',
            'CANCELLED',
        },
        'CANCELLED': {
            'CANCELLED',
        },
        'COMPLETED': {
            'COMPLETED',
        },
    }

    def get_booking(self, request, pk):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        try:
            return (
                Booking.objects
                .select_related(
                    'user',
                    'branch',
                    'branch__restaurant',
                    'table',
                )
                .get(
                    id=pk,
                    branch__restaurant_id__in=restaurant_ids,
                )
            )

        except Booking.DoesNotExist:
            return None


    def patch(self, request, pk):

        booking = self.get_booking(
            request,
            pk,
        )

        if booking is None:

            return Response(
                {
                    'error': 'Reservation not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get(
            'status'
        )

        if new_status is None:

            return Response(
                {
                    'error': 'status is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_statuses = [
            choice[0]
            for choice in Booking._meta.get_field(
                'status'
            ).choices
        ]

        if new_status not in valid_statuses:

            return Response(
                {
                    'error': 'Invalid reservation status.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_statuses = self.ALLOWED_TRANSITIONS.get(
            booking.status,
            set(),
        )

        if new_status not in allowed_statuses:

            return Response(
                {
                    'error':
                        f'Cannot change reservation status '
                        f'from {booking.status} to {new_status}.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Idempotent no-op is allowed.
        if booking.status != new_status:

            booking.status = new_status

            booking.save(
                update_fields=[
                    'status',
                ]
            )

        serializer = ManagerReservationSerializer(
            booking
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # =============================================================================
# MANAGER DASHBOARD
# =============================================================================
# GET /api/manager/dashboard/
#
# Returns summary counts only for restaurants actively assigned
# to the authenticated Restaurant Manager.
# =============================================================================

class ManagerDashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsRestaurantManager,
        HasActiveRestaurantAssignment,
    ]

    def get(self, request):

        restaurant_ids = get_managed_restaurant_ids(
            request.user
        )

        today = date.today()

        reservations = Booking.objects.filter(
            branch__restaurant_id__in=restaurant_ids,
        )

        branches = Branch.objects.filter(
            restaurant_id__in=restaurant_ids,
        )

        tables = RestaurantTable.objects.filter(
            branch__restaurant_id__in=restaurant_ids,
        )

        menu_items = FoodItem.objects.filter(
            restaurant_id__in=restaurant_ids,
        )

        data = {
            'restaurants': restaurant_ids.count(),

            'reservations': {
                'total': reservations.count(),
                'today': reservations.filter(
                    reservation_date=today,
                ).count(),
                'upcoming': reservations.filter(
                    reservation_date__gt=today,
                ).count(),
                'pending': reservations.filter(
                    status='PENDING',
                ).count(),
            },

            'branches': {
                'total': branches.count(),
                'active': branches.filter(
                    is_active=True,
                ).count(),
            },

            'tables': {
                'total': tables.count(),
                'active': tables.filter(
                    is_active=True,
                ).count(),
            },

            'menu_items': {
                'total': menu_items.count(),
                'available': menu_items.filter(
                    is_available=True,
                ).count(),
            },
        }

        return Response(
            data,
            status=status.HTTP_200_OK,
        )