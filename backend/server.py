"""Portfolio Backend Server for FastAPI with MongoDB storage."""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection setup (lazy - connect on first request)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017').strip()
db_name = os.environ.get('DB_NAME', 'hanif_portfolio').strip()

_client = None
_db = None

def get_mongo_client():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
    return _client

def get_db():
    global _db
    if _db is None:
        _db = get_mongo_client()[db_name]
    return _db

# Create the main app
app = FastAPI(title="Portfolio Backend")

# CORS middleware - crucial for frontend-backend communication
_default_origins = "http://localhost:3000,https://livinhislife-beta.vercel.app,https://livinhislife.vercel.app"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://livinhislife-beta.vercel.app",
        "https://livinhislife.vercel.app",
        *[o.strip() for o in os.environ.get('FRONTEND_ORIGINS', _default_origins).split(',') if o.strip()],
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Store db getter in app state for route access
app.state.get_db = get_db

# Storage configuration - CRITICAL for Vercel: use DB storage since filesystem is read-only
from storage import use_db_storage, media_url

if not use_db_storage():
    print("WARNING: Local filesystem storage enabled (use USE_DB_STORAGE=true in .env for Vercel)")
    UPLOAD_DIR = ROOT_DIR / "uploads"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
else:
    print("INFO: MongoDB GridFS storage enabled (required for Vercel deployment)")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include route modules
from routes.articles import router as articles_router
from routes.portfolio import router as portfolio_router
from routes.auth import router as auth_router
from routes.ai import router as ai_router
from routes.media import router as media_router

api_router.include_router(articles_router)
api_router.include_router(portfolio_router)
api_router.include_router(auth_router)
api_router.include_router(ai_router)
api_router.include_router(media_router)


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now, freeze=True)


class ArticleOut(BaseModel):
    article_id: str
    title: str
    slug: str
    excerpt: Optional[str] = ""
    body: Optional[str] = ""
    category: Optional[str] = "Journal"
    image_url: Optional[str] = ""
    intro_video: Optional[str] = ""
    music_url: Optional[str] = ""
    music_title: Optional[str] = ""
    font: Optional[str] = ""
    published: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ArticleCreate(BaseModel):
    title: str
    excerpt: Optional[str] = ""
    body: Optional[str] = ""
    category: Optional[str] = "Journal"
    image_url: Optional[str] = ""
    intro_video: Optional[str] = ""
    music_url: Optional[str] = ""
    music_title: Optional[str] = ""
    font: Optional[str] = ""
    published: bool = True


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    intro_video: Optional[str] = None
    music_url: Optional[str] = None
    music_title: Optional[str] = None
    font: Optional[str] = None
    published: Optional[bool] = None


class ContentInput(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""
    body: Optional[str] = ""
    images: list[str] = []
    metadata: dict = {}
    published: bool = False
    music_url: Optional[str] = ""
    music_title: Optional[str] = ""
    intro_video: Optional[str] = ""
    font: Optional[str] = ""


class FinishUpload(BaseModel):
    upload_id: str
    kind: str
    filename: str
    content_type: Optional[str] = ""


def make_slug(title: str) -> str:
    """Create URL-friendly slug from title."""
    slug = title.lower().strip()
    slug = slug.replace(" ", "-")
    slug = "".join(c for c in slug if c.isalnum() or c == "-")
    return slug or str(uuid.uuid4())[:8]


# ==============================================================================
# Routes
# ==============================================================================

# API Router registration
app.include_router(api_router)
