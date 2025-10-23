"""
Zyron Logger - Colored logging system for multi-service orchestration
"""

import logging
import sys
from datetime import datetime
from typing import Optional
from pathlib import Path

# ANSI Color codes
class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Foreground colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

    # Service colors
    BACKEND = BLUE
    FRONTEND = CYAN
    DATABASE = GREEN
    REDIS = YELLOW
    VISUAL_BRAIN = MAGENTA
    SYSTEM = WHITE


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors and service names"""

    SERVICE_COLORS = {
        'backend': Colors.BACKEND,
        'frontend': Colors.FRONTEND,
        'database': Colors.DATABASE,
        'postgres': Colors.DATABASE,
        'redis': Colors.REDIS,
        'visual-brain': Colors.VISUAL_BRAIN,
        'system': Colors.SYSTEM,
    }

    LEVEL_COLORS = {
        'DEBUG': Colors.DIM,
        'INFO': Colors.GREEN,
        'WARNING': Colors.YELLOW,
        'ERROR': Colors.RED,
        'CRITICAL': Colors.RED + Colors.BOLD,
    }

    def format(self, record):
        # Get service color
        service = getattr(record, 'service', 'system').lower()
        service_color = self.SERVICE_COLORS.get(service, Colors.WHITE)

        # Get level color
        level = record.levelname
        level_color = self.LEVEL_COLORS.get(level, Colors.WHITE)

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

        # Build colored message
        message = (
            f"{Colors.DIM}[{timestamp}]{Colors.RESET} "
            f"{service_color}[{service.upper():12}]{Colors.RESET} "
            f"{level_color}[{level:8}]{Colors.RESET} "
            f"{record.getMessage()}"
        )

        return message


class ServiceLogger:
    """Logger for a specific service"""

    def __init__(self, service_name: str, log_file: Optional[Path] = None):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(logging.DEBUG)
        self.log_file = log_file

        # Remove existing handlers
        self.logger.handlers.clear()

        # Console handler with colors
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_formatter = ColoredFormatter()
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)

        # File handler (if log_file provided)
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)
            file_formatter = logging.Formatter(
                '[%(asctime)s.%(msecs)03d] [%(levelname)s] %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)

    def debug(self, message: str):
        """Log debug message"""
        self.logger.debug(message, extra={'service': self.service_name})

    def info(self, message: str):
        """Log info message"""
        self.logger.info(message, extra={'service': self.service_name})

    def warning(self, message: str):
        """Log warning message"""
        self.logger.warning(message, extra={'service': self.service_name})

    def error(self, message: str):
        """Log error message"""
        self.logger.error(message, extra={'service': self.service_name})

    def critical(self, message: str):
        """Log critical message"""
        self.logger.critical(message, extra={'service': self.service_name})


def setup_logging(log_dir: Path) -> dict:
    """Setup logging for all services"""
    log_dir.mkdir(parents=True, exist_ok=True)

    loggers = {
        'system': ServiceLogger('system'),
        'backend': ServiceLogger('backend', log_dir / 'backend.log'),
        'frontend': ServiceLogger('frontend', log_dir / 'frontend.log'),
        'database': ServiceLogger('database', log_dir / 'database.log'),
        'redis': ServiceLogger('redis', log_dir / 'redis.log'),
        'visual-brain': ServiceLogger('visual-brain', log_dir / 'visual-brain.log'),
        'orchestrator': ServiceLogger('orchestrator', log_dir / 'orchestrator.log'),
    }

    return loggers


def print_header(text: str, color: str = Colors.BLUE):
    """Print a formatted header"""
    print(f"\n{color}{'='*60}{Colors.RESET}")
    print(f"{color}{text:^60}{Colors.RESET}")
    print(f"{color}{'='*60}{Colors.RESET}\n")


def print_status(service: str, status: str, color: str):
    """Print service status"""
    status_symbol = {
        'running': f"{Colors.GREEN}✅{Colors.RESET}",
        'stopped': f"{Colors.RED}⚫{Colors.RESET}",
        'failed': f"{Colors.RED}✗{Colors.RESET}",
        'starting': f"{Colors.YELLOW}🟡{Colors.RESET}",
        'stopping': f"{Colors.YELLOW}⏹️{Colors.RESET}",
        'disabled': f"{Colors.DIM}⚪{Colors.RESET}",
    }.get(status, f"{Colors.DIM}?{Colors.RESET}")

    print(f"{status_symbol} {color}{service:20}{Colors.RESET} | {status}")
