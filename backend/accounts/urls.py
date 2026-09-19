from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    PlatformAdminUserListView,
    ProfileView,
    RegisterView,
)


urlpatterns = [

    # Public account registration.
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    # JWT authentication and access-token renewal.
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Identity, product role and restaurant assignments for the currently
    # authenticated user.
    path(
        "profile/",
        ProfileView.as_view(),
        name="profile",
    ),

    # Platform Admin-only account overview.
    path(
        "admin/users/",
        PlatformAdminUserListView.as_view(),
        name="platform_admin_user_list",
    ),

]
