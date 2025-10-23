"""
Zyron Health Checker - Health check system for services
"""

import urllib.request
import urllib.error
import subprocess
import asyncio
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass


@dataclass
class HealthCheckResult:
    """Health check result"""
    service: str
    healthy: bool
    message: str
    response_time: float = 0.0
    details: Optional[Dict[str, Any]] = None


class HealthChecker:
    """Health check coordinator for services"""

    def __init__(self, logger=None):
        self.logger = logger

    async def check_service(self, service_name: str, config: Dict[str, Any]) -> HealthCheckResult:
        """Check health of a single service"""

        health_check_config = config.get('health_check', {})

        if not health_check_config:
            return HealthCheckResult(
                service=service_name,
                healthy=True,
                message="No health check defined"
            )

        check_type = health_check_config.get('type', 'http')

        if check_type == 'http':
            return await self._check_http(service_name, health_check_config)
        elif check_type == 'command':
            return await self._check_command(service_name, health_check_config)
        else:
            return HealthCheckResult(
                service=service_name,
                healthy=False,
                message=f"Unknown health check type: {check_type}"
            )

    async def _check_http(self, service_name: str, config: Dict[str, Any]) -> HealthCheckResult:
        """Check health via HTTP endpoint"""

        url = config.get('url', '')
        timeout = config.get('timeout', 5)
        retries = config.get('retries', 3)
        interval = config.get('interval', 1)

        if not url:
            return HealthCheckResult(
                service=service_name,
                healthy=False,
                message="No URL configured for HTTP health check"
            )

        for attempt in range(retries):
            start_time = time.time()

            try:
                req = urllib.request.Request(url, method='GET')
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    response_time = time.time() - start_time

                    if 200 <= response.status < 300:
                        return HealthCheckResult(
                            service=service_name,
                            healthy=True,
                            message=f"HTTP {response.status}",
                            response_time=response_time
                        )
                    else:
                        return HealthCheckResult(
                            service=service_name,
                            healthy=False,
                            message=f"HTTP {response.status}",
                            response_time=response_time
                        )

            except urllib.error.URLError as e:
                response_time = time.time() - start_time
                error_msg = str(e.reason) if hasattr(e, 'reason') else str(e)

                if attempt < retries - 1:
                    if self.logger:
                        self.logger.debug(f"Health check failed for {service_name}, retrying... ({attempt + 1}/{retries})")
                    await asyncio.sleep(interval)
                else:
                    return HealthCheckResult(
                        service=service_name,
                        healthy=False,
                        message=error_msg,
                        response_time=response_time
                    )

            except Exception as e:
                response_time = time.time() - start_time
                return HealthCheckResult(
                    service=service_name,
                    healthy=False,
                    message=str(e),
                    response_time=response_time
                )

        return HealthCheckResult(
            service=service_name,
            healthy=False,
            message="Health check failed after all retries"
        )

    async def _check_command(self, service_name: str, config: Dict[str, Any]) -> HealthCheckResult:
        """Check health via command execution"""

        command = config.get('command', '')
        timeout = config.get('timeout', 5)
        retries = config.get('retries', 3)
        interval = config.get('interval', 1)

        if not command:
            return HealthCheckResult(
                service=service_name,
                healthy=False,
                message="No command configured for command health check"
            )

        for attempt in range(retries):
            start_time = time.time()

            try:
                result = subprocess.run(
                    command,
                    shell=True,
                    timeout=timeout,
                    capture_output=True,
                    text=True
                )
                response_time = time.time() - start_time

                if result.returncode == 0:
                    return HealthCheckResult(
                        service=service_name,
                        healthy=True,
                        message="Command succeeded",
                        response_time=response_time
                    )
                else:
                    if attempt < retries - 1:
                        if self.logger:
                            self.logger.debug(f"Health check failed for {service_name}, retrying... ({attempt + 1}/{retries})")
                        await asyncio.sleep(interval)
                    else:
                        return HealthCheckResult(
                            service=service_name,
                            healthy=False,
                            message=f"Command failed: {result.stderr}",
                            response_time=response_time
                        )

            except subprocess.TimeoutExpired:
                response_time = time.time() - start_time
                return HealthCheckResult(
                    service=service_name,
                    healthy=False,
                    message="Command timeout",
                    response_time=response_time
                )

            except Exception as e:
                response_time = time.time() - start_time
                return HealthCheckResult(
                    service=service_name,
                    healthy=False,
                    message=str(e),
                    response_time=response_time
                )

        return HealthCheckResult(
            service=service_name,
            healthy=False,
            message="Health check failed after all retries"
        )

    async def check_all_services(self, services: Dict[str, Dict[str, Any]]) -> List[HealthCheckResult]:
        """Check health of all services in parallel"""

        tasks = []
        for service_name, config in services.items():
            if config.get('enabled', True):
                tasks.append(self.check_service(service_name, config))

        results = await asyncio.gather(*tasks)
        return results

    def check_all_services_sync(self, services: Dict[str, Dict[str, Any]]) -> List[HealthCheckResult]:
        """Synchronously check health of all services"""

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.check_all_services(services))
        finally:
            loop.close()
