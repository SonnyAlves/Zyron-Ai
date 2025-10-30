export type NodeType = 'GOAL' | 'IDEA' | 'TASK' | 'QUESTION' | 'INSIGHT';

export interface Node {
  id: string;
  conversation_id: string;
  message_id?: string;
  type: NodeType;
  label: string;
  energy: number;
  pinned_position?: { x: number; y: number; z: number };
  created_at: string;
}

export interface Edge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  strength: number;
  created_at: string;
}

export interface GraphUpdate {
  new_nodes: Node[];
  activate_nodes: string[];
  new_edges: Edge[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const NODE_CONFIG: Record<NodeType, {
  color: string;
  emoji: string;
  position: 'top' | 'left' | 'bottom-left' | 'scattered' | 'right';
}> = {
  GOAL:     { color: '#F59E0B', emoji: '🎯', position: 'top' },
  IDEA:     { color: '#3B82F6', emoji: '💡', position: 'left' },
  TASK:     { color: '#10B981', emoji: '✅', position: 'bottom-left' },
  QUESTION: { color: '#06B6D4', emoji: '❓', position: 'scattered' },
  INSIGHT:  { color: '#EF4444', emoji: '⚡', position: 'right' },
};
