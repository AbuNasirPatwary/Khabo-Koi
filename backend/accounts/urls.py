from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    PlatformAdminAccountStatusView,
    PlatformAdminManagerAssignmentListCreateView,
    PlatformAdminManagerAssignmentStatusView,
    PlatformAdminRoleUpdateView,
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

    # Platform Admin-only product-role modification.
    path(
        "admin/users/<int:user_id>/role/",
        PlatformAdminRoleUpdateView.as_view(),
        name="platform_admin_role_update",
    ),

    # Platform Admin-only user suspension and reactivation.
    path(
        "admin/users/<int:user_id>/status/",
        PlatformAdminAccountStatusView.as_view(),
        name="platform_admin_account_status",
    ),

    # Platform Admin-only Manager assignment overview and creation.
    path(
        "admin/manager-assignments/",
        PlatformAdminManagerAssignmentListCreateView.as_view(),
        name="platform_admin_manager_assignment_list_create",
    ),

    # Platform Admin-only assignment activation and deactivation.
    path(
        "admin/manager-assignments/<int:assignment_id>/",
        PlatformAdminManagerAssignmentStatusView.as_view(),
        name="platform_admin_manager_assignment_status",
    ),

]
