"""
Zyron AI - Main FastAPI Application
Backend with Visual Brain integration
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from anthropic import Anthropic
import os
import json
from pathlib import Path
from dotenv import load_dotenv

from supabase_service import SupabaseService
from prompts import SYSTEM_PROMPT, build_context_prompt
from schemas import AssistantResponse, ChatRequest, GraphUpdate

# Load .env from backend/ (parent directory)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Verify env vars are loaded
print(f"✅ SUPABASE_URL: {os.getenv('SUPABASE_URL')[:30]}..." if os.getenv('SUPABASE_URL') else "❌ SUPABASE_URL not found")
print(f"✅ ANTHROPIC_API_KEY: {os.getenv('ANTHROPIC_API_KEY')[:20]}..." if os.getenv('ANTHROPIC_API_KEY') else "❌ ANTHROPIC_API_KEY not found")

# Initialize FastAPI
app = FastAPI(
    title="Zyron AI Backend",
    description="Visual Brain system with FastAPI and Supabase",
    version="1.0.0"
)

# CORS middleware - Allow all localhost ports for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = SupabaseService()
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


@app.get("/")
async def root():
    """Root endpoint"""
    return {"status": "Zyron AI Backend is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/chat")
async def chat_stream(request: ChatRequest):
    """
    Main chat endpoint with streaming support and optional persistence.

    - Streams Claude's response in real-time (SSE format)
    - If user_id provided: saves to Supabase after streaming completes
    - If user_id is None: guest mode, no persistence

    This single endpoint serves both authenticated and guest users.
    """
    print(f"🔍 BACKEND - Received streaming request:")
    print(f"  - message: {request.message}")
    print(f"  - user_id: {request.user_id}")
    print(f"  - conversation_id: {request.conversation_id}")

    # Determine if we need to persist (user is authenticated)
    should_persist = request.user_id is not None
    conversation_id = request.conversation_id

    try:
        # If authenticated, get or create conversation for context
        if should_persist:
            conversation = db.get_or_create_conversation(request.user_id, conversation_id)
            conversation_id = conversation["id"]
            print(f"✅ Using conversation: {conversation_id}")
        else:
            print("👤 Guest mode - no persistence")

        # Build system prompt (with context if authenticated)
        if should_persist and conversation_id:
            existing_nodes = db.get_conversation_nodes(conversation_id)
            context = build_context_prompt(existing_nodes)
            system_prompt = SYSTEM_PROMPT.replace("{current_graph}", context)
        else:
            system_prompt = SYSTEM_PROMPT.replace("{current_graph}", "No previous context.")

        # Streaming generator
        async def generate_stream():
            full_response = ""

            try:
                # Stream from Claude
                with claude.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": request.message}]
                ) as stream:
                    for text in stream.text_stream:
                        # Send each chunk as SSE (Server-Sent Events)
                        # Use JSON.stringify format for consistency with frontend
                        escaped_text = json.dumps(text)
                        yield f"data: {escaped_text}\n\n"
                        full_response += text

                print(f"✅ Streaming complete. Total length: {len(full_response)}")

                # PERSISTENCE: Save to Supabase if user is authenticated
                if should_persist and conversation_id:
                    print("💾 Saving to Supabase...")

                    # Save user message
                    db.save_message(conversation_id, "user", request.message)

                    # Save assistant message
                    db.save_message(conversation_id, "assistant", full_response)

                    print("✅ Messages saved to Supabase")

            except Exception as e:
                error_msg = f"Error during streaming: {str(e)}"
                print(f"❌ {error_msg}")
                yield f"data: {json.dumps(error_msg)}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering for Nginx
            }
        )

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/{conversation_id}/graph")
async def get_graph(conversation_id: str):
    """Get complete graph for a conversation."""
    try:
        nodes = db.get_conversation_nodes(conversation_id)
        edges = db.get_conversation_edges(conversation_id)
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Get all messages in a conversation."""
    try:
        response = db.client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
        return {"messages": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/user/{user_id}/conversations")
async def get_user_conversations(user_id: str):
    """Get all conversations for a user."""
    try:
        response = db.client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        return {"conversations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
