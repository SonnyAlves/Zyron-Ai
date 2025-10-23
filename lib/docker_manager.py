"""
Zyron Docker Manager - Docker container lifecycle management
"""

from typing import Dict, Any, Optional
import time


class DockerManager:
    """Manage Docker containers for services"""

    def __init__(self, logger=None):
        self.logger = logger
        self.client = None
        self._init_docker_client()

    def _init_docker_client(self):
        """Initialize Docker client"""
        try:
            import docker
            self.client = docker.from_env()
            # Test connection
            self.client.ping()
            if self.logger:
                self.logger.info("Docker client initialized successfully")
        except ImportError:
            if self.logger:
                self.logger.warning("Docker Python SDK not installed. Install with: pip install docker")
        except Exception as e:
            if self.logger:
                self.logger.warning(f"Could not connect to Docker: {str(e)}")

    def is_available(self) -> bool:
        """Check if Docker is available"""
        return self.client is not None

    def start_container(self, config: Dict[str, Any]) -> bool:
        """Start a Docker container"""

        if not self.is_available():
            if self.logger:
                self.logger.error("Docker is not available")
            return False

        try:
            container_name = config.get('container_name', f"zyron_{config.get('name', 'unknown')}")
            image = config.get('image', '')

            if not image:
                if self.logger:
                    self.logger.error(f"No image specified for container {container_name}")
                return False

            if self.logger:
                self.logger.info(f"Starting Docker container: {container_name} ({image})")

            # Check if container already exists
            try:
                container = self.client.containers.get(container_name)
                if container.status == "running":
                    if self.logger:
                        self.logger.info(f"Container {container_name} already running")
                    return True
                else:
                    container.start()
                    if self.logger:
                        self.logger.info(f"Container {container_name} restarted")
                    return True
            except:
                pass

            # Create and start container
            ports = {}
            if config.get('port'):
                ports = {f"{config.get('port')}/tcp": config.get('port')}

            environment = config.get('environment', {})

            volumes = {}
            for vol in config.get('volumes', []):
                if isinstance(vol, str):
                    parts = vol.split(':')
                    if len(parts) == 2:
                        host_path, container_path = parts
                        volumes[host_path] = {'bind': container_path, 'mode': 'rw'}

            container = self.client.containers.run(
                image,
                name=container_name,
                ports=ports if ports else None,
                environment=environment,
                volumes=volumes if volumes else None,
                detach=True,
                remove=False,
                command=config.get('command')
            )

            if self.logger:
                self.logger.info(f"Container {container_name} started (ID: {container.short_id})")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to start container: {str(e)}")
            return False

    def stop_container(self, container_name: str, force: bool = False) -> bool:
        """Stop a Docker container"""

        if not self.is_available():
            if self.logger:
                self.logger.error("Docker is not available")
            return False

        try:
            container = self.client.containers.get(container_name)

            if container.status == "running":
                if self.logger:
                    self.logger.info(f"Stopping container {container_name}")

                if force:
                    container.kill()
                    if self.logger:
                        self.logger.info(f"Container {container_name} force stopped")
                else:
                    container.stop(timeout=10)
                    if self.logger:
                        self.logger.info(f"Container {container_name} stopped")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Error stopping container {container_name}: {str(e)}")
            return False

    def get_container_status(self, container_name: str) -> Optional[str]:
        """Get container status (running, stopped, etc)"""

        if not self.is_available():
            return None

        try:
            container = self.client.containers.get(container_name)
            container.reload()
            return container.status
        except:
            return None

    def get_logs(self, container_name: str, tail: int = 100) -> str:
        """Get container logs"""

        if not self.is_available():
            return ""

        try:
            container = self.client.containers.get(container_name)
            logs = container.logs(tail=tail, decode=True)
            return logs
        except:
            return ""

    def container_exists(self, container_name: str) -> bool:
        """Check if container exists"""

        if not self.is_available():
            return False

        try:
            self.client.containers.get(container_name)
            return True
        except:
            return False

    def pull_image(self, image: str) -> bool:
        """Pull Docker image"""

        if not self.is_available():
            if self.logger:
                self.logger.error("Docker is not available")
            return False

        try:
            if self.logger:
                self.logger.info(f"Pulling Docker image: {image}")

            self.client.images.pull(image)

            if self.logger:
                self.logger.info(f"Image {image} pulled successfully")

            return True

        except Exception as e:
            if self.logger:
                self.logger.error(f"Failed to pull image {image}: {str(e)}")
            return False

    def cleanup(self, container_name: str, remove: bool = False) -> bool:
        """Cleanup container"""

        if not self.is_available():
            return False

        try:
            container = self.client.containers.get(container_name)

            # Stop if running
            if container.status == "running":
                self.stop_container(container_name)

            # Remove if requested
            if remove:
                container.remove()
                if self.logger:
                    self.logger.info(f"Container {container_name} removed")

            return True

        except:
            return False
