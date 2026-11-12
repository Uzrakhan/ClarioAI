import asyncio
import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID

# Force synthetic configuration before importing the module-level Supabase client.
os.environ["SUPABASE_URL"] = "https://example.supabase.test"
os.environ["SUPABASE_KEY"] = "test-api-key"

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.security import HTTPAuthorizationCredentials
from supabase import AuthApiError

from app.api.dependencies import get_auth_context, get_current_user
from app.main import app
from app.schemas.auth import AuthenticatedUser, CurrentUserResponse, RequestAuthContext
from app.services import auth_services
from app.services.auth_services import AuthVerificationUnavailable, InvalidAccessToken
from asgi_test_client import ASGITestClient, ASGIResponse


USER_ID = UUID("11111111-1111-4111-8111-111111111111")
ACCESS_TOKEN = "synthetic-access-token"


def bearer(token: str = ACCESS_TOKEN) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class AuthenticationUnitTests(unittest.TestCase):
    def test_missing_credentials_returns_401(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            asyncio.run(get_auth_context(None))

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.headers["WWW-Authenticate"], "Bearer")

    def test_known_invalid_and_expired_tokens_return_401(self) -> None:
        cases = (
            (400, "invalid_jwt"),
            (401, "bad_jwt"),
            (401, "expired_jwt"),
            (401, "session_expired"),
        )
        for api_status, error_code in cases:
            with self.subTest(api_status=api_status, error_code=error_code):
                with patch.object(
                    auth_services.supabase.auth,
                    "get_user",
                    side_effect=AuthApiError("rejected token", api_status, error_code),
                ):
                    with self.assertRaises(HTTPException) as raised:
                        asyncio.run(get_auth_context(bearer("malformed-token")))

                self.assertEqual(raised.exception.status_code, 401)

    def test_unexpected_auth_statuses_return_503(self) -> None:
        for api_status, error_code in (
            (400, "unexpected_error"),
            (401, "invalid_api_key"),
            (404, None),
            (503, None),
        ):
            with self.subTest(api_status=api_status, error_code=error_code):
                with patch.object(
                    auth_services.supabase.auth,
                    "get_user",
                    side_effect=AuthApiError("unexpected Auth failure", api_status, error_code),
                ):
                    with self.assertRaises(AuthVerificationUnavailable):
                        auth_services.verify_access_token("some-token")

    def test_malformed_verified_user_uuid_is_rejected(self) -> None:
        response = SimpleNamespace(user=SimpleNamespace(id="not-a-uuid"))
        with patch.object(auth_services.supabase.auth, "get_user", return_value=response):
            with self.assertRaises(InvalidAccessToken):
                auth_services.verify_access_token(ACCESS_TOKEN)

    def test_verified_identity_is_separate_from_token_context(self) -> None:
        response = SimpleNamespace(user=SimpleNamespace(id=str(USER_ID)))
        with patch.object(auth_services.supabase.auth, "get_user", return_value=response):
            context = auth_services.verify_access_token(ACCESS_TOKEN)

        self.assertEqual(context.user, AuthenticatedUser(id=USER_ID))
        self.assertEqual(context.access_token.get_secret_value(), ACCESS_TOKEN)

    def test_token_is_absent_from_jsonable_serialization_and_repr(self) -> None:
        context = RequestAuthContext(
            user=AuthenticatedUser(id=USER_ID), access_token=ACCESS_TOKEN
        )

        serialized = json.dumps(jsonable_encoder(context))

        self.assertNotIn(ACCESS_TOKEN, serialized)
        self.assertNotIn("access_token", serialized)
        self.assertNotIn(ACCESS_TOKEN, repr(context))

    def test_current_user_dependency_returns_identity_only(self) -> None:
        context = RequestAuthContext(
            user=AuthenticatedUser(id=USER_ID), access_token=ACCESS_TOKEN
        )

        self.assertEqual(
            asyncio.run(get_current_user(context)), AuthenticatedUser(id=USER_ID)
        )
        self.assertEqual(CurrentUserResponse(id=USER_ID).model_dump(), {"id": USER_ID})


class AuthenticationHttpTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = ASGITestClient(app, timeout=1.5)

    async def request(
        self, path: str, headers: dict[str, str] | None = None
    ) -> ASGIResponse:
        return await self.client.get(path, headers=headers)

    async def test_auth_me_without_token_returns_401_without_calling_supabase(self) -> None:
        with patch.object(auth_services.supabase.auth, "get_user") as get_user:
            response = await self.request("/auth/me")

        self.assertEqual(response.status_code, 401)
        get_user.assert_not_called()

    async def test_auth_me_returns_verified_id_and_never_the_token(self) -> None:
        auth_response = SimpleNamespace(user=SimpleNamespace(id=str(USER_ID)))
        with patch.object(
            auth_services.supabase.auth, "get_user", return_value=auth_response
        ) as get_user:
            response = await self.request(
                "/auth/me",
                {"Authorization": f"Bearer {ACCESS_TOKEN}"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"id": str(USER_ID)})
        self.assertNotIn(ACCESS_TOKEN, response.text)
        get_user.assert_called_once_with(ACCESS_TOKEN)

    async def test_auth_me_maps_malformed_token_to_401(self) -> None:
        with patch.object(
            auth_services.supabase.auth,
            "get_user",
            side_effect=AuthApiError("malformed token", 400, "invalid_jwt"),
        ):
            response = await self.request(
                "/auth/me", {"Authorization": "Bearer not-a-jwt"}
            )

        self.assertEqual(response.status_code, 401)

    async def test_auth_me_maps_unexpected_auth_failure_to_503(self) -> None:
        with patch.object(
            auth_services.supabase.auth,
            "get_user",
            side_effect=AuthApiError("bad API key", 401, "invalid_api_key"),
        ):
            response = await self.request(
                "/auth/me", {"Authorization": f"Bearer {ACCESS_TOKEN}"}
            )

        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
