from django.contrib import admin

from .models import (
    Restaurant,
    Branch,
    FoodItem,
    RestaurantTable,
    Booking,
)


admin.site.register(Restaurant)
admin.site.register(Branch)
admin.site.register(FoodItem)
admin.site.register(RestaurantTable)
admin.site.register(Booking)