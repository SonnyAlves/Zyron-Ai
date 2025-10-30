"""
Zyron AI - Main FastAPI Application
Backend with Visual Brain integration
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic
import os
import json
from dotenv import load_dotenv

from supabase_service import SupabaseService
from prompts import SYSTEM_PROMPT, build_context_prompt
from schemas import AssistantResponse, ChatRequest, GraphUpdate

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="Zyron AI Backend",
    description="Visual Brain system with FastAPI and Supabase",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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
async def chat(request: ChatRequest):
    """Main chat endpoint with Visual Brain integration."""
    try:
        # Get or create conversation
        conversation = db.get_or_create_conversation(request.user_id, request.conversation_id)
        conversation_id = conversation["id"]

        # Load existing nodes for context
        existing_nodes = db.get_conversation_nodes(conversation_id)
        context = build_context_prompt(existing_nodes)
        system_prompt = SYSTEM_PROMPT.replace("{current_graph}", context)

        # Call Claude
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": request.message}]
        )

        response_text = response.content[0].text

        # Try to parse as JSON
        try:
            parsed = json.loads(response_text)
            assistant_response = AssistantResponse(**parsed)
        except json.JSONDecodeError:
            # Fallback if Claude doesn't return JSON
            assistant_response = AssistantResponse(
                text=response_text,
                graph_update=GraphUpdate()
            )

        # Save user message
        db.save_message(conversation_id, "user", request.message)

        # Save assistant message
        assistant_message = db.save_message(conversation_id, "assistant", assistant_response.text)
        message_id = assistant_message["id"]

        # Create new nodes
        created_nodes = []
        for node in assistant_response.graph_update.new_nodes:
            created_node = db.create_node(conversation_id, message_id, node.dict())
            created_nodes.append(created_node)

        # Activate existing nodes
        for node_id in assistant_response.graph_update.activate_nodes:
            db.activate_node(node_id)

        # Create edges
        created_edges = []
        for edge in assistant_response.graph_update.new_edges:
            created_edge = db.create_edge(edge.from_node, edge.to_node, edge.strength)
            if created_edge:
                created_edges.append(created_edge)

        return {
            "conversation_id": conversation_id,
            "text": assistant_response.text,
            "graph_update": {
                "new_nodes": created_nodes,
                "activate_nodes": assistant_response.graph_update.activate_nodes,
                "new_edges": created_edges
            }
        }

    except Exception as e:
        print(f"Error: {e}")
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
