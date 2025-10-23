#!/usr/bin/env python
"""
Zyron AI - Multi-Service Orchestrator CLI
Phase 2: Advanced orchestration with Docker support

Usage:
  python dev-orchestrator.py start                  # Start all services
  python dev-orchestrator.py start backend          # Start backend + deps
  python dev-orchestrator.py stop                   # Stop all services
  python dev-orchestrator.py status                 # Show status
  python dev-orchestrator.py health                 # Health check
  python dev-orchestrator.py logs                   # Show logs
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path for lib imports
sys.path.insert(0, str(Path(__file__).parent))

from lib.orchestrator import Orchestrator
from lib.logger import setup_logging, print_header, Colors
from lib.config_loader import ConfigLoader


def cmd_start(args, orchestrator):
    """Start services"""
    print_header(f"Starting Zyron Services (env: {args.env})", Colors.BLUE)

    service_names = args.services if args.services else None
    success, msg = orchestrator.start(service_names, use_docker=args.docker)

    if success:
        print(f"\n{Colors.GREEN}✅ All services started successfully{Colors.RESET}\n")
        cmd_status(args, orchestrator)
    else:
        print(f"\n{Colors.RED}❌ Failed to start services: {msg}{Colors.RESET}\n")
        return 1

    return 0


def cmd_stop(args, orchestrator):
    """Stop services"""
    print_header("Stopping Services", Colors.BLUE)

    service_names = args.services if args.services else None
    success, msg = orchestrator.stop(service_names)

    if success:
        print(f"\n{Colors.GREEN}✅ All services stopped successfully{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}❌ Failed to stop services: {msg}{Colors.RESET}\n")
        return 1

    return 0


def cmd_restart(args, orchestrator):
    """Restart services"""
    if not args.services:
        print(f"{Colors.RED}Error: Please specify services to restart{Colors.RESET}")
        return 1

    print_header("Restarting Services", Colors.BLUE)
    success, msg = orchestrator.restart(args.services)

    if success:
        print(f"\n{Colors.GREEN}✅ Services restarted successfully{Colors.RESET}\n")
        cmd_status(args, orchestrator)
    else:
        print(f"\n{Colors.RED}❌ Failed to restart services: {msg}{Colors.RESET}\n")
        return 1

    return 0


def cmd_status(args, orchestrator):
    """Show service status"""
    print_header("Service Status", Colors.BLUE)

    statuses = orchestrator.get_status()

    for service_name, status in statuses.items():
        status_str = f"{Colors.GREEN}✅{Colors.RESET}" if status.status == "running" else f"{Colors.RED}⚫{Colors.RESET}"
        uptime_str = f" ({status.uptime:.0f}s)" if status.uptime else ""
        print(f"{status_str} {service_name:20} | {status.status:10} | Port {status.port}{uptime_str}")

    print()
    return 0


def cmd_health(args, orchestrator):
    """Check service health"""
    print_header("Health Check", Colors.BLUE)

    all_healthy, results = orchestrator.health_check()

    for service, result in results.items():
        healthy_str = f"{Colors.GREEN}✅{Colors.RESET}" if result['healthy'] else f"{Colors.RED}❌{Colors.RESET}"
        response_time = f" ({result['response_time']*1000:.0f}ms)" if result['response_time'] else ""
        print(f"{healthy_str} {service:20} | {result['message']}{response_time}")

    print()

    if all_healthy:
        print(f"{Colors.GREEN}✅ All services are healthy{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠️  Some services are not healthy{Colors.RESET}\n")
        return 1


def cmd_logs(args, orchestrator):
    """Show service logs"""
    print_header("Service Logs", Colors.BLUE)
    print(f"{Colors.DIM}Logs directory: logs/{Colors.RESET}\n")

    import os
    logs_dir = Path("logs")
    if logs_dir.exists():
        for log_file in sorted(logs_dir.glob("*.log")):
            print(f"{Colors.CYAN}{log_file.name}{Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}No logs directory found{Colors.RESET}")

    print()
    return 0


def cmd_config(args, orchestrator):
    """Show configuration"""
    print_header("Configuration", Colors.BLUE)

    config = orchestrator.config
    print(f"Environment: {Colors.GREEN}{config.get('environment')}{Colors.RESET}")
    print(f"Debug: {config.get('debug')}")
    print(f"Backend Port: {config.get('backend', {}).get('port')}")
    print()
    return 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Zyron AI - Multi-Service Orchestrator"
    )

    parser.add_argument(
        "command",
        choices=["start", "stop", "restart", "status", "health", "logs", "config"],
        help="Command to execute"
    )

    parser.add_argument(
        "services",
        nargs="*",
        help="Services to operate on (optional)"
    )

    parser.add_argument(
        "--env",
        choices=["dev", "staging", "prod"],
        default="dev",
        help="Environment to use"
    )

    parser.add_argument(
        "--docker",
        action="store_true",
        help="Enable Docker services (PostgreSQL, Redis)"
    )

    args = parser.parse_args()

    # Setup logging
    loggers = setup_logging(Path("logs"))

    # Create orchestrator
    try:
        orchestrator = Orchestrator(Path("config"), args.env, loggers)
    except Exception as e:
        print(f"{Colors.RED}Error initializing orchestrator: {str(e)}{Colors.RESET}")
        return 1

    # Execute command
    commands = {
        "start": cmd_start,
        "stop": cmd_stop,
        "restart": cmd_restart,
        "status": cmd_status,
        "health": cmd_health,
        "logs": cmd_logs,
        "config": cmd_config,
    }

    try:
        return commands[args.command](args, orchestrator)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted by user{Colors.RESET}")
        return 1
    except Exception as e:
        print(f"{Colors.RED}Error: {str(e)}{Colors.RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
