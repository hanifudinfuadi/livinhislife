from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class User(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    password_hash: Optional[str] = None
    created_at: Optional[datetime] = None


class PasswordResetToken(BaseModel):
    token_hash: str
    user_id: str
    email: str
    expires_at: datetime
    used: bool = False
    created_at: Optional[datetime] = None


class UserSession(BaseModel):
    user_id: str
    session_token_hash: str
    expires_at: datetime
    created_at: Optional[datetime] = None


class SessionData(BaseModel):
    session_token: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
