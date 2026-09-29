from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from restaurants.models import (
    Booking,
    Branch,
    FoodPreorder,
    Restaurant,
)
from restaurants.analytics import (
    AnalyticsPeriodError,
    build_dashboard_analytics,
)

from .models import (
    BranchManagerAssignment,
    RestaurantManagerAssignment,
    UserProfile,
)
from .permissions import IsPlatformAdmin
from .serializers import (
    EmailVerificationConfirmSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PlatformAdminAccountStatusSerializer,
    PlatformAdminBranchManagerAssignmentCreateSerializer,
    PlatformAdminBranchManagerAssignmentSerializer,
    PlatformAdminBranchManagerAssignmentStatusSerializer,
    PlatformAdminDashboardSerializer,
    PlatformAdminManagerAssignmentCreateSerializer,
    PlatformAdminManagerAssignmentSerializer,
    PlatformAdminManagerAssignmentStatusSerializer,
    PlatformAdminRoleUpdateSerializer,
    PlatformAdminUserSerializer,
    ProfileSerializer,
    RegisterSerializer,
)
from .tokens import email_verification_token


User = get_user_model()


def _decode_user(uid):
    """Resolve an opaque URL-safe user id without leaking decode errors."""

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        return User.objects.select_related("profile").get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


def _send_account_email(*, subject, message, recipient):
    """Use Django's configured mail backend for dev and deployment."""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
        fail_silently=False,
    )


class LoginView(TokenObtainPairView):
    """JWT login protected from repeated credential guessing."""

    throttle_scope = "auth_login"


class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    throttle_scope = "auth_register"

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


class PasswordResetRequestView(APIView):
    """Email reset links while returning the same result for every address."""

    authentication_classes = []
    permission_classes = []
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        users = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
        )

        for user in users:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.FRONTEND_URL}/reset-password"
                f"?uid={uid}&token={token}"
            )
            _send_account_email(
                subject="Reset your Khabo-Koi password",
                message=(
                    "Use this one-time link to choose a new password:\n\n"
                    f"{reset_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                recipient=user.email,
            )

        return Response({
            "message": (
                "If an active account uses that email, a reset link has "
                "been sent."
            )
        })


class PasswordResetConfirmView(APIView):
    """Validate a one-time token before replacing the stored password hash."""

    authentication_classes = []
    permission_classes = []
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _decode_user(serializer.validated_data["uid"])

        if (
            user is None
            or not user.is_active
            or not default_token_generator.check_token(
                user,
                serializer.validated_data["token"],
            )
        ):
            return Response(
                {"detail": "This password reset link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(
                serializer.validated_data["new_password"],
                user=user,
            )
        except DjangoValidationError as error:
            return Response(
                {"new_password": error.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"message": "Password updated successfully."})


class EmailVerificationRequestView(APIView):
    """Send a one-time verification link only for the signed-in account."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "email_verification"

    def post(self, request):
        user = request.user
        profile = user.profile

        if user.email and not profile.email_verified:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token.make_token(user)
            verification_url = (
                f"{settings.FRONTEND_URL}/verify-email"
                f"?uid={uid}&token={token}"
            )
            _send_account_email(
                subject="Verify your Khabo-Koi email",
                message=(
                    "Use this one-time link to verify your email address:\n\n"
                    f"{verification_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                recipient=user.email,
            )

        # This deliberately does not reveal whether the account has an email
        # or is already verified.
        return Response({
            "message": "If verification is needed, an email has been sent."
        })


class EmailVerificationConfirmView(APIView):
    """Mark the address verified after checking its one-time token."""

    authentication_classes = []
    permission_classes = []
    throttle_scope = "email_verification"

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _decode_user(serializer.validated_data["uid"])

        if (
            user is None
            or not user.is_active
            or not email_verification_token.check_token(
                user,
                serializer.validated_data["token"],
            )
        ):
            return Response(
                {"detail": "This verification link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = user.profile
        profile.email_verified = True
        profile.email_verified_at = timezone.now()
        profile.save(
            update_fields=[
                "email_verified",
                "email_verified_at",
                "updated_at",
            ]
        )

        return Response({"message": "Email verified successfully."})

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


# =============================================================================
# PLATFORM ADMIN MANAGER ASSIGNMENT LIST AND CREATE
# =============================================================================
# GET  /api/accounts/admin/manager-assignments/
# POST /api/accounts/admin/manager-assignments/
#
# GET returns the complete assignment history, including inactive records.
# POST creates a new relationship between a Restaurant Manager and restaurant.
# =============================================================================

class PlatformAdminManagerAssignmentListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    def get_queryset(self):

        return (
            RestaurantManagerAssignment.objects
            .select_related(
                "user",
                "user__profile",
                "restaurant",
                "assigned_by",
            )
            .order_by(
                "-assigned_at",
            )
        )

    def get_serializer_class(self):

        if self.request.method == "POST":
            return (
                PlatformAdminManagerAssignmentCreateSerializer
            )

        return PlatformAdminManagerAssignmentSerializer


# =============================================================================
# PLATFORM ADMIN MANAGER ASSIGNMENT STATUS
# =============================================================================
# PATCH /api/accounts/admin/manager-assignments/<assignment_id>/
#
# Assignments are activated or deactivated instead of deleted. This preserves
# their history and prevents accidental destructive operations.
# =============================================================================

class PlatformAdminManagerAssignmentStatusView(
    generics.UpdateAPIView
):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    serializer_class = (
        PlatformAdminManagerAssignmentStatusSerializer
    )

    http_method_names = [
        "patch",
        "options",
    ]

    queryset = (
        RestaurantManagerAssignment.objects
        .select_related(
            "user",
            "user__profile",
            "restaurant",
        )
    )

    lookup_field = "id"
    lookup_url_kwarg = "assignment_id"


# =============================================================================
# PLATFORM ADMIN ACCOUNT STATUS UPDATE
# =============================================================================
# PATCH /api/accounts/admin/users/<user_id>/status/
#
# This endpoint suspends or reactivates a Django user account. Suspension also
# deactivates restaurant assignments through the serializer's atomic update.
# =============================================================================

class PlatformAdminAccountStatusView(
    generics.UpdateAPIView
):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    serializer_class = (
        PlatformAdminAccountStatusSerializer
    )

    http_method_names = [
        "patch",
        "options",
    ]

    queryset = (
        User.objects
        .select_related(
            "profile",
        )
    )

    lookup_field = "id"
    lookup_url_kwarg = "user_id"


# =============================================================================
# PLATFORM ADMIN DASHBOARD SUMMARY
# =============================================================================
# GET /api/accounts/admin/dashboard/
#
# Existing summary cards remain stable for current clients. The additive
# analytics payload uses persisted bookings and food preorders, while clearly
# treating the current payment values as recorded rather than gateway-verified.
# =============================================================================

class PlatformAdminDashboardView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsPlatformAdmin,
    ]

    def get(self, request):

        restaurant_counts = Restaurant.objects.aggregate(
            total=Count(
                "id",
            ),
            active=Count(
                "id",
                filter=Q(
                    is_active=True,
                ),
            ),
        )

        user_counts = User.objects.aggregate(
            total=Count(
                "id",
            ),
            active=Count(
                "id",
                filter=Q(
                    is_active=True,
                ),
            ),
        )

        booking_counts = Booking.objects.aggregate(
            total=Count(
                "id",
            ),
            pending=Count(
                "id",
                filter=Q(
                    status="PENDING",
                ),
            ),
        )

        serializer = PlatformAdminDashboardSerializer(
            {
                "total_restaurants": (
                    restaurant_counts["total"]
                ),
                "active_restaurants": (
                    restaurant_counts["active"]
                ),
                "total_users": user_counts["total"],
                "active_users": user_counts["active"],
                "total_bookings": booking_counts["total"],
                "pending_bookings": booking_counts["pending"],
            }
        )

        try:
            analytics = build_dashboard_analytics(
                query_params=request.query_params,
                bookings=Booking.objects.all(),
                preorders=FoodPreorder.objects.all(),
                branches=Branch.objects.all(),
            )
        except AnalyticsPeriodError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Existing summary fields remain stable for current frontend clients.
        dashboard_data = dict(serializer.data)
        dashboard_data["analytics"] = analytics

        return Response(
            dashboard_data,
            status=status.HTTP_200_OK,
        )


# =============================================================================
# PLATFORM ADMIN - BRANCH MANAGER ASSIGNMENTS
# =============================================================================
class PlatformAdminBranchManagerAssignmentListCreateView(
    generics.ListCreateAPIView
):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get_queryset(self):
        return (
            BranchManagerAssignment.objects
            .select_related(
                "user", "user__profile",
                "branch", "branch__restaurant",
                "assigned_by",
            )
            .order_by("-assigned_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PlatformAdminBranchManagerAssignmentCreateSerializer
        return PlatformAdminBranchManagerAssignmentSerializer


class PlatformAdminBranchManagerAssignmentStatusView(
    generics.UpdateAPIView
):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    serializer_class = PlatformAdminBranchManagerAssignmentStatusSerializer
    http_method_names = ["patch", "options"]
    queryset = (
        BranchManagerAssignment.objects
        .select_related(
            "user", "user__profile",
            "branch", "branch__restaurant",
        )
    )
    lookup_field = "id"
    lookup_url_kwarg = "assignment_id"
