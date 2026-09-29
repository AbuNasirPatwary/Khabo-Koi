from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Create one-time verification tokens tied to the current email."""

    def _make_hash_value(self, user, timestamp):
        profile = getattr(user, "profile", None)
        verified = getattr(profile, "email_verified", False)

        # Including the verification state makes a token unusable immediately
        # after successful confirmation. An email change also invalidates any
        # link that was sent to the old address.
        return f"{user.pk}{timestamp}{user.email}{verified}"


email_verification_token = EmailVerificationTokenGenerator()
