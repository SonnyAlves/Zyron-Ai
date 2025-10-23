#!/usr/bin/env python3
"""
Zyron-Ai Backend Server Manager
Advanced server lifecycle management with port handling and logging
"""

import os
import sys
import signal
import socket
import subprocess
import time
import json
import logging
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime

# Setup logging
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "backend.log"
PID_FILE = LOG_DIR / "backend.pid"
STATUS_FILE = LOG_DIR / "backend_status.json"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def colored(text: str, color: str) -> str:
    """Add color to terminal output"""
    return f"{color}{text}{Colors.NC}"

def is_port_available(port: int) -> bool:
    """Check if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            return result != 0
    except Exception as e:
        logger.error(f"Error checking port {port}: {e}")
        return False

def get_process_on_port(port: int) -> Optional[int]:
    """Get PID of process using a specific port"""
    try:
        # Try using lsof (macOS/Linux)
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            pids = result.stdout.strip().split('\n')
            return int(pids[0]) if pids and pids[0] else None
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        pass

    # Try using netstat
    try:
        result = subprocess.run(
            ['netstat', '-tln'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if f':{port}' in result.stdout:
            return True  # Port is in use but we can't get PID
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    return None

def kill_process_on_port(port: int, force: bool = False) -> bool:
    """Kill process occupying a port"""
    pid = get_process_on_port(port)
    if not pid:
        logger.warning(f"No process found on port {port}")
        return True

    if pid is True:  # Port in use but no PID available
        logger.error(f"Port {port} is in use but cannot identify process")
        return False

    signal_type = signal.SIGKILL if force else signal.SIGTERM
    signal_name = "SIGKILL" if force else "SIGTERM"

    logger.info(f"Sending {signal_name} to process {pid}")

    try:
        os.kill(pid, signal_type)
        logger.info(f"Successfully sent {signal_name} to PID {pid}")

        if not force:
            # Wait for graceful shutdown
            for i in range(10):
                time.sleep(1)
                if is_port_available(port):
                    logger.info(f"Process {pid} terminated gracefully")
                    return True

            logger.warning(f"Graceful shutdown timeout for PID {pid}, force killing...")
            return kill_process_on_port(port, force=True)

        return True

    except ProcessLookupError:
        logger.info(f"Process {pid} already terminated")
        return True
    except Exception as e:
        logger.error(f"Error killing process {pid}: {e}")
        return False

def find_available_port(start_port: int, max_attempts: int = 10) -> int:
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    raise RuntimeError(f"No available ports found in range {start_port}-{start_port + max_attempts}")

def save_status(port: int, pid: int, status: str = "running"):
    """Save server status to JSON file"""
    status_data = {
        "status": status,
        "port": port,
        "pid": pid,
        "timestamp": datetime.now().isoformat(),
        "log_file": str(LOG_FILE)
    }
    with open(STATUS_FILE, 'w') as f:
        json.dump(status_data, f, indent=2)
    logger.info(f"Status saved: {status_data}")

def start_server(port: int = 8000, force_kill: bool = False) -> int:
    """Start the Uvicorn server"""
    backend_dir = Path(__file__).parent
    project_root = backend_dir.parent

    # Check venv
    venv_python = backend_dir / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / "python"
    if not venv_python.exists():
        raise RuntimeError(f"Virtual environment not found at {backend_dir}/.venv")

    logger.info(f"Starting Zyron-Ai backend server on port {port}")
    logger.info(f"Force kill: {force_kill}")

    # Check and handle port
    if not is_port_available(port):
        logger.warning(f"Port {port} is in use")

        if not kill_process_on_port(port, force=force_kill):
            logger.info("Attempting to find alternative port...")
            try:
                port = find_available_port(port)
                logger.warning(colored(f"Using alternative port {port}", Colors.YELLOW))
            except RuntimeError as e:
                logger.error(str(e))
                return 1

    # Start server
    os.chdir(backend_dir)
    cmd = [
        str(venv_python),
        "-m", "uvicorn",
        "server:app",
        "--reload",
        f"--port", str(port),
        "--log-level", "info"
    ]

    logger.info(f"Command: {' '.join(cmd)}")
    logger.info(colored(f"Server available at http://127.0.0.1:{port}", Colors.GREEN))
    logger.info(colored(f"API docs at http://127.0.0.1:{port}/docs", Colors.GREEN))
    logger.info(f"Logs: {LOG_FILE}")

    try:
        # Handle signals
        def handle_signal(signum, frame):
            logger.info(f"Received signal {signum}, shutting down...")
            raise KeyboardInterrupt

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        # Start process
        process = subprocess.Popen(cmd)
        save_status(port, process.pid, "running")

        # Wait for process
        process.wait()

    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        save_status(port, -1, "stopped")
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        save_status(port, -1, "error")
        return 1

    return 0

def stop_server(force: bool = False):
    """Stop the running server"""
    if not STATUS_FILE.exists():
        logger.warning("No server status file found")
        return

    try:
        with open(STATUS_FILE, 'r') as f:
            status_data = json.load(f)

        pid = status_data.get('pid')
        port = status_data.get('port')

        if pid and pid > 0:
            logger.info(f"Stopping server (PID {pid})...")
            os.kill(pid, signal.SIGKILL if force else signal.SIGTERM)
            logger.info(colored("Server stopped", Colors.GREEN))

        if port:
            kill_process_on_port(port, force=force)

        save_status(port or 8000, -1, "stopped")

    except Exception as e:
        logger.error(f"Error stopping server: {e}")

def get_status():
    """Get server status"""
    if not STATUS_FILE.exists():
        print(colored("No server running", Colors.YELLOW))
        return

    try:
        with open(STATUS_FILE, 'r') as f:
            status_data = json.load(f)

        print(colored("\n=== Backend Server Status ===", Colors.BLUE))
        print(f"Status: {colored(status_data.get('status', 'unknown'), Colors.GREEN)}")
        print(f"Port: {status_data.get('port', 'unknown')}")
        print(f"PID: {status_data.get('pid', 'unknown')}")
        print(f"Timestamp: {status_data.get('timestamp', 'unknown')}")
        print(f"Log file: {status_data.get('log_file', 'unknown')}")
        print()

    except Exception as e:
        logger.error(f"Error reading status: {e}")

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Zyron-Ai Backend Server Manager"
    )
    parser.add_argument(
        'action',
        nargs='?',
        default='start',
        choices=['start', 'stop', 'restart', 'status', 'kill'],
        help='Action to perform'
    )
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=8000,
        help='Port to run server on (default: 8000)'
    )
    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='Force kill any process on the port'
    )

    args = parser.parse_args()

    try:
        if args.action == 'start':
            return start_server(args.port, args.force)
        elif args.action == 'stop':
            stop_server(args.force)
            return 0
        elif args.action == 'restart':
            logger.info("Restarting server...")
            stop_server()
            time.sleep(2)
            return start_server(args.port, args.force)
        elif args.action == 'status':
            get_status()
            return 0
        elif args.action == 'kill':
            if kill_process_on_port(args.port, force=True):
                logger.info(colored(f"Successfully killed process on port {args.port}", Colors.GREEN))
                return 0
            else:
                logger.error(f"Failed to kill process on port {args.port}")
                return 1

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        return 1

if __name__ == '__main__':
    sys.exit(main())
