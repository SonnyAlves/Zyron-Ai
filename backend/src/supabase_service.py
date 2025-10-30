from supabase import create_client, Client
import os
from typing import List, Optional
from datetime import datetime

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

    def get_or_create_conversation(self, user_id: str, conversation_id: Optional[str] = None) -> dict:
        """Get existing conversation or create new one."""
        if conversation_id:
            response = self.client.table("conversations").select("*").eq("id", conversation_id).single().execute()
            return response.data

        # Create new conversation
        response = self.client.table("conversations").insert({
            "user_id": user_id,
            "title": f"Conversation {datetime.now().strftime('%d/%m %H:%M')}"
        }).execute()
        return response.data[0]

    def save_message(self, conversation_id: str, role: str, content: str) -> dict:
        """Save a message (user or assistant)."""
        response = self.client.table("messages").insert({
            "conversation_id": conversation_id,
            "role": role,
            "content": content
        }).execute()
        return response.data[0]

    def create_node(self, conversation_id: str, message_id: str, node_data: dict) -> dict:
        """Create a new node."""
        response = self.client.table("nodes").insert({
            "conversation_id": conversation_id,
            "message_id": message_id,
            "id": node_data["id"],
            "type": node_data["type"],
            "label": node_data["label"],
            "energy": node_data["energy"]
        }).execute()
        return response.data[0]

    def activate_node(self, node_id: str, energy: float = 0.9):
        """Increase node energy (activation)."""
        self.client.table("nodes").update({"energy": energy}).eq("id", node_id).execute()

    def get_conversation_nodes(self, conversation_id: str) -> List[dict]:
        """Get all nodes in a conversation."""
        response = self.client.table("nodes").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
        return response.data

    def create_edge(self, from_node_id: str, to_node_id: str, strength: float) -> Optional[dict]:
        """Create an edge between two nodes."""
        try:
            response = self.client.table("edges").insert({
                "from_node_id": from_node_id,
                "to_node_id": to_node_id,
                "strength": strength
            }).execute()
            return response.data[0]
        except Exception as e:
            print(f"Edge exists or error: {e}")
            return None

    def get_conversation_edges(self, conversation_id: str) -> List[dict]:
        """Get all edges for nodes in a conversation."""
        nodes = self.get_conversation_nodes(conversation_id)
        node_ids = [n["id"] for n in nodes]

        if not node_ids:
            return []

        response = self.client.table("edges").select("*").in_("from_node_id", node_ids).execute()
        return response.data
