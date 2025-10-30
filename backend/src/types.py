from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    GOAL = "GOAL"
    IDEA = "IDEA"
    TASK = "TASK"
    QUESTION = "QUESTION"
    INSIGHT = "INSIGHT"

class NodeCreate(BaseModel):
    id: str
    type: NodeType
    label: str
    energy: float = Field(ge=0, le=1, default=0.8)

class EdgeCreate(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    strength: float = Field(ge=0, le=1, default=0.7)

    class Config:
        populate_by_name = True

class GraphUpdate(BaseModel):
    new_nodes: List[NodeCreate] = []
    activate_nodes: List[str] = []
    new_edges: List[EdgeCreate] = []

class AssistantResponse(BaseModel):
    text: str
    graph_update: GraphUpdate

class ChatRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None
