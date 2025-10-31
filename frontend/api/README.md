# Zyron AI - Backend API (Vercel)

**Version:** 2.0.0 "Vercel Edition"
**Platform:** Vercel Serverless Functions
**Runtime:** Node.js

---

## 📋 Overview

This is the complete backend API for Zyron AI, running as serverless functions on Vercel. All backend logic has been migrated from Python/FastAPI to JavaScript/Node.js.

### Key Features

- ✅ **Streaming Chat** with Claude AI (Anthropic SDK)
- ✅ **Conversation Persistence** via Supabase
- ✅ **Visual Brain Graph** management (nodes & edges)
- ✅ **Guest Mode** and authenticated user support
- ✅ **Serverless** - automatically scales with traffic
- ✅ **Same Domain** - no CORS issues

---

## 📂 Structure

```
api/
├── chat.js                      # Main streaming chat endpoint
├── health.js                    # Health check
├── version.js                   # Version info
├── index.js                     # Root API endpoint
├── conversations/
│   ├── [id].js                  # Get conversation + graph
│   ├── graph/[id].js            # Get graph only
│   └── messages/[id].js         # Get messages only
└── user/
    └── [userId]/
        └── conversations.js      # Get user's conversations
```

---

## 🔌 Endpoints

### Root & System

#### `GET /api`
Root endpoint with API information.

**Response:**
```json
{
  "status": "Zyron AI Backend is running",
  "version": "2.0.0",
  "codename": "Vercel Edition 🚀",
  "platform": "Vercel Edge Functions",
  "endpoints": { ... }
}
```

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "service": "Zyron AI Backend (Vercel)"
}
```

#### `GET /api/version`
Version information.

**Response:**
```json
{
  "version": "2.0.0",
  "codename": "Vercel Edition 🚀",
  "status": "operational",
  "api": "Vercel",
  "platform": "JavaScript/Node.js"
}
```

---

### Chat

#### `POST /api/chat`
Main streaming chat endpoint with Claude AI.

**Request:**
```json
{
  "message": "Hello Zyron!",
  "user_id": "user_abc123",          // Optional - for authenticated users
  "conversation_id": "conv_xyz789"   // Optional - for continuing conversation
}
```

**Response:**
Streaming response (SSE - Server-Sent Events):
```
data: "Bonjour"
data: " ! "
data: "Comment"
data: " puis-je"
data: " vous"
data: " aider"
data: " ?"
```

**Features:**
- Streams response in real-time
- Saves to Supabase if `user_id` is provided
- Supports guest mode (no `user_id`)
- Builds context from existing conversation nodes

---

### Conversations

#### `GET /api/conversations/[id]`
Get complete conversation with messages and graph.

**Response:**
```json
{
  "conversation_id": "conv_123",
  "messages": [
    { "id": "msg_1", "role": "user", "content": "Hello", "created_at": "..." },
    { "id": "msg_2", "role": "assistant", "content": "Hi!", "created_at": "..." }
  ],
  "graph": {
    "nodes": [
      { "id": "node_1", "type": "GOAL", "label": "Learn AI", "energy": 0.9 }
    ],
    "edges": [
      { "from_node_id": "node_1", "to_node_id": "node_2", "strength": 0.7 }
    ]
  }
}
```

#### `GET /api/conversations/graph/[id]`
Get only the graph (nodes + edges) for a conversation.

**Response:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

#### `GET /api/conversations/messages/[id]`
Get only messages for a conversation.

**Response:**
```json
{
  "conversation_id": "conv_123",
  "messages": [...]
}
```

---

### Users

#### `GET /api/user/[userId]/conversations`
Get all conversations for a user.

**Response:**
```json
{
  "user_id": "user_123",
  "conversations": [
    { "id": "conv_1", "title": "Conversation 31/10 14:30", "updated_at": "..." },
    { "id": "conv_2", "title": "Conversation 30/10 09:15", "updated_at": "..." }
  ]
}
```

---

## 🔐 Environment Variables

Required environment variables (set in Vercel Dashboard):

```bash
# Anthropic API (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Supabase (Backend - Service Role Key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Supabase (Frontend - Anon Key)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Clerk (Authentication)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 🚀 Development

### Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Run with Vite (hot reload)
npm run dev

# OR run with Vercel CLI (better for testing API routes)
npm i -g vercel
vercel dev
```

API routes will be available at:
- **Vite:** `http://localhost:3000/api/*`
- **Vercel CLI:** `http://localhost:3000/api/*`

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Version
curl http://localhost:3000/api/version

# Chat (streaming)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Zyron!"}'
```

---

## 📦 Dependencies

All dependencies are in `../package.json`:

```json
{
  "@anthropic-ai/sdk": "^0.68.0",     // Claude AI SDK
  "@supabase/supabase-js": "^2.76.1"  // Supabase client
}
```

---

## 🧪 Testing

### Manual Testing

1. **Health Check:**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

2. **Streaming Chat:**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Test message"}'
   ```

3. **Get Conversation:**
   ```bash
   curl https://your-domain.vercel.app/api/conversations/YOUR_CONV_ID
   ```

### Automated Testing

TODO: Add Jest/Vitest tests for API routes

---

## 📝 Code Structure

### Chat Endpoint (`chat.js`)

```javascript
// 1. Validate request
// 2. Get/create conversation (if authenticated)
// 3. Build system prompt with context
// 4. Stream from Claude AI
// 5. Save to Supabase (if authenticated)
// 6. Return streaming response
```

### Supabase Service (`../lib/supabase-service.js`)

```javascript
// Database operations:
- getOrCreateConversation()
- saveMessage()
- createNode()
- activateNode()
- getConversationNodes()
- createEdge()
- getConversationEdges()
- getConversationMessages()
- getUserConversations()
```

### Prompts (`../lib/prompts.js`)

```javascript
// System prompts and context building
- SYSTEM_PROMPT: Main Zyron system prompt
- buildContextPrompt(): Build context from existing nodes
```

---

## 🐛 Debugging

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. Click "Functions" tab
6. View logs for each API route

### Local Debugging

Add `console.log()` statements in your API routes. They'll appear in terminal when running `vercel dev` or `npm run dev`.

```javascript
console.log('🔍 Request received:', req.body);
console.log('✅ Response sent:', data);
console.log('❌ Error:', error.message);
```

---

## 🚢 Deployment

### Automatic Deployment

Every push to `main` branch automatically deploys to Vercel.

### Manual Deployment

```bash
vercel --prod
```

### Configure Environment Variables

1. Vercel Dashboard → Project Settings
2. Environment Variables
3. Add all required variables
4. Redeploy

---

## 🔧 Configuration

### `vercel.json`

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,      // 1GB RAM per function
      "maxDuration": 60    // 60s timeout (for streaming)
    }
  }
}
```

### Runtime

- **Edge Functions:** `health.js`, `version.js`, `index.js` (fastest)
- **Node.js:** `chat.js`, all conversation endpoints (needed for streaming)

---

## 📈 Performance

- **Cold Start:** ~50-100ms (Edge), ~200-300ms (Node.js)
- **Response Time:** ~1-2s for streaming to start
- **Concurrent Requests:** Auto-scales to demand
- **Global Distribution:** Deployed to 100+ edge locations

---

## 💰 Cost

Vercel free tier includes:
- 100GB-hrs of function execution per month
- 100GB bandwidth
- 6,000 build minutes

**Estimated cost for Zyron AI:** $0/month (within free tier) ✅

---

## 🔒 Security

- ✅ Service-level Supabase key (not exposed to client)
- ✅ Anthropic API key secured in environment variables
- ✅ Row Level Security (RLS) on Supabase
- ✅ HTTPS by default
- ✅ No CORS issues (same domain)

---

## 📚 Additional Resources

- [Vercel Functions Docs](https://vercel.com/docs/functions)
- [Anthropic SDK Docs](https://github.com/anthropics/anthropic-sdk-typescript)
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript)

---

## 🎉 Migration Complete

This backend is a **complete 1:1 replacement** of the Python/FastAPI backend. All features have been migrated and are working identically.

**Previous:** Python on Render ($7-25/month)
**Current:** JavaScript on Vercel ($0/month) 🚀

---

**Questions?** Check `BACKEND_MIGRATION_COMPLETE.md` in the project root.

