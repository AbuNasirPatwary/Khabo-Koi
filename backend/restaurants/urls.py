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
    ManagerReservationStatusAPIView,
    PlatformAdminRestaurantListAPIView,
    PlatformAdminRestaurantStatusAPIView,
    PlatformAdminBookingListAPIView,
    BranchManagerContextAPIView,
    BranchManagerDashboardAPIView,
    BranchManagerReservationListAPIView,
    BranchManagerReservationStatusAPIView,
    BranchManagerTableListCreateAPIView,
    BranchManagerTableDetailAPIView,
    BranchManagerMenuAvailabilityAPIView,
    FoodPreorderCreateUpdateAPIView,
    BranchManagerPreorderListAPIView,
    BranchManagerPreorderStatusAPIView,
    BranchManagerNotificationsAPIView,
    PlatformAdminOperationalHistoryAPIView,
    ManagerOperationalHistoryAPIView,
    BranchManagerOperationalHistoryAPIView,
)


urlpatterns = [

    # Platform Admin oversight includes inactive restaurants and is protected
    # independently from the public customer-facing restaurant catalogue.
    path(
        'admin/restaurants/',
        PlatformAdminRestaurantListAPIView.as_view(),
        name='platform-admin-restaurant-list',
    ),

    path(
        'admin/restaurants/<int:pk>/status/',
        PlatformAdminRestaurantStatusAPIView.as_view(),
        name='platform-admin-restaurant-status',
    ),

    path(
        'admin/bookings/',
        PlatformAdminBookingListAPIView.as_view(),
        name='platform-admin-booking-list',
    ),

    path(
        'admin/operations/history/',
        PlatformAdminOperationalHistoryAPIView.as_view(),
        name='platform-admin-operational-history',
    ),

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

    path(
        'manager/reservations/<int:pk>/status/',
        ManagerReservationStatusAPIView.as_view(),
        name='manager-reservation-status',
    ),

    path(
        'manager/operations/history/',
        ManagerOperationalHistoryAPIView.as_view(),
        name='manager-operational-history',
    ),

    path(
        'bookings/<int:booking_id>/preorder/',
        FoodPreorderCreateUpdateAPIView.as_view(),
        name='food-preorder-create-update',
    ),

    path(
        'branch-manager/context/',
        BranchManagerContextAPIView.as_view(),
        name='branch-manager-context',
    ),

    path(
        'branch-manager/dashboard/',
        BranchManagerDashboardAPIView.as_view(),
        name='branch-manager-dashboard',
    ),

    path(
        'branch-manager/reservations/',
        BranchManagerReservationListAPIView.as_view(),
        name='branch-manager-reservations',
    ),

    path(
        'branch-manager/reservations/<int:pk>/status/',
        BranchManagerReservationStatusAPIView.as_view(),
        name='branch-manager-reservation-status',
    ),

    path(
        'branch-manager/tables/',
        BranchManagerTableListCreateAPIView.as_view(),
        name='branch-manager-tables',
    ),

    path(
        'branch-manager/tables/<int:pk>/',
        BranchManagerTableDetailAPIView.as_view(),
        name='branch-manager-table-detail',
    ),

    path(
        'branch-manager/menu/',
        BranchManagerMenuAvailabilityAPIView.as_view(),
        name='branch-manager-menu',
    ),

    path(
        'branch-manager/preorders/',
        BranchManagerPreorderListAPIView.as_view(),
        name='branch-manager-preorders',
    ),

    path(
        'branch-manager/preorders/<int:pk>/status/',
        BranchManagerPreorderStatusAPIView.as_view(),
        name='branch-manager-preorder-status',
    ),

    path(
        'branch-manager/notifications/',
        BranchManagerNotificationsAPIView.as_view(),
        name='branch-manager-notifications',
    ),

    path(
        'branch-manager/operations/history/',
        BranchManagerOperationalHistoryAPIView.as_view(),
        name='branch-manager-operational-history',
    ),

]
