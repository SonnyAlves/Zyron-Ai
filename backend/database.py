"""
ZYRON AI - Database Client (Supabase)
Handles all database operations and Supabase connection
"""
from supabase import create_client, Client
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from config import settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase client wrapper for database operations"""

    def __init__(self):
        """Initialize Supabase client"""
        try:
            self.client: Client = create_client(
                settings.supabase_url,
                settings.supabase_anon_key
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    # =========================================================================
    # USER OPERATIONS
    # =========================================================================

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        try:
            response = self.client.table("users").select("*").eq("id", user_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {e}")
            return None

    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile"""
        try:
            self.client.table("users").update(updates).eq("id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {e}")
            return False

    async def update_last_seen(self, user_id: str):
        """Update user's last_seen_at timestamp"""
        try:
            self.client.table("users").update({
                "last_seen_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"Error updating last_seen for {user_id}: {e}")

    # =========================================================================
    # CHAT SESSION OPERATIONS
    # =========================================================================

    async def create_session(
        self,
        user_id: str,
        title: str = "New Chat",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new chat session"""
        try:
            data = {
                "user_id": user_id,
                "title": title,
                "metadata": metadata or {}
            }
            response = self.client.table("chat_sessions").insert(data).execute()
            logger.info(f"Created session for user {user_id}")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return None

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a single chat session"""
        try:
            response = self.client.table("chat_sessions").select("*").eq("id", session_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching session {session_id}: {e}")
            return None

    async def list_user_sessions(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        include_archived: bool = False
    ) -> List[Dict[str, Any]]:
        """List all chat sessions for a user"""
        try:
            query = self.client.table("chat_sessions").select("*").eq("user_id", user_id)

            if not include_archived:
                query = query.eq("is_archived", False)

            response = query.order("updated_at", desc=True).limit(limit).offset(offset).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error listing sessions for user {user_id}: {e}")
            return []

    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update a chat session"""
        try:
            self.client.table("chat_sessions").update(updates).eq("id", session_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False

    async def archive_session(self, session_id: str) -> bool:
        """Archive a chat session"""
        return await self.update_session(session_id, {"is_archived": True})

    async def delete_session(self, session_id: str) -> bool:
        """Delete a chat session (and all its messages via CASCADE)"""
        try:
            self.client.table("chat_sessions").delete().eq("id", session_id).execute()
            logger.info(f"Deleted session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False

    # =========================================================================
    # MESSAGE OPERATIONS
    # =========================================================================

    async def create_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        visual_brain_state: Optional[Dict[str, Any]] = None,
        tokens_used: int = 0
    ) -> Optional[Dict[str, Any]]:
        """Create a new message"""
        try:
            data = {
                "session_id": session_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "metadata": metadata or {},
                "visual_brain_state": visual_brain_state,
                "tokens_used": tokens_used
            }
            response = self.client.table("messages").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating message: {e}")
            return None

    async def get_session_messages(
        self,
        session_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all messages for a session"""
        try:
            response = (
                self.client.table("messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .limit(limit)
                .offset(offset)
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(f"Error fetching messages for session {session_id}: {e}")
            return []

    async def update_message(self, message_id: str, updates: Dict[str, Any]) -> bool:
        """Update a message"""
        try:
            self.client.table("messages").update(updates).eq("id", message_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating message {message_id}: {e}")
            return False

    async def delete_message(self, message_id: str) -> bool:
        """Delete a message"""
        try:
            self.client.table("messages").delete().eq("id", message_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting message {message_id}: {e}")
            return False

    # =========================================================================
    # UTILITY FUNCTIONS
    # =========================================================================

    async def get_session_with_messages(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session with all its messages"""
        session = await self.get_session(session_id)
        if not session:
            return None

        messages = await self.get_session_messages(session_id)
        return {
            "session": session,
            "messages": messages
        }

    async def health_check(self) -> bool:
        """Check if Supabase connection is healthy"""
        try:
            # Simple query to test connection
            self.client.table("users").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False


# Global database client instance
db = SupabaseClient()
