from django.urls import path

from .views import (
    RestaurantListAPIView,
    RestaurantDetailAPIView,
    FoodItemListAPIView,
    TableAvailabilityAPIView,
    BookingCreateAPIView,
    MyBookingsAPIView,
    ManagerRestaurantAPIView,
    ManagerBranchListCreateAPIView,
    ManagerBranchDetailAPIView,
    ManagerMenuListCreateAPIView,
    ManagerMenuDetailAPIView,
    ManagerTableListCreateAPIView,
    ManagerTableDetailAPIView,
    ManagerReservationListAPIView,
    ManagerReservationDetailAPIView,
    ManagerDashboardAPIView,
)


urlpatterns = [

    path(
        'restaurants/',
        RestaurantListAPIView.as_view(),
        name='restaurant-list',
    ),


    path(
        'restaurants/<int:pk>/',
        RestaurantDetailAPIView.as_view(),
        name='restaurant-detail',
    ),


    path(
        'foods/',
        FoodItemListAPIView.as_view(),
        name='food-list',
    ),


    # Check which tables are actually free.
    path(
        'availability/',
        TableAvailabilityAPIView.as_view(),
        name='table-availability',
    ),


    # Create a real reservation.
    path(
        'bookings/',
        BookingCreateAPIView.as_view(),
        name='booking-create',
    ),
    
    path(
    'my-bookings/',
    MyBookingsAPIView.as_view(),
    name='my-bookings',
    ),

    path(
        'manager/restaurant/',
        ManagerRestaurantAPIView.as_view(),
        name='manager-restaurant',
    ),

    path(
        'manager/branches/',
        ManagerBranchListCreateAPIView.as_view(),
        name='manager-branch-list-create',
    ),

    path(
        'manager/branches/<int:pk>/',
        ManagerBranchDetailAPIView.as_view(),
        name='manager-branch-detail',
    ),

    path(
        'manager/menu/',
        ManagerMenuListCreateAPIView.as_view(),
        name='manager-menu-list-create',
    ),

    path(
        'manager/menu/<int:pk>/',
        ManagerMenuDetailAPIView.as_view(),
        name='manager-menu-detail',
    ),

    path(
        'manager/tables/',
        ManagerTableListCreateAPIView.as_view(),
        name='manager-table-list-create',
    ),

    path(
        'manager/tables/<int:pk>/',
        ManagerTableDetailAPIView.as_view(),
        name='manager-table-detail',
    ),

    path(
        'manager/reservations/',
        ManagerReservationListAPIView.as_view(),
        name='manager-reservation-list',
    ),

    path(
        'manager/reservations/<int:pk>/',
        ManagerReservationDetailAPIView.as_view(),
        name='manager-reservation-detail',
    ),

    path(
            'manager/dashboard/',
        ManagerDashboardAPIView.as_view(),
        name='manager-dashboard',
    ),

]