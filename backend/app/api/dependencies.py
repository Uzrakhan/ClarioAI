import asyncio
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_services import (
    AuthVerificationUnavailable,
    InvalidAccessToken,
    verify_access_token,
)
from app.services.patient_service import AuthorizedPatient, authorize_patient
from app.schemas.auth import AuthenticatedUser, RequestAuthContext


_bearer_scheme = HTTPBearer(auto_error=False)


async def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> RequestAuthContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Bearer access token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return await asyncio.to_thread(verify_access_token, credentials.credentials)
    except InvalidAccessToken:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The access token is invalid or expired.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from None
    except AuthVerificationUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None


async def get_current_user(
    auth_context: RequestAuthContext = Depends(get_auth_context),
) -> AuthenticatedUser:
    return auth_context.user


async def get_authorized_patient(
    patient_id: UUID,
    auth_context: RequestAuthContext = Depends(get_auth_context),
) -> AuthorizedPatient:
    return await asyncio.to_thread(
        authorize_patient,
        patient_id,
        auth_context.user,
        auth_context.access_token.get_secret_value(),
    )
