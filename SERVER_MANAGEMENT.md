# Server Management Guide

## Overview

This guide explains the port management system and how to troubleshoot server startup issues in the Zyron-Ai project.

## The Problem We Solved

When developing with hot-reload servers, you frequently encounter this error:

```
Error: Address already in use (errno 48)
socket.error: [Errno 48] Address already in use
uvicorn.error.ServerErrorHandler: Bind to port 8000 failed
```

This happens when:
1. The server process didn't clean up properly
2. You force-quit the terminal without stopping the server
3. Multiple development sessions are running
4. System processes are using the port

## Solutions Provided

### 1. **Python Manager Script** (`backend/manage_server.py`)

The most powerful and recommended solution. Provides complete lifecycle management:

#### Features
- ✅ Automatic port detection
- ✅ Graceful shutdown with timeout
- ✅ Force kill if needed
- ✅ Alternative port fallback
- ✅ JSON status tracking
- ✅ Comprehensive logging
- ✅ Cross-platform support (macOS/Linux)

#### Usage

```bash
cd backend

# Start server (automatic port management)
python manage_server.py start

# Start on custom port
python manage_server.py start --port 9000

# Force kill any process on port
python manage_server.py kill --port 8000

# Stop gracefully
python manage_server.py stop

# Restart
python manage_server.py restart

# Check status
python manage_server.py status
```

### 2. **Bash Script** (`backend/start_server.sh`)

A robust bash alternative for shell-based workflows:

```bash
chmod +x backend/start_server.sh
./backend/start_server.sh          # Port 8000
./backend/start_server.sh 9000     # Custom port
./backend/start_server.sh 8000 --force  # Force mode
```

### 3. **Make Commands** (Recommended for daily use)

Simplest interface for common tasks:

```bash
make backend              # Start backend
make backend-stop         # Stop gracefully
make backend-restart      # Restart
make backend-kill         # Force kill
make backend-status       # Show status
make backend-force        # Force start
```

### 4. **Manual Commands** (Last resort)

If automated tools aren't available:

```bash
# Find what's using port 8000
lsof -i :8000

# Kill by PID (graceful)
kill -TERM <PID>

# Kill by PID (force)
kill -9 <PID>

# Kill all uvicorn processes
pkill -f uvicorn
```

## How the Port Management Works

### Flow Diagram

```
User runs: python manage_server.py start --port 8000
    ↓
Check if port 8000 is available?
    ├─ YES → Start Uvicorn → Server Running ✓
    └─ NO  → Port in use
             ↓
         Graceful shutdown (SIGTERM)?
             ├─ SUCCESS (10s timeout) → Port freed → Start Uvicorn ✓
             └─ TIMEOUT → Force kill (SIGKILL)
                          ↓
                      Try next port (8001, 8002, etc.)
                      ↓
                      Start on alternative port ⚠️
```

### Key Features

1. **Graceful Shutdown**
   - Sends SIGTERM signal
   - Waits 10 seconds for cleanup
   - Allows proper connection closing
   - Saves state if needed

2. **Force Kill Fallback**
   - Used after grace period expires
   - Sends SIGKILL signal
   - Immediately frees the port
   - Risk: May lose unsaved data

3. **Port Fallback**
   - If 8000 is still occupied
   - Try 8001, 8002, 8003, etc.
   - Shows warning in output
   - Logs alternative port

4. **Status Tracking**
   - Saves to `logs/backend_status.json`
   - Contains: status, port, PID, timestamp
   - Updated on every action
   - Used by monitoring tools

## Logging System

### Log Files

```
logs/
├── backend.log          # All server output
├── backend_status.json  # Current server status
└── backend.pid          # Server process ID
```

### Viewing Logs

```bash
# Follow logs in real-time
make logs

# View only errors
make logs-errors

# View last 50 lines
make logs-last

# Manual viewing
tail -f logs/backend.log
cat logs/backend_status.json
```

### Log Format

```
[2025-10-23 22:44:27] [INFO] Starting Zyron-Ai backend server on port 8000
[2025-10-23 22:44:27] [INFO] Force kill: False
[2025-10-23 22:44:27] [INFO] Command: /Users/sonnyalves/Documents/Zyron-Ai/backend/.venv/bin/python -m uvicorn...
[2025-10-23 22:44:27] [INFO] Server available at http://127.0.0.1:8000
[2025-10-23 22:44:27] [INFO] API docs at http://127.0.0.1:8000/docs
[2025-10-23 22:44:27] [INFO] Logs: /Users/sonnyalves/Documents/Zyron-Ai/logs/backend.log
[2025-10-23 22:44:27] [INFO] Status saved: {'status': 'running', 'port': 8000, ...}
```

## Common Scenarios

### Scenario 1: Port is Already in Use

**Problem:**
```
Error: Address already in use (errno 48)
```

**Solution:**

```bash
# Option 1: Automatic (Recommended)
make backend              # Automatically handles it

# Option 2: Manual
cd backend
python manage_server.py kill --port 8000
python manage_server.py start
```

### Scenario 2: Server Hung/Frozen

**Problem:** Server is running but not responding

**Solution:**

```bash
# Option 1: Graceful restart
make backend-restart

# Option 2: Force restart
make backend-force

# Option 3: Manual
cd backend
python manage_server.py restart --force
```

### Scenario 3: Need to Free Port Immediately

**Problem:** Port is critical, need immediate access

**Solution:**

```bash
# Force kill immediately
cd backend
python manage_server.py kill --port 8000 --force

# Or directly
pkill -9 -f "uvicorn"
```

### Scenario 4: Port 8000 Always Occupied by Unknown Process

**Problem:** Some system process always uses port 8000

**Solution:**

```bash
# Use alternative port
make backend --port 9000

# Or manually
cd backend
python manage_server.py start --port 9000

# Update environment if needed
export BACKEND_PORT=9000
```

## Best Practices

### Daily Development

```bash
# 1. Start servers (new terminal)
make dev

# 2. Monitor logs (another terminal)
make logs

# 3. Check status (another terminal)
make status

# 4. When done
make stop
make clean
```

### Before Bed

```bash
# Clean shutdown
make stop

# Clean up temp files
make clean
```

### Weekly Maintenance

```bash
# Full reset (if issues accumulate)
make clean-all
make install
make dev
```

## Debugging Tips

### Is the backend running?

```bash
# Check if process exists
ps aux | grep uvicorn

# Check if port is in use
lsof -i :8000

# Check status
make backend-status
```

### Is the backend responding?

```bash
# Quick health check
curl http://127.0.0.1:8000/health

# Full health check
make health
```

### What's in the logs?

```bash
# Last errors
make logs-errors

# Last 50 lines
make logs-last

# Full log
cat logs/backend.log | head -100
```

### How much time was spent starting?

```bash
# Check timestamps in logs
grep "Starting\|complete\|running" logs/backend.log

# Example output:
# [22:44:27] Starting Zyron-Ai backend server
# [22:44:27] Application startup complete
# [22:44:27] Uvicorn running
# Total time: ~5 seconds
```

## Performance Notes

### Port Detection Speed
- **lsof method**: ~100ms (most reliable)
- **netstat method**: ~200ms (fallback)
- **socket method**: ~50ms (last resort)

### Server Startup Time
- **Cold start**: ~3-5 seconds
- **With reload**: ~2-3 seconds
- **Status update**: <100ms

### Graceful shutdown
- **Target**: <1 second
- **Actual**: 1-10 seconds (depends on connections)

## Troubleshooting Checklist

- [ ] Is the venv activated? `which python`
- [ ] Are dependencies installed? `pip list | grep uvicorn`
- [ ] Is port 8000 free? `lsof -i :8000`
- [ ] Are old processes running? `ps aux | grep python`
- [ ] Check logs for errors: `make logs-errors`
- [ ] Try alternative port: `cd backend && python manage_server.py start --port 9000`
- [ ] Force clean: `pkill -9 -f uvicorn && pkill -9 -f vite`

## File Reference

| File | Purpose |
|------|---------|
| `backend/manage_server.py` | Main Python manager (recommended) |
| `backend/start_server.sh` | Bash startup script |
| `Makefile` | Make-based commands |
| `logs/backend.log` | Server output log |
| `logs/backend_status.json` | Server status |
| `DEVELOPMENT.md` | Full development guide |
| `SERVER_MANAGEMENT.md` | This file |

## FAQ

**Q: Why does port 8000 keep getting occupied?**
A: Likely you're not shutting down the server gracefully. Always use `make stop` or Ctrl+C instead of force-quitting the terminal.

**Q: Can I use a different port?**
A: Yes! Use `python manage_server.py start --port 9000` or modify your `.env` file.

**Q: What if even force kill doesn't work?**
A: Try `sudo lsof -i :8000` to see if it's a system service, or restart your machine.

**Q: How do I know if the server is healthy?**
A: Use `make health` or `curl http://127.0.0.1:8000/health`

**Q: Can I run multiple backend instances?**
A: Yes, on different ports: `python manage_server.py start --port 8000` and `python manage_server.py start --port 8001`

**Q: Are the logs stored permanently?**
A: No, they're in `.gitignore`. Clear with `make clean` when needed.

---

For issues not covered here, check the logs with `make logs-errors` or create an issue in the repo.
