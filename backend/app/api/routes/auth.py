from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.schemas.auth import AuthenticatedUser, CurrentUserResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=CurrentUserResponse)
async def get_authenticated_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(id=current_user.id)
