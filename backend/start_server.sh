#!/bin/bash

###############################################################################
# Zyron-Ai Backend Server Startup Script
# Robustly manages port allocation and server lifecycle
# Usage: ./backend/start_server.sh [port] [--force]
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PATH="${SCRIPT_DIR}/.venv"
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/backend.log"
PID_FILE="${LOG_DIR}/backend.pid"
DEFAULT_PORT=8000
FORCE_KILL=${FORCE_KILL:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ Error: $@${NC}" >&2
    log "ERROR" "$@"
}

success() {
    echo -e "${GREEN}✓ $@${NC}"
    log "INFO" "$@"
}

warning() {
    echo -e "${YELLOW}⚠ Warning: $@${NC}"
    log "WARN" "$@"
}

info() {
    echo -e "${BLUE}ℹ $@${NC}"
    log "INFO" "$@"
}

# Create log directory
mkdir -p "$LOG_DIR"

# Parse arguments
PORT=${1:-$DEFAULT_PORT}
if [[ "${2:-}" == "--force" ]]; then
    FORCE_KILL=true
fi

info "Zyron-Ai Backend Server Startup"
info "Port: $PORT | Force Kill: $FORCE_KILL"

# Check if venv exists
if [[ ! -d "$VENV_PATH" ]]; then
    error "Virtual environment not found at $VENV_PATH"
    error "Please run: python -m venv $VENV_PATH && pip install -r $SCRIPT_DIR/requirements.txt"
    exit 1
fi

# Activate venv
source "$VENV_PATH/bin/activate"

# Check if port is in use
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i ":$port" 2>/dev/null || return 1
    elif command -v netstat &> /dev/null; then
        netstat -tln 2>/dev/null | grep ":$port " || return 1
    else
        # Fallback: try to connect to the port
        timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null || return 1
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    local force=${2:-false}

    info "Attempting to kill process on port $port..."

    # Get PIDs using the port
    local pids=""
    if command -v lsof &> /dev/null; then
        pids=$(lsof -ti ":$port" 2>/dev/null || echo "")
    fi

    if [[ -z "$pids" ]]; then
        warning "No process found using port $port"
        return 0
    fi

    for pid in $pids; do
        info "Found process PID: $pid"

        if $force; then
            warning "Force killing PID $pid"
            kill -9 "$pid" 2>/dev/null || true
        else
            info "Sending SIGTERM to PID $pid"
            kill -TERM "$pid" 2>/dev/null || true

            # Wait up to 10 seconds for graceful shutdown
            for i in {1..10}; do
                if ! check_port "$port" 2>/dev/null; then
                    success "Process $pid terminated gracefully"
                    return 0
                fi
                sleep 1
            done

            warning "Graceful shutdown timeout, force killing PID $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    sleep 1
}

# Check if port is in use and handle it
if check_port "$PORT" 2>/dev/null; then
    warning "Port $PORT is already in use"

    if $FORCE_KILL; then
        kill_port "$PORT" true
    else
        kill_port "$PORT" false
    fi

    # Try alternative ports if 8000 is still busy
    if check_port "$PORT" 2>/dev/null; then
        warning "Port $PORT is still in use"
        info "Searching for available ports..."

        for alt_port in $((PORT+1)) $((PORT+2)) $((PORT+3)) $((PORT+4)) $((PORT+5)); do
            if ! check_port "$alt_port" 2>/dev/null; then
                warning "Using alternative port $alt_port instead of $PORT"
                PORT=$alt_port
                break
            fi
        done
    fi
fi

# Verify port is now free
if check_port "$PORT" 2>/dev/null; then
    error "Could not free port $PORT. Please manually kill the process:"
    if command -v lsof &> /dev/null; then
        lsof -i ":$PORT" 2>/dev/null || true
    fi
    exit 1
fi

success "Port $PORT is available"

# Save PID and start server
log "INFO" "Starting Uvicorn server on port $PORT"
info "Starting server..."

cd "$SCRIPT_DIR"

# Run Uvicorn with proper signal handling
trap 'log "INFO" "Shutting down server..."; kill $! 2>/dev/null || true' EXIT INT TERM

python -m uvicorn server:app --reload --port "$PORT" 2>&1 | tee -a "$LOG_FILE" &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

success "Server started with PID $SERVER_PID"
success "Listening on http://127.0.0.1:$PORT"
success "API documentation at http://127.0.0.1:$PORT/docs"
info "Logs available in: $LOG_FILE"

# Wait for server process
wait $SERVER_PID
