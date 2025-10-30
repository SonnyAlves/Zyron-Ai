"""
ZYRON AI - FastAPI Backend Server
Main server with chat, persistence, and auth endpoints
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import anthropic
import json
from typing import Optional, AsyncIterator

# Local imports
from config import settings
from database import db
from models import (
    ChatRequest, ChatResponse, ChatSession, ChatSessionCreate,
    ChatSessionUpdate, Message, MessageCreate, HealthCheck,
    SuccessResponse, ErrorResponse, MessageRole
)
from auth import get_current_user, get_optional_user

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Anthropic client
anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


# =============================================================================
# LIFESPAN CONTEXT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting Zyron AI Backend Server...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"CORS Origins: {settings.origins_list}")

    # Check database connection
    db_healthy = await db.health_check()
    if db_healthy:
        logger.info("Database connection: OK")
    else:
        logger.warning("Database connection: FAILED")

    yield

    logger.info("Shutting down Zyron AI Backend Server...")


# =============================================================================
# APP INITIALIZATION
# =============================================================================

app = FastAPI(
    title="Zyron AI Backend",
    description="Backend API for Zyron AI chat with persistence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# HEALTH & STATUS ENDPOINTS
# =============================================================================

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    db_status = "healthy" if await db.health_check() else "unhealthy"
    return HealthCheck(
        status="ok",
        database=db_status,
        timestamp=datetime.utcnow()
    )


# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@app.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    user_id: Optional[str] = Depends(get_optional_user)
):
    """
    Chat endpoint with streaming support
    - If user is authenticated: saves messages to database
    - If not authenticated: returns response without saving (guest mode)
    """
    try:
        session_id = request.session_id

        # If authenticated and no session_id provided, create new session
        if user_id and not session_id:
            session = await db.create_session(
                user_id=user_id,
                title=request.title or "New Chat"
            )
            if session:
                session_id = session["id"]
                logger.info(f"Created new session {session_id} for user {user_id}")

        # Save user message if authenticated
        if user_id and session_id:
            await db.create_message(
                session_id=session_id,
                user_id=user_id,
                role=MessageRole.USER.value,
                content=request.message
            )

        # Stream response from Anthropic
        if request.stream:
            return StreamingResponse(
                stream_anthropic_response(request.message, user_id, session_id),
                media_type="text/event-stream"
            )
        else:
            # Non-streaming response
            full_response = await get_anthropic_response(request.message)

            # Save assistant message if authenticated
            message_id = None
            if user_id and session_id:
                msg = await db.create_message(
                    session_id=session_id,
                    user_id=user_id,
                    role=MessageRole.ASSISTANT.value,
                    content=full_response
                )
                if msg:
                    message_id = msg["id"]

            return ChatResponse(
                session_id=session_id or "guest",
                message_id=message_id or "guest",
                role=MessageRole.ASSISTANT,
                content=full_response
            )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def stream_anthropic_response(
    message: str,
    user_id: Optional[str],
    session_id: Optional[str]
) -> AsyncIterator[str]:
    """
    Stream response from Anthropic Claude API
    Format: Server-Sent Events (SSE)
    """
    try:
        full_content = ""

        # Stream from Anthropic
        with anthropic_client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            for text in stream.text_stream:
                full_content += text
                # Send as Server-Sent Event with proper JSON encoding
                yield f"data: {json.dumps(text)}\n\n"

        # Save assistant response if authenticated
        if user_id and session_id:
            await db.create_message(
                session_id=session_id,
                user_id=user_id,
                role=MessageRole.ASSISTANT.value,
                content=full_content
            )

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


async def get_anthropic_response(message: str) -> str:
    """Get non-streaming response from Anthropic"""
    try:
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# =============================================================================
# SESSION MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/sessions", response_model=ChatSession)
async def create_session(
    request: ChatSessionCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a new chat session"""
    session = await db.create_session(
        user_id=user_id,
        title=request.title,
        metadata=request.metadata
    )
    if not session:
        raise HTTPException(status_code=500, detail="Failed to create session")
    return session


@app.get("/sessions", response_model=list[ChatSession])
async def list_sessions(
    user_id: str = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    include_archived: bool = False
):
    """List all sessions for current user"""
    sessions = await db.list_user_sessions(
        user_id=user_id,
        limit=limit,
        offset=offset,
        include_archived=include_archived
    )
    return sessions


@app.get("/sessions/{session_id}", response_model=ChatSession)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get a specific session"""
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify ownership
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return session


@app.patch("/sessions/{session_id}", response_model=SuccessResponse)
async def update_session(
    session_id: str,
    request: ChatSessionUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a session"""
    # Verify ownership
    session = await db.get_session(session_id)
    if not session or session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    updates = request.dict(exclude_unset=True)
    success = await db.update_session(session_id, updates)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update session")

    return SuccessResponse(message="Session updated successfully")


@app.delete("/sessions/{session_id}", response_model=SuccessResponse)
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a session"""
    # Verify ownership
    session = await db.get_session(session_id)
    if not session or session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    success = await db.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete session")

    return SuccessResponse(message="Session deleted successfully")


# =============================================================================
# MESSAGE ENDPOINTS
# =============================================================================

@app.get("/sessions/{session_id}/messages", response_model=list[Message])
async def get_session_messages(
    session_id: str,
    user_id: str = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    """Get all messages for a session"""
    # Verify ownership
    session = await db.get_session(session_id)
    if not session or session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = await db.get_session_messages(session_id, limit, offset)
    return messages


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug
    )
