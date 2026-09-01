from django.contrib import admin
from django.urls import include, path


urlpatterns = [

    # Django administration
    path(
        'admin/',
        admin.site.urls,
    ),


    # Khabo-Koi REST API
    path(
        'api/',
        include('restaurants.urls'),
    ),
    
    path('api/accounts/', 
         include('accounts.urls')),

]