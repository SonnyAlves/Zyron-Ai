"""
Zyron Service - Service abstraction for orchestration
"""

import subprocess
import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass
import time


@dataclass
class ServiceStatus:
    """Service status information"""
    name: str
    status: str  # 'running', 'stopped', 'failed', 'starting'
    port: Optional[int] = None
    pid: Optional[int] = None
    uptime: Optional[float] = None
    error: Optional[str] = None
    healthy: Optional[bool] = None
    timestamp: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'status': self.status,
            'port': self.port,
            'pid': self.pid,
            'uptime': self.uptime,
            'error': self.error,
            'healthy': self.healthy,
            'timestamp': self.timestamp,
        }

    def to_json(self) -> str:
        """Convert to JSON"""
        return json.dumps(self.to_dict(), indent=2)


class Service(ABC):
    """Abstract base class for services"""

    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.process = None
        self.start_time = None
        self.status_file = Path(f"logs/{name}_status.json")

    @abstractmethod
    def start(self) -> bool:
        """Start the service"""
        pass

    @abstractmethod
    def stop(self) -> bool:
        """Stop the service"""
        pass

    @abstractmethod
    def get_status(self) -> ServiceStatus:
        """Get service status"""
        pass

    def save_status(self, status: ServiceStatus):
        """Save status to JSON file"""
        self.status_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.status_file, 'w') as f:
            f.write(status.to_json())

    def is_enabled(self) -> bool:
        """Check if service is enabled"""
        return self.config.get('enabled', True)

    def is_critical(self) -> bool:
        """Check if service is critical (fail whole setup if it fails)"""
        return self.config.get('critical', False)

    def get_dependencies(self) -> list:
        """Get list of service names this service depends on"""
        return self.config.get('depends_on', [])

    def get_startup_timeout(self) -> int:
        """Get startup timeout in seconds"""
        return self.config.get('startup_timeout', 30)


class ProcessService(Service):
    """Service that runs as a local process (Python/Node)"""

    def __init__(self, name: str, config: Dict[str, Any], logger=None):
        super().__init__(name, config)
        self.logger = logger
        self.directory = Path(config.get('directory', '.'))
        self.command = config.get('command', '')

    def start(self) -> bool:
        """Start the service process"""
        if not self.command:
            if self.logger:
                self.logger.error(f"No command defined for service {self.name}")
            return False

        try:
            if self.logger:
                self.logger.info(f"Starting {self.name}: {self.command}")

            self.process = subprocess.Popen(
                self.command,
                shell=True,
                cwd=self.directory,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                text=True
            )
            self.start_time = time.time()

            if self.logger:
                self.logger.info(f"Process started with PID {self.process.pid}")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to start {self.name}: {str(e)}")
            return False

    def stop(self) -> bool:
        """Stop the service process"""
        if not self.process:
            return True

        try:
            if self.logger:
                self.logger.info(f"Stopping {self.name}")

            # Try graceful shutdown first
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
                if self.logger:
                    self.logger.info(f"{self.name} stopped gracefully")
            except subprocess.TimeoutExpired:
                # Force kill if graceful shutdown fails
                if self.logger:
                    self.logger.warning(f"Force killing {self.name}")
                self.process.kill()
                self.process.wait()

            self.process = None
            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error stopping {self.name}: {str(e)}")
            return False

    def get_status(self) -> ServiceStatus:
        """Get process service status"""
        status = "stopped"
        pid = None
        uptime = None
        error = None

        if self.process:
            if self.process.poll() is None:
                status = "running"
                pid = self.process.pid
                if self.start_time:
                    uptime = time.time() - self.start_time
            else:
                status = "failed"
                error = "Process exited"

        return ServiceStatus(
            name=self.name,
            status=status,
            port=self.config.get('port'),
            pid=pid,
            uptime=uptime,
            error=error,
            timestamp=time.time()
        )


class DockerService(Service):
    """Service that runs in a Docker container"""

    def __init__(self, name: str, config: Dict[str, Any], logger=None, docker_client=None):
        super().__init__(name, config)
        self.logger = logger
        self.docker_client = docker_client
        self.container = None
        self.container_name = config.get('container_name', f"zyron_{name}")
        self.image = config.get('image', '')

    def start(self) -> bool:
        """Start the Docker service"""
        if not self.docker_client:
            if self.logger:
                self.logger.error("Docker client not available")
            return False

        try:
            if self.logger:
                self.logger.info(f"Starting Docker service {self.name}: {self.image}")

            # Check if container already exists
            try:
                self.container = self.docker_client.containers.get(self.container_name)
                if self.container.status == "running":
                    if self.logger:
                        self.logger.info(f"Container {self.container_name} already running")
                    return True
                else:
                    self.container.start()
                    if self.logger:
                        self.logger.info(f"Container {self.container_name} restarted")
                    return True
            except:
                # Container doesn't exist, create and start it
                pass

            # Create and start container
            self.container = self.docker_client.containers.run(
                self.image,
                name=self.container_name,
                ports={f"{self.config.get('port')}/tcp": self.config.get('port')} if self.config.get('port') else None,
                environment=self.config.get('environment', {}),
                volumes=self._parse_volumes(),
                detach=True,
                remove=False
            )

            self.start_time = time.time()

            if self.logger:
                self.logger.info(f"Container {self.container_name} started with ID {self.container.short_id}")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to start Docker service {self.name}: {str(e)}")
            return False

    def stop(self) -> bool:
        """Stop the Docker service"""
        if not self.container:
            return True

        try:
            if self.logger:
                self.logger.info(f"Stopping Docker service {self.name}")

            self.container.stop(timeout=10)

            if self.logger:
                self.logger.info(f"Container {self.container_name} stopped")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error stopping Docker service {self.name}: {str(e)}")
            return False

    def get_status(self) -> ServiceStatus:
        """Get Docker service status"""
        status = "stopped"
        pid = None
        uptime = None
        error = None

        if self.container:
            try:
                self.container.reload()
                status = self.container.status
                if status == "running":
                    pid = self.container.id[:12]
                    if self.start_time:
                        uptime = time.time() - self.start_time
            except:
                status = "failed"
                error = "Container not found"

        return ServiceStatus(
            name=self.name,
            status=status,
            port=self.config.get('port'),
            pid=pid,
            uptime=uptime,
            error=error,
            timestamp=time.time()
        )

    def _parse_volumes(self) -> Dict[str, Dict[str, str]]:
        """Parse volume configuration"""
        volumes = {}
        for vol in self.config.get('volumes', []):
            if isinstance(vol, str):
                # Format: "host_path:container_path"
                parts = vol.split(':')
                if len(parts) == 2:
                    host_path, container_path = parts
                    volumes[host_path] = {'bind': container_path, 'mode': 'rw'}
        return volumes
