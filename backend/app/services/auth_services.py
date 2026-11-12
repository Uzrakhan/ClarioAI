from uuid import UUID

from supabase import AuthApiError

from app.core.supabase import supabase
from app.schemas.auth import AuthenticatedUser, RequestAuthContext


_INVALID_TOKEN_ERROR_CODES = {
    "bad_jwt",
    "invalid_jwt",
    "expired_jwt",
    "session_expired",
    "token_expired",
    "session_not_found",
    "user_not_found",
}


class InvalidAccessToken(Exception):
    """Raised when Supabase Auth rejects the supplied access token."""


class AuthVerificationUnavailable(Exception):
    """Raised when the Auth service cannot be reached or returns a server error."""


def verify_access_token(access_token: str) -> RequestAuthContext:
    if not access_token or not access_token.strip():
        raise InvalidAccessToken

    try:
        response = supabase.auth.get_user(access_token)
    except AuthApiError as exc:
        api_status = getattr(exc, "status", None)
        if (
            exc.code in _INVALID_TOKEN_ERROR_CODES
            and isinstance(api_status, int)
            and 400 <= api_status < 500
            and api_status != 429
        ):
            raise InvalidAccessToken from None
        raise AuthVerificationUnavailable from None
    except Exception:
        # Do not log the exception: SDK errors can include request details.
        raise AuthVerificationUnavailable from None

    user = getattr(response, "user", None)
    user_id = getattr(user, "id", None)
    try:
        verified_user_id = UUID(str(user_id))
    except (TypeError, ValueError, AttributeError):
        raise InvalidAccessToken from None

    return RequestAuthContext(
        user=AuthenticatedUser(id=verified_user_id),
        access_token=access_token,
    )
