/**
 * =============================================================================
 * ZYRON AI - CENTRALIZED API SERVICE
 * =============================================================================
 *
 * Service centralisé pour tous les appels API vers le backend.
 * Évite la duplication de code et garantit une configuration cohérente.
 *
 * Usage:
 *   import { apiService } from '@/services/apiService'
 *   const response = await apiService.sendChatMessage({ message: 'Hello', user_id: '123' })
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Get the API URL from environment variables
 * Falls back to localhost:8000 in development
 */
const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // If no API URL is set, use localhost in development
  if (!apiUrl) {
    console.warn('⚠️ VITE_API_URL not set, falling back to http://localhost:8000');
    return 'http://localhost:8000';
  }

  return apiUrl;
};

const API_URL = getApiUrl();

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log('🔧 API URL configured:', API_URL);
}

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessagePayload {
  message: string;
  user_id?: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  text: string;
  conversation_id: string;
  graph_update?: {
    new_nodes?: any[];
    activate_nodes?: string[];
    new_edges?: any[];
  };
}

export interface ConversationGraph {
  nodes: any[];
  edges: any[];
}

// =============================================================================
// API SERVICE
// =============================================================================

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a chat message to the backend
   */
  async sendChatMessage(payload: ChatMessagePayload): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat`;

    console.log('📤 Sending chat message to:', url);
    console.log('📤 Payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Chat response received');

    return data;
  }

  /**
   * Send a chat message with streaming response
   * Returns a ReadableStream for streaming responses
   */
  async sendChatMessageStream(payload: ChatMessagePayload): Promise<Response> {
    const url = `${this.baseUrl}/chat`;

    console.log('📤 Sending streaming chat message to:', url);
    console.log('📤 Payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Stream response received');

    return response;
  }

  /**
   * Load a conversation graph by ID
   */
  async loadConversationGraph(conversationId: string): Promise<ConversationGraph> {
    const url = `${this.baseUrl}/conversation/${conversationId}/graph`;

    console.log('📤 Loading conversation graph:', conversationId);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Conversation graph loaded');

    return data;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    const url = `${this.baseUrl}/health`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the current API URL
   */
  getApiUrl(): string {
    return this.baseUrl;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

/**
 * Singleton instance of the API service
 */
export const apiService = new ApiService(API_URL);

/**
 * Export the API URL for direct use if needed
 */
export { API_URL };
