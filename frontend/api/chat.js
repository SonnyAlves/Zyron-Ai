/**
 * Zyron AI - Chat API Endpoint
 * Main endpoint for streaming chat with Claude AI
 * Supports both authenticated and guest modes
 * 
 * SIMPLIFIÉ - Sans Visual Brain (nodes/edges)
 */

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_SIMPLE } from '../lib/prompts.js';
import {
  getOrCreateConversation,
  saveMessage,
  getConversationMessages
} from '../lib/supabase-service.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure for streaming
export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60 seconds for streaming responses
};

/**
 * Main chat handler
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, user_id, conversation_id } = req.body;

  console.log('🔍 BACKEND - Received streaming request:');
  console.log(`  - message: ${message}`);
  console.log(`  - user_id: ${user_id}`);
  console.log(`  - conversation_id: ${conversation_id}`);

  // Validate required fields
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Determine if we need to persist (user is authenticated)
  const shouldPersist = !!user_id;
  let convId = conversation_id;

  try {
    // If authenticated, get or create conversation
    if (shouldPersist) {
      const conversation = await getOrCreateConversation(user_id, conversation_id);
      convId = conversation.id;
      console.log(`✅ Using conversation: ${convId}`);
    } else {
      console.log('👤 Guest mode - no persistence');
    }

    // Build conversation history for context
    let conversationHistory = [];
    if (shouldPersist && convId) {
      const previousMessages = await getConversationMessages(convId);
      // Convert to Claude API format (keep only last 10 messages for context)
      conversationHistory = previousMessages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      console.log(`📚 Loaded ${conversationHistory.length} previous messages for context`);
    }

    // Setup SSE (Server-Sent Events) headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

    let fullResponse = '';

    // Build messages array for Claude
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Stream from Claude
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT_SIMPLE,
      messages: messages,
      stream: true,
    });

    // Process stream chunks
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = chunk.delta.text;
        fullResponse += text;

        // Send chunk as SSE format
        res.write(`data: ${JSON.stringify(text)}\n\n`);
      }
    }

    console.log(`✅ Streaming complete. Total length: ${fullResponse.length}`);

    // PERSISTENCE: Save to Supabase if user is authenticated
    if (shouldPersist && convId) {
      console.log('💾 Saving to Supabase...');

      // Save user message
      await saveMessage(convId, 'user', message);

      // Save assistant message
      await saveMessage(convId, 'assistant', fullResponse);

      console.log('✅ Messages saved to Supabase');
    }

    // End the stream
    res.end();

  } catch (error) {
    console.error('❌ Error during streaming:', error);

    // Send error to client
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}
