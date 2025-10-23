# Zyron AI

A modern full-stack AI application with FastAPI backend and React frontend.

## Quick Start

### Option 1: Universal Dev Script (Recommended)
```bash
./dev              # Start both servers
./dev help         # Show all commands
```

### Option 2: Make Commands
```bash
make dev           # Start both servers
make logs          # Follow logs
make status        # Check status
make help          # Show all commands
```

### Option 3: Individual Servers

**Backend**
```bash
cd backend
python manage_server.py start  # Starts on port 8000 with automatic port management
```

**Frontend**
```bash
cd frontend
npm run dev  # Starts on port 5173 or next available
```

## Project Structure

```
Zyron-Ai/
├── backend/              # FastAPI application
│   ├── server.py         # Main app file
│   ├── manage_server.py  # Advanced server manager
│   ├── start_server.sh   # Bash startup script
│   └── .venv/            # Virtual environment
├── frontend/             # React + Vite application
│   ├── src/              # React components
│   └── package.json      # Dependencies & scripts
├── Makefile              # Development commands
├── ./dev                 # Universal dev script
└── logs/                 # Server logs
```

## Server URLs

- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **Frontend**: http://localhost:5173

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Full development guide
- **[SERVER_MANAGEMENT.md](SERVER_MANAGEMENT.md)** - Port management & troubleshooting
- **[PORT_SOLUTION_SUMMARY.md](PORT_SOLUTION_SUMMARY.md)** - Complete system overview

## Features

### Automatic Port Management
- ✅ Detects port conflicts
- ✅ Graceful shutdown with fallback to force kill
- ✅ Alternative port selection
- ✅ Comprehensive logging
- ✅ Status tracking

### Development Tools
- ✅ Hot reload for both frontend and backend
- ✅ FastAPI interactive documentation
- ✅ Vite dev server
- ✅ Make commands for common tasks
- ✅ Real-time log following

## Installation

### Requirements
- Python 3.8+
- Node.js 16+
- Make (optional, but recommended)

### Setup

```bash
# Option 1: Complete setup
make setup

# Option 2: Manual setup
make install        # Install dependencies
./dev setup        # Initialize git
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `./dev` or `make dev` | Start both servers |
| `make backend` | Start backend only |
| `make frontend` | Start frontend only |
| `make logs` | Follow backend logs |
| `make status` | Show server status |
| `make health` | Health check all servers |
| `make stop` | Stop all servers |
| `make clean` | Clean temporary files |

## Troubleshooting

### Port Already in Use?
```bash
make backend-force     # Automatically handles port conflicts
# or
./dev backend
```

### Check Logs
```bash
make logs             # Follow real-time logs
make logs-errors      # Show only errors
```

### Health Check
```bash
make health          # Check if servers are responding
curl http://127.0.0.1:8000/health  # Backend health
```

### Full Troubleshooting Guide
See [SERVER_MANAGEMENT.md](SERVER_MANAGEMENT.md) for detailed solutions.

## Development Workflow

### Daily Development
```bash
# Terminal 1: Start servers
make dev

# Terminal 2: Monitor logs (optional)
make logs

# Terminal 3: Use app
# http://localhost:5173
```

### When Done
```bash
make stop         # Stop servers gracefully
make clean        # Clean temporary files
```

## Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Python 3.11+**

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Node.js**

## License

See LICENSE file for details.

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

For more information, see [DEVELOPMENT.md](DEVELOPMENT.md) and [SERVER_MANAGEMENT.md](SERVER_MANAGEMENT.md).
