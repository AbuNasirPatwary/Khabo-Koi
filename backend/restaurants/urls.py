from django.urls import path

from .views import (
    RestaurantListAPIView,
    RestaurantDetailAPIView,
    FoodItemListAPIView,
    TableAvailabilityAPIView,
    BookingCreateAPIView,
    MyBookingsAPIView,
    PlatformAdminRestaurantListAPIView,
    PlatformAdminRestaurantStatusAPIView,
    PlatformAdminBookingListAPIView,
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

]
