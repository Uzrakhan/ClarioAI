from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from postgrest import APIError

from app.core.supabase import user_scoped_postgrest_client
from app.services.auth_services import AuthenticatedUser


@dataclass(frozen=True)
class AuthorizedPatient:
    id: UUID
    owner_user_id: UUID


_PATIENT_NOT_FOUND = "Patient not found or access denied."


def authorize_patient(
    patient_id: UUID,
    user: AuthenticatedUser,
    access_token: str,
) -> AuthorizedPatient:
    """Return a patient only when the verified user owns the RLS-visible row."""
    try:
        with user_scoped_postgrest_client(access_token) as client:
            response = (
                client.table("patients")
                .select("id,owner_user_id")
                .eq("id", str(patient_id))
                .eq("owner_user_id", str(user.id))
                .limit(1)
                .execute()
            )
    except APIError as exc:
        if exc.code == "42501":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=_PATIENT_NOT_FOUND,
            ) from None
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient access could not be verified.",
        ) from None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient access could not be verified.",
        ) from None

    rows = response.data
    if not isinstance(rows, list):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient access could not be verified.",
        )
    if not rows:
        # RLS may intentionally hide a row the caller is not allowed to see.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_PATIENT_NOT_FOUND,
        )

    row = rows[0]
    if not isinstance(row, dict):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient ownership could not be verified.",
        )
    try:
        row_id = UUID(str(row["id"]))
        owner_user_id = UUID(str(row["owner_user_id"]))
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient ownership could not be verified.",
        ) from None

    if owner_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_PATIENT_NOT_FOUND,
        )

    return AuthorizedPatient(id=row_id, owner_user_id=owner_user_id)
