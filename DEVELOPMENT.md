# Zyron-Ai Development Guide

## Quick Start

### Start All Servers (Recommended)
```bash
make dev
```

This will start both the backend and frontend servers in parallel.

### Individual Server Control

**Backend only:**
```bash
make backend          # Start backend on port 8000
make backend-stop     # Stop backend gracefully
make backend-restart  # Restart backend
make backend-status   # Check backend status
```

**Frontend only:**
```bash
make frontend         # Start frontend on port 5173 (or auto-selected if busy)
```

## Port Management System

### Problem: Port Already in Use

The project includes an intelligent port management system that automatically handles occupied ports.

#### What Happens When Port 8000 Is In Use:

1. **Graceful Shutdown** - Sends SIGTERM signal to the occupying process
2. **Wait for Cleanup** - Waits up to 10 seconds for graceful shutdown
3. **Force Kill** - If graceful shutdown fails, uses SIGKILL
4. **Alternative Port** - If needed, automatically uses port 8001, 8002, etc.

#### Manual Port Management

Kill a process on a specific port:
```bash
cd backend
python manage_server.py kill --port 8000

# Or force kill
python manage_server.py kill --port 8000 --force
```

### Backend Server Manager Script

The backend includes `manage_server.py` with full lifecycle management:

```bash
cd backend

# Start (automatic port management)
python manage_server.py start              # Port 8000
python manage_server.py start --port 8001 # Custom port

# Force kill any process on port
python manage_server.py kill --port 8000

# Graceful shutdown
python manage_server.py stop

# Restart
python manage_server.py restart

# Check status
python manage_server.py status
```

## Server Locations

- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health
- **Frontend**: http://localhost:5173 (or next available port)

## Logging System

### Backend Logs

All backend operations are logged to `logs/backend.log`:

```bash
# View logs (follow mode)
make logs

# View only errors
make logs-errors

# View last 50 lines
make logs-last

# Manual log viewing
tail -f logs/backend.log
```

### Log Locations
- **Backend logs**: `logs/backend.log`
- **Server status**: `logs/backend_status.json`
- **Server PID**: `logs/backend.pid`

## Troubleshooting

### "Address already in use" Error

**Option 1: Automatic Resolution**
```bash
make backend          # Automatically handles port conflicts
```

**Option 2: Manual Resolution**
```bash
# Force kill the process on port 8000
cd backend
python manage_server.py kill --port 8000

# Then start
python manage_server.py start
```

**Option 3: Find and Kill Manually**
```bash
# See what's using port 8000
lsof -i :8000

# Kill by PID
kill -TERM <PID>    # Graceful
kill -9 <PID>       # Force
```

### Check Server Health

```bash
# Quick health check
make health

# Individual checks
curl http://127.0.0.1:8000/health
curl http://localhost:5173
```

### View Server Status

```bash
make status           # Backend + port availability
make backend-status   # Detailed backend status
```

## Available Make Commands

### Setup
- `make help` - Show all available commands
- `make install` - Install dependencies (backend + frontend)
- `make setup` - Complete setup (install + git init)

### Development
- `make dev` - Start both servers (recommended)
- `make backend` - Start backend server
- `make backend-force` - Force kill and restart backend
- `make backend-stop` - Stop backend gracefully
- `make backend-kill` - Force kill backend
- `make backend-restart` - Restart backend
- `make backend-status` - Show backend status
- `make frontend` - Start frontend dev server

### Monitoring
- `make logs` - Follow backend logs
- `make logs-errors` - Show error logs only
- `make logs-last` - Show last 50 log lines
- `make status` - Show server status
- `make health` - Health check both servers

### Maintenance
- `make clean` - Clean logs and temp files
- `make clean-all` - Deep clean (removes node_modules, .venv)
- `make stop` - Stop servers
- `make restart` - Restart services

## Advanced Usage

### Custom Port for Backend

```bash
cd backend
python manage_server.py start --port 9000
```

### Force Kill on Startup

If a process won't shutdown gracefully:

```bash
cd backend
python manage_server.py start --port 8000 --force
```

### Kill Multiple Ports

```bash
# Kill all Python processes using ports
pkill -f uvicorn
pkill -f vite
```

## Development Workflow

### 1. Initial Setup
```bash
make setup          # One-time setup
```

### 2. Daily Development
```bash
make dev            # Starts both servers
```

### 3. Monitoring
```bash
# In another terminal
make logs           # Watch logs
make status         # Check server status
```

### 4. Cleanup
```bash
make clean          # Clean temp files
make stop           # Stop servers (if needed)
```

## Project Structure

```
Zyron-Ai/
├── backend/
│   ├── server.py              # FastAPI app
│   ├── manage_server.py       # Advanced server manager
│   ├── start_server.sh        # Bash startup script
│   ├── requirements.txt       # Python dependencies
│   ├── .venv/                 # Virtual environment
│   └── logs/                  # Server logs
├── frontend/
│   ├── src/                   # React components
│   ├── package.json           # NPM scripts
│   ├── node_modules/          # Dependencies
│   └── vite.config.js         # Vite configuration
├── Makefile                   # Development automation
├── DEVELOPMENT.md             # This file
├── logs/                      # All server logs
└── .gitignore
```

## Tips & Tricks

### Run Backend in Background
```bash
# Start backend, let it run, close terminal
cd backend && nohup python manage_server.py start > /dev/null 2>&1 &
```

### Monitor Multiple Servers
```bash
# Terminal 1: Backend logs
make logs

# Terminal 2: Frontend dev
make frontend

# Terminal 3: Status/commands
make status
```

### Check Resource Usage
```bash
# See what's running on common ports
lsof -i :8000 -i :5173 -i :3000
```

### Environment Variables (Backend)

Create `backend/.env` if needed:
```bash
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

## Performance Tips

1. **Use `make dev`** - Parallel server startup is faster
2. **Keep logs directory clean** - Old logs can slow down reads
3. **Monitor memory** - Check `logs/backend_status.json` periodically
4. **Restart daily** - Clean restart helps prevent memory leaks

## Getting Help

1. **Check logs**: `make logs-errors`
2. **Check status**: `make status`
3. **Check health**: `make health`
4. **View full help**: `make help`

## Contributing

When you're done with development:

```bash
make stop               # Stop all servers
make clean             # Clean temporary files
git add .
git commit -m "Description of changes"
```

---

For more information about FastAPI, see [FastAPI Documentation](https://fastapi.tiangolo.com/)
For more information about Vite, see [Vite Documentation](https://vitejs.dev/)
