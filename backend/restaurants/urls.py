from django.urls import path

from .views import (
    RestaurantListAPIView,
    RestaurantDetailAPIView,
    FoodItemListAPIView,
    TableAvailabilityAPIView,
    BookingCreateAPIView,
    MyBookingsAPIView,
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

]