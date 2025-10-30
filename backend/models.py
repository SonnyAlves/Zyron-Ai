"""
ZYRON AI - Pydantic Models
Data validation models for API requests/responses
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class MessageRole(str, Enum):
    """Message role types"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# =============================================================================
# USER MODELS
# =============================================================================

class UserProfile(BaseModel):
    """User profile response"""
    id: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_seen_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UserUpdate(BaseModel):
    """User profile update request"""
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# =============================================================================
# AUTH MODELS
# =============================================================================

class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    refresh_token: str
    user: UserProfile
    expires_in: int


# =============================================================================
# CHAT SESSION MODELS
# =============================================================================

class ChatSessionCreate(BaseModel):
    """Create chat session request"""
    title: Optional[str] = "New Chat"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ChatSessionUpdate(BaseModel):
    """Update chat session request"""
    title: Optional[str] = None
    is_archived: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatSession(BaseModel):
    """Chat session response"""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatSessionWithMessages(BaseModel):
    """Chat session with messages"""
    session: ChatSession
    messages: List['Message']


# =============================================================================
# MESSAGE MODELS
# =============================================================================

class MessageCreate(BaseModel):
    """Create message request"""
    session_id: str
    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    visual_brain_state: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = 0


class Message(BaseModel):
    """Message response"""
    id: str
    session_id: str
    user_id: str
    role: MessageRole
    content: str
    created_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
    visual_brain_state: Optional[Dict[str, Any]] = None
    tokens_used: int = 0


# =============================================================================
# CHAT API MODELS
# =============================================================================

class ChatRequest(BaseModel):
    """Chat request"""
    message: str = Field(min_length=1)
    session_id: Optional[str] = None  # If None, create new session
    title: Optional[str] = None  # For new session
    stream: bool = True


class ChatResponse(BaseModel):
    """Chat response (non-streaming)"""
    session_id: str
    message_id: str
    role: MessageRole
    content: str
    tokens_used: int = 0


# =============================================================================
# GENERIC RESPONSES
# =============================================================================

class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Generic error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    database: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
