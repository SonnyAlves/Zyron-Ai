# Zyron AI Backend - Persistence MVP

Backend API for Zyron AI with Supabase persistence, authentication, and streaming chat.

## Features

- **Streaming Chat**: Real-time streaming responses from Claude via Anthropic API
- **Persistence**: Save chat sessions and messages to Supabase
- **Authentication**: JWT-based auth with Supabase Auth
- **Guest Mode**: Chat without authentication (messages not saved)
- **Session Management**: CRUD operations for chat sessions
- **Row Level Security**: Supabase RLS ensures users only see their own data

## Architecture

```
backend/
├── server.py              # Main FastAPI application
├── config.py              # Environment configuration
├── database.py            # Supabase client & operations
├── models.py              # Pydantic data models
├── auth.py                # Authentication middleware
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variables template
└── supabase_migrations/   # Database schema SQL files
    ├── 001_initial_schema.sql
    └── 002_row_level_security.sql
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (2-3 minutes)
3. Go to **Settings > API** and copy:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Run Database Migrations

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a **New Query**
4. Copy and paste the contents of `supabase_migrations/001_initial_schema.sql`
5. Click **Run** to execute
6. Repeat for `002_row_level_security.sql`

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
   SECRET_KEY=your-generated-secret-key
   ```

3. Generate a secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### 4. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Run the Server

```bash
# Development mode (with auto-reload)
python server.py

# Server will start at http://localhost:8000
```

## API Endpoints

### Health Check

```bash
GET /health
```

### Chat (with streaming)

```bash
POST /chat
Content-Type: application/json

{
  "message": "Hello, Claude!",
  "session_id": "optional-uuid",
  "title": "Optional chat title",
  "stream": true
}
```

**Response**: Server-Sent Events stream

### Session Management

```bash
# Create session
POST /sessions
Authorization: Bearer <token>

# List sessions
GET /sessions?limit=50

# Get session
GET /sessions/{session_id}

# Update session
PATCH /sessions/{session_id}

# Delete session
DELETE /sessions/{session_id}
```

### Messages

```bash
# Get session messages
GET /sessions/{session_id}/messages?limit=100
Authorization: Bearer <token>
```

## Guest Mode

The `/chat` endpoint works without authentication. Messages will be processed but **not saved** to the database.

## Interactive API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Troubleshooting

### "Failed to initialize Supabase client"
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `.env`
- Verify your Supabase project is active

### "Database connection: FAILED"
- Run the SQL migrations in the Supabase SQL Editor
- Check that tables exist: `users`, `chat_sessions`, `messages`

### CORS errors
- Check `ALLOWED_ORIGINS` in `.env` matches your frontend URL
- Default: `http://localhost:3000,http://localhost:5173`
