from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import RegisterSerializer


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

class ProfileView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request):

        user = request.user


        return Response(
            {
                "username": user.username,
                "email": user.email,
            }
        )
