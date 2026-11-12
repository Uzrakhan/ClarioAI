import os
import unittest
from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID

# Force synthetic configuration before importing the module-level Supabase client.
os.environ["SUPABASE_URL"] = "https://example.supabase.test"
os.environ["SUPABASE_KEY"] = "test-api-key"

from fastapi import Depends, FastAPI, HTTPException
from postgrest import APIError

from app.api.dependencies import get_authorized_patient
from app.services import auth_services, patient_service
from app.services.auth_services import AuthenticatedUser
from app.services.patient_service import AuthorizedPatient
from asgi_test_client import ASGITestClient, ASGIResponse


USER_ID = UUID("11111111-1111-4111-8111-111111111111")
OTHER_USER_ID = UUID("22222222-2222-4222-8222-222222222222")
PATIENT_ID = UUID("33333333-3333-4333-8333-333333333333")
ACCESS_TOKEN = "synthetic-access-token"


class FakePatientQuery:
    def __init__(self, rows: list[dict[str, str]], error: Exception | None = None) -> None:
        self.rows = rows
        self.error = error
        self.filters: list[tuple[str, str]] = []

    def select(self, _columns: str) -> "FakePatientQuery":
        return self

    def eq(self, column: str, value: str) -> "FakePatientQuery":
        self.filters.append((column, value))
        return self

    def limit(self, _count: int) -> "FakePatientQuery":
        return self

    def execute(self) -> SimpleNamespace:
        if self.error:
            raise self.error
        return SimpleNamespace(data=self.rows)


class FakePatientClient:
    def __init__(self, rows: list[dict[str, str]], error: Exception | None = None) -> None:
        self.query = FakePatientQuery(rows, error)

    def table(self, _table_name: str) -> FakePatientQuery:
        return self.query


def patient_scope(rows: list[dict[str, str]], seen_tokens: list[str]):
    @contextmanager
    def scope(token: str):
        seen_tokens.append(token)
        yield FakePatientClient(rows)

    return scope


patient_test_app = FastAPI()


@patient_test_app.get("/patients/{patient_id}")
async def test_only_patient_route(
    patient: AuthorizedPatient = Depends(get_authorized_patient),
) -> dict[str, str]:
    return {"id": str(patient.id)}


class PatientAuthorizationUnitTests(unittest.TestCase):
    def setUp(self) -> None:
        self.user = AuthenticatedUser(id=USER_ID)

    def test_owner_is_authorized_and_owner_filter_is_applied(self) -> None:
        rows = [{"id": str(PATIENT_ID), "owner_user_id": str(USER_ID)}]
        seen_tokens: list[str] = []
        client = FakePatientClient(rows)

        @contextmanager
        def scope(token: str):
            seen_tokens.append(token)
            yield client

        with patch.object(patient_service, "user_scoped_postgrest_client", side_effect=scope):
            patient = patient_service.authorize_patient(
                PATIENT_ID, self.user, ACCESS_TOKEN
            )

        self.assertEqual(patient.id, PATIENT_ID)
        self.assertEqual(seen_tokens, [ACCESS_TOKEN])
        self.assertEqual(
            client.query.filters,
            [("id", str(PATIENT_ID)), ("owner_user_id", str(USER_ID))],
        )

    def test_non_owner_and_missing_patient_return_identical_404(self) -> None:
        non_owner_rows = [
            {"id": str(PATIENT_ID), "owner_user_id": str(OTHER_USER_ID)}
        ]
        for rows in (non_owner_rows, []):
            with self.subTest(rows=rows):
                with patch.object(
                    patient_service,
                    "user_scoped_postgrest_client",
                    side_effect=patient_scope(rows, []),
                ):
                    with self.assertRaises(HTTPException) as raised:
                        patient_service.authorize_patient(
                            PATIENT_ID, self.user, ACCESS_TOKEN
                        )

                self.assertEqual(raised.exception.status_code, 404)
                self.assertEqual(
                    raised.exception.detail, "Patient not found or access denied."
                )

    def test_rls_permission_denial_is_not_bypassed(self) -> None:
        denied_client = FakePatientClient(
            [], APIError({"code": "42501", "message": "policy denied access"})
        )
        with patch.object(
            patient_service,
            "user_scoped_postgrest_client",
            side_effect=lambda _token: _client_scope(denied_client),
        ):
            with self.assertRaises(HTTPException) as raised:
                patient_service.authorize_patient(PATIENT_ID, self.user, ACCESS_TOKEN)

        self.assertEqual(raised.exception.status_code, 404)
        self.assertEqual(raised.exception.detail, "Patient not found or access denied.")


@contextmanager
def _client_scope(client: FakePatientClient):
    yield client


class PatientAuthorizationHttpTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = ASGITestClient(patient_test_app, timeout=1.5)

    async def request(
        self, path: str, headers: dict[str, str] | None = None
    ) -> ASGIResponse:
        return await self.client.get(path, headers=headers)

    async def test_test_route_uses_verified_identity_and_hides_existence(self) -> None:
        rows_holder = {
            "rows": [{"id": str(PATIENT_ID), "owner_user_id": str(USER_ID)}]
        }
        seen_tokens: list[str] = []

        @contextmanager
        def scoped_client(token: str):
            seen_tokens.append(token)
            yield FakePatientClient(rows_holder["rows"])

        auth_response = SimpleNamespace(user=SimpleNamespace(id=str(USER_ID)))
        with (
            patch.object(
                auth_services.supabase.auth, "get_user", return_value=auth_response
            ),
            patch.object(
                patient_service,
                "user_scoped_postgrest_client",
                side_effect=scoped_client,
            ),
        ):
            allowed = await self.request(
                f"/patients/{PATIENT_ID}?user_id={OTHER_USER_ID}",
                {"Authorization": f"Bearer {ACCESS_TOKEN}"},
            )
            rows_holder["rows"] = [
                {"id": str(PATIENT_ID), "owner_user_id": str(OTHER_USER_ID)}
            ]
            hidden = await self.request(
                f"/patients/{PATIENT_ID}",
                {"Authorization": f"Bearer {ACCESS_TOKEN}"},
            )
            rows_holder["rows"] = []
            missing = await self.request(
                f"/patients/{PATIENT_ID}",
                {"Authorization": f"Bearer {ACCESS_TOKEN}"},
            )

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.json(), {"id": str(PATIENT_ID)})
        self.assertEqual(hidden.status_code, 404)
        self.assertEqual(hidden.json(), missing.json())
        self.assertEqual(seen_tokens, [ACCESS_TOKEN, ACCESS_TOKEN, ACCESS_TOKEN])

    async def test_test_route_rejects_missing_token_before_database_access(self) -> None:
        with patch.object(auth_services.supabase.auth, "get_user") as get_user:
            response = await self.request(f"/patients/{PATIENT_ID}")

        self.assertEqual(response.status_code, 401)
        get_user.assert_not_called()


if __name__ == "__main__":
    unittest.main()
