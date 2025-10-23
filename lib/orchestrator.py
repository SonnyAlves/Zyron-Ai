"""
Zyron Orchestrator - Multi-service orchestration engine
"""

import time
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from collections import defaultdict, deque

from .service import Service, ProcessService, DockerService, ServiceStatus
from .config_loader import ConfigLoader
from .health_checker import HealthChecker
from .docker_manager import DockerManager
from .logger import ServiceLogger


class Orchestrator:
    """Orchestrate multi-service startup, health checks, and shutdown"""

    def __init__(self, config_dir: Path, env: str = "dev", logger_dict: Optional[Dict] = None):
        self.config_dir = config_dir
        self.env = env
        self.services: Dict[str, Service] = {}
        self.services_config: Dict[str, Any] = {}
        self.logger_dict = logger_dict or {}
        self.docker_manager = DockerManager(self.logger_dict.get('orchestrator'))
        self.health_checker = HealthChecker(self.logger_dict.get('orchestrator'))

        # Load configuration
        self.config_loader = ConfigLoader(config_dir, env)
        self.config = self.config_loader.load_config()

        # Load services configuration
        self._load_services_config()

    def _load_services_config(self):
        """Load services from services.yaml"""
        try:
            self.services_config = self.config_loader.get_services_config()
            if self.logger_dict.get('orchestrator'):
                self.logger_dict['orchestrator'].info(f"Loaded {len(self.services_config)} services")
        except FileNotFoundError as e:
            if self.logger_dict.get('orchestrator'):
                self.logger_dict['orchestrator'].error(str(e))
            raise

    def _create_services(self, service_names: Optional[List[str]] = None):
        """Create service instances based on configuration"""

        # Determine which services to create
        services_to_create = service_names if service_names else list(self.services_config.keys())

        # Add dependencies
        services_to_create = self._resolve_dependencies(services_to_create)

        for service_name in services_to_create:
            if service_name not in self.services_config:
                if self.logger_dict.get('orchestrator'):
                    self.logger_dict['orchestrator'].warning(f"Service {service_name} not found in config")
                continue

            config = self.services_config[service_name]

            # Skip disabled services
            if not config.get('enabled', True):
                if self.logger_dict.get('orchestrator'):
                    self.logger_dict['orchestrator'].debug(f"Skipping disabled service: {service_name}")
                continue

            service_type = config.get('type', 'process')
            logger = self.logger_dict.get(service_name)

            try:
                if service_type == 'docker':
                    service = DockerService(service_name, config, logger, self.docker_manager.client)
                else:  # Default to process
                    service = ProcessService(service_name, config, logger)

                self.services[service_name] = service

                if logger:
                    logger.debug(f"Created {service_type} service")

            except Exception as e:
                if logger:
                    logger.error(f"Failed to create service: {str(e)}")

    def _resolve_dependencies(self, service_names: List[str]) -> List[str]:
        """Resolve dependencies recursively"""

        resolved = set()
        to_resolve = deque(service_names)

        while to_resolve:
            service_name = to_resolve.popleft()

            if service_name in resolved:
                continue

            if service_name not in self.services_config:
                continue

            # Add dependencies first
            dependencies = self.services_config[service_name].get('depends_on', [])
            for dep in dependencies:
                if dep not in resolved:
                    to_resolve.appendleft(dep)

            resolved.add(service_name)

        return list(resolved)

    def _get_startup_order(self) -> List[str]:
        """Get service startup order using topological sort"""

        # Build dependency graph
        graph = defaultdict(list)
        in_degree = defaultdict(int)

        for service_name in self.services.keys():
            if service_name not in in_degree:
                in_degree[service_name] = 0

            dependencies = self.services[service_name].get_dependencies()
            for dep in dependencies:
                if dep in self.services:
                    graph[dep].append(service_name)
                    in_degree[service_name] += 1

        # Topological sort (Kahn's algorithm)
        queue = deque([s for s in self.services.keys() if in_degree[s] == 0])
        sorted_services = []

        while queue:
            service = queue.popleft()
            sorted_services.append(service)

            for dependent in graph[service]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)

        # Check for cycles
        if len(sorted_services) != len(self.services):
            if self.logger_dict.get('orchestrator'):
                self.logger_dict['orchestrator'].warning("Circular dependency detected")

        return sorted_services

    def start(self, service_names: Optional[List[str]] = None, use_docker: bool = False) -> Tuple[bool, str]:
        """Start services in dependency order"""

        # Validate configuration
        is_valid, msg = self.config_loader.validate_config()
        if not is_valid:
            return False, msg

        # Create services
        self._create_services(service_names)

        # Get startup order
        startup_order = self._get_startup_order()

        if not startup_order:
            return False, "No services to start"

        if self.logger_dict.get('orchestrator'):
            self.logger_dict['orchestrator'].info(f"Starting services in order: {' -> '.join(startup_order)}")

        # Start services
        failed_services = []
        start_times = {}

        for service_name in startup_order:
            service = self.services.get(service_name)
            logger = self.logger_dict.get(service_name)

            if not service:
                continue

            start_time = time.time()

            # Start service
            if logger:
                logger.info(f"Starting {service.config.get('name', service_name)}")

            if not service.start():
                if logger:
                    logger.error(f"Failed to start {service_name}")

                if service.is_critical():
                    # Rollback on critical service failure
                    if self.logger_dict.get('orchestrator'):
                        self.logger_dict['orchestrator'].error(f"Critical service {service_name} failed. Rolling back.")
                    self._rollback_services(startup_order[:startup_order.index(service_name)])
                    return False, f"Critical service {service_name} failed to start"

                failed_services.append(service_name)
                continue

            # Wait for service to be healthy
            startup_timeout = service.get_startup_timeout()
            is_healthy = self._wait_for_health(service_name, startup_timeout)

            elapsed = time.time() - start_time
            start_times[service_name] = elapsed

            if not is_healthy:
                if logger:
                    logger.warning(f"Service {service_name} did not become healthy within {startup_timeout}s")

                if service.is_critical():
                    # Rollback on critical service health check failure
                    if self.logger_dict.get('orchestrator'):
                        self.logger_dict['orchestrator'].error(f"Critical service {service_name} not healthy. Rolling back.")
                    self._rollback_services(startup_order[:startup_order.index(service_name)])
                    return False, f"Critical service {service_name} failed health check"

                failed_services.append(service_name)

            if logger:
                logger.info(f"Started successfully in {elapsed:.2f}s")

        # Summary
        if self.logger_dict.get('orchestrator'):
            if failed_services:
                self.logger_dict['orchestrator'].warning(f"Started {len(startup_order) - len(failed_services)}/{len(startup_order)} services")
                self.logger_dict['orchestrator'].warning(f"Failed services: {', '.join(failed_services)}")
            else:
                total_time = sum(start_times.values())
                self.logger_dict['orchestrator'].info(f"All services started successfully in {total_time:.2f}s")

        return len(failed_services) == 0, "Orchestration complete"

    def stop(self, service_names: Optional[List[str]] = None) -> Tuple[bool, str]:
        """Stop services in reverse dependency order"""

        if not self.services:
            return True, "No services to stop"

        # Determine which services to stop
        if service_names:
            services_to_stop = service_names + self._get_dependents(service_names)
        else:
            services_to_stop = list(self.services.keys())

        # Get reverse startup order
        startup_order = self._get_startup_order()
        stop_order = [s for s in reversed(startup_order) if s in services_to_stop]

        if self.logger_dict.get('orchestrator'):
            self.logger_dict['orchestrator'].info(f"Stopping services in order: {' <- '.join(stop_order)}")

        # Stop services
        failed_services = []

        for service_name in stop_order:
            service = self.services.get(service_name)
            logger = self.logger_dict.get(service_name)

            if not service:
                continue

            if logger:
                logger.info(f"Stopping {service.config.get('name', service_name)}")

            if not service.stop():
                if logger:
                    logger.error(f"Failed to stop {service_name}")
                failed_services.append(service_name)
            else:
                if logger:
                    logger.info("Stopped successfully")

        # Clear services
        for service_name in services_to_stop:
            if service_name in self.services:
                del self.services[service_name]

        if self.logger_dict.get('orchestrator'):
            if failed_services:
                self.logger_dict['orchestrator'].warning(f"Stopped {len(stop_order) - len(failed_services)}/{len(stop_order)} services")
            else:
                self.logger_dict['orchestrator'].info(f"All services stopped successfully")

        return len(failed_services) == 0, "Orchestration complete"

    def restart(self, service_names: List[str]) -> Tuple[bool, str]:
        """Restart specific services"""

        # Stop services
        success, msg = self.stop(service_names)
        if not success:
            return False, f"Failed to stop services: {msg}"

        time.sleep(2)  # Wait before restarting

        # Start services
        return self.start(service_names)

    def get_status(self) -> Dict[str, ServiceStatus]:
        """Get status of all services"""

        statuses = {}
        for service_name, service in self.services.items():
            statuses[service_name] = service.get_status()
            # Save status to file
            service.save_status(statuses[service_name])

        return statuses

    def health_check(self) -> Tuple[bool, Dict[str, Any]]:
        """Perform health checks on all services"""

        results = self.health_checker.check_all_services_sync(self.services_config)

        all_healthy = all(result.healthy for result in results)

        result_dict = {
            result.service: {
                'healthy': result.healthy,
                'message': result.message,
                'response_time': result.response_time,
                'details': result.details
            }
            for result in results
        }

        return all_healthy, result_dict

    def _wait_for_health(self, service_name: str, timeout: int) -> bool:
        """Wait for a service to become healthy"""

        service_config = self.services_config.get(service_name, {})
        health_check_config = service_config.get('health_check')

        if not health_check_config:
            return True  # No health check defined, assume healthy

        start_time = time.time()

        while time.time() - start_time < timeout:
            result = self.health_checker.check_service(
                service_name,
                service_config
            )

            # Convert to sync (for now)
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    self.health_checker.check_service(service_name, service_config)
                )
            finally:
                loop.close()

            if result.healthy:
                return True

            time.sleep(1)

        return False

    def _rollback_services(self, started_services: List[str]):
        """Rollback (stop) services in reverse order"""

        if self.logger_dict.get('orchestrator'):
            self.logger_dict['orchestrator'].warning(f"Rolling back {len(started_services)} services")

        for service_name in reversed(started_services):
            service = self.services.get(service_name)
            logger = self.logger_dict.get(service_name)

            if service:
                if logger:
                    logger.info("Rolling back...")
                service.stop()

    def _get_dependents(self, service_names: List[str]) -> List[str]:
        """Get services that depend on the given services"""

        dependents = set()

        for service_name, service in self.services.items():
            dependencies = service.get_dependencies()
            for dep in dependencies:
                if dep in service_names:
                    dependents.add(service_name)
                    # Recursively find dependents of dependents
                    dependents.update(self._get_dependents([service_name]))
                    break

        return list(dependents)
