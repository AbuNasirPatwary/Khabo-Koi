from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .permissions import IsPlatformAdmin
from .serializers import (
    PlatformAdminRoleUpdateSerializer,
    PlatformAdminUserSerializer,
    ProfileSerializer,
    RegisterSerializer,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully.",
                    "username": user.username,
                    "email": user.email,
                },
                status=status.HTTP_201_CREATED,
            )


        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

# =============================================================================
# AUTHENTICATED PROFILE
# =============================================================================
# GET /api/accounts/profile/
#
# JWT authentication identifies request.user. ProfileSerializer then exposes
# the safe identity, role and assignment information needed by React.
# =============================================================================

class ProfileView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        serializer = ProfileSerializer(
            request.user,
        )

        return Response(
            serializer.data
        )


# =============================================================================
# PLATFORM ADMIN USER LIST
# =============================================================================
# GET /api/accounts/admin/users/
#
# This endpoint gives Platform Admins a safe, read-only overview of user
# accounts. Role modification will be implemented separately so reading data
# and changing authorization remain independently testable operations.
# =============================================================================

class PlatformAdminUserListView(generics.ListAPIView):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    serializer_class = (
        PlatformAdminUserSerializer
    )

    def get_queryset(self):

        # select_related loads each UserProfile in the same database query,
        # avoiding one additional query for every user in the Admin table.
        #
        # Inactive users remain visible because Platform Admins need to inspect
        # suspended accounts as well as active ones.
        return (
            User.objects
            .select_related(
                "profile",
            )
            .order_by(
                "username",
            )
        )


# =============================================================================
# PLATFORM ADMIN ROLE UPDATE
# =============================================================================
# PATCH /api/accounts/admin/users/<user_id>/role/
#
# The URL identifies a Django User, while the endpoint updates that user's
# related UserProfile because Khabo-Koi roles live on the profile model.
# =============================================================================

class PlatformAdminRoleUpdateView(generics.UpdateAPIView):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    serializer_class = (
        PlatformAdminRoleUpdateSerializer
    )

    # This endpoint supports partial updates only. A role change should be an
    # explicit PATCH operation rather than replacing the entire profile.
    http_method_names = [
        "patch",
        "options",
    ]

    queryset = (
        UserProfile.objects
        .select_related(
            "user",
        )
    )

    lookup_field = "user_id"
    lookup_url_kwarg = "user_id"
