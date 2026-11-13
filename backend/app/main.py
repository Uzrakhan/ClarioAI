from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, database, health

app = FastAPI(
    title="ClarioAI API",
    description="AI-powered Medical Document Intelligence",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(database.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to ClarioAI",
        "status": "running"
    }


