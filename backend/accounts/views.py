from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import (
    ProfileSerializer,
    RegisterSerializer,
)

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
