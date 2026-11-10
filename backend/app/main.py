from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health,database

app = FastAPI(
    title="ClarioAI API",
    description="AI-powered Medical Document Intelligence",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(database.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to ClarioAI",
        "status": "running"
    }


