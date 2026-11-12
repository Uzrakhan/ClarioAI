from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, SecretStr


class AuthenticatedUser(BaseModel):
    """Public identity derived from a Supabase-verified access token."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    id: UUID


class RequestAuthContext(BaseModel):
    """Internal request context; the bearer token is excluded from serialization."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    user: AuthenticatedUser
    access_token: SecretStr = Field(exclude=True, repr=False)


class CurrentUserResponse(BaseModel):
    id: UUID
