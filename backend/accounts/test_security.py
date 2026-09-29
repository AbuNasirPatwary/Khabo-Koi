from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from .tokens import email_verification_token


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://frontend.test",
)
class AccountRecoverySecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="recovery-user",
            email="recovery@example.com",
            password="Original-Password-827!",
        )

    def test_reset_request_uses_same_response_for_known_and_unknown_email(self):
        known = self.client.post(
            reverse("password_reset_request"),
            {"email": self.user.email},
            format="json",
        )
        unknown = self.client.post(
            reverse("password_reset_request"),
            {"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(known.status_code, status.HTTP_200_OK)
        self.assertEqual(unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("http://frontend.test/reset-password", mail.outbox[0].body)

    def test_valid_reset_token_changes_password_and_cannot_be_reused(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        payload = {
            "uid": uid,
            "token": token,
            "new_password": "Replacement-Password-938!",
        }

        response = self.client.post(
            reverse("password_reset_confirm"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload["new_password"]))

        reused = self.client.post(
            reverse("password_reset_confirm"),
            payload,
            format="json",
        )
        self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_reset_token_does_not_change_password(self):
        response = self.client.post(
            reverse("password_reset_confirm"),
            {
                "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": "invalid-token",
                "new_password": "Replacement-Password-938!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Original-Password-827!"))

    def test_reset_confirm_enforces_configured_password_validation(self):
        response = self.client.post(
            reverse("password_reset_confirm"),
            {
                "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": default_token_generator.make_token(self.user),
                "new_password": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://frontend.test",
)
class EmailVerificationSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="verification-user",
            email="verify@example.com",
            password="Verification-Password-827!",
        )

    def test_anonymous_user_cannot_request_verification_email(self):
        response = self.client.post(reverse("email_verification_request"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(len(mail.outbox), 0)

    def test_authenticated_user_receives_link_for_own_address(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse("email_verification_request"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertIn("http://frontend.test/verify-email", mail.outbox[0].body)

    def test_valid_verification_token_records_time_and_is_one_time(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = email_verification_token.make_token(self.user)
        payload = {"uid": uid, "token": token}

        response = self.client.post(
            reverse("email_verification_confirm"),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.email_verified)
        self.assertIsNotNone(self.user.profile.email_verified_at)

        reused = self.client.post(
            reverse("email_verification_confirm"),
            payload,
            format="json",
        )
        self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_change_invalidates_an_old_verification_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = email_verification_token.make_token(self.user)
        self.user.email = "new-address@example.com"
        self.user.save(update_fields=["email"])

        response = self.client.post(
            reverse("email_verification_confirm"),
            {"uid": uid, "token": token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.email_verified)

    def test_profile_exposes_verification_state(self):
        self.client.force_authenticate(self.user)
        before = self.client.get(reverse("profile"))
        self.assertFalse(before.data["email_verified"])

        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified", "updated_at"])

        after = self.client.get(reverse("profile"))
        self.assertTrue(after.data["email_verified"])


THROTTLED_REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "1/hour",
        "auth_register": "1/hour",
        "password_reset": "1/hour",
        "email_verification": "1/hour",
    },
}


@override_settings(
    REST_FRAMEWORK=THROTTLED_REST_FRAMEWORK,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class AuthenticationThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="throttled-user",
            email="throttled@example.com",
            password="Throttle-Password-827!",
        )

    @patch.dict(
        ScopedRateThrottle.THROTTLE_RATES,
        {"auth_login": "1/hour"},
    )
    def test_repeated_login_attempt_is_throttled(self):
        payload = {"username": self.user.username, "password": "wrong"}
        first = self.client.post(reverse("login"), payload, format="json")
        second = self.client.post(reverse("login"), payload, format="json")

        self.assertEqual(first.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(
        ScopedRateThrottle.THROTTLE_RATES,
        {"password_reset": "1/hour"},
    )
    def test_repeated_password_reset_request_is_throttled(self):
        payload = {"email": "missing@example.com"}
        first = self.client.post(
            reverse("password_reset_request"), payload, format="json"
        )
        second = self.client.post(
            reverse("password_reset_request"), payload, format="json"
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(
        ScopedRateThrottle.THROTTLE_RATES,
        {"auth_register": "1/hour"},
    )
    def test_repeated_registration_is_throttled(self):
        first = self.client.post(
            reverse("register"),
            {
                "username": "first-registration",
                "email": "first@example.com",
                "password": "Registration-Password-827!",
            },
            format="json",
        )
        second = self.client.post(
            reverse("register"),
            {
                "username": "second-registration",
                "email": "second@example.com",
                "password": "Registration-Password-938!",
            },
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(
        ScopedRateThrottle.THROTTLE_RATES,
        {"email_verification": "1/hour"},
    )
    def test_repeated_verification_request_is_throttled(self):
        self.client.force_authenticate(self.user)
        first = self.client.post(reverse("email_verification_request"))
        second = self.client.post(reverse("email_verification_request"))

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
