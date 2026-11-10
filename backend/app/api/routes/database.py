from fastapi import APIRouter, HTTPException

from app.core.supabase import supabase

router = APIRouter(
    prefix="/database",
    tags=["Database"]
)


@router.get("/test")
async def test_database_connection():

    try:
        result = (
            supabase
            .table("patients")
            .select("id")
            .limit(1)
            .execute()
        )

        return {
            "status": "connected",
            "table": "patients",
            "message": "Supabase database is reachable",
            "query_successful": True
        }

    except Exception as e:
        print(f"Database connection error: {e}")

        raise HTTPException(
            status_code=503,
            detail="Supabase database query failed"
        )