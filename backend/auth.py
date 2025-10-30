"""
ZYRON AI - Authentication & Authorization
JWT token handling and auth middleware
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Security scheme for JWT Bearer tokens
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate JWT token from request
    Returns user_id from the token

    This is a simplified version - in production you'd validate the JWT properly
    For MVP we'll use Supabase's built-in auth
    """
    try:
        token = credentials.credentials

        # TODO: Validate JWT token with Supabase
        # For now, we'll extract the user_id directly
        # In production, use: supabase.auth.get_user(token)

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        # For MVP: return token as user_id (will be replaced with proper JWT validation)
        return token

    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Optional authentication - returns user_id if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
