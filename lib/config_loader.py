"""
Zyron Config Loader - Load and merge YAML configurations
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ServiceConfig:
    """Configuration for a service"""
    name: str
    command: Optional[str] = None
    port: Optional[int] = None
    depends_on: list = None
    enabled: bool = True
    critical: bool = False
    startup_timeout: int = 30
    health_check: Optional[Dict[str, Any]] = None
    environment: Optional[Dict[str, str]] = None

    def __post_init__(self):
        if self.depends_on is None:
            self.depends_on = []
        if self.environment is None:
            self.environment = {}


class ConfigLoader:
    """Load and merge YAML configurations with environment variable substitution"""

    def __init__(self, config_dir: Path = None, env: str = "dev"):
        self.config_dir = config_dir or Path(__file__).parent.parent / "config"
        self.env = env
        self.config = {}

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML files with environment override"""

        # Load base configuration
        base_file = self.config_dir / "base.yaml"
        if base_file.exists():
            with open(base_file) as f:
                self.config = yaml.safe_load(f) or {}

        # Load environment-specific configuration
        env_file = self.config_dir / f"zyron.{self.env}.yaml"
        if env_file.exists():
            with open(env_file) as f:
                env_config = yaml.safe_load(f) or {}
            self.config = self._deep_merge(self.config, env_config)
        else:
            raise FileNotFoundError(f"Configuration file not found: {env_file}")

        # Replace environment variables
        self.config = self._replace_env_vars(self.config)

        return self.config

    @staticmethod
    def _deep_merge(base: Dict, override: Dict) -> Dict:
        """Deep merge two dictionaries (override takes precedence)"""
        result = base.copy()

        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = ConfigLoader._deep_merge(result[key], value)
            else:
                result[key] = value

        return result

    @staticmethod
    def _replace_env_vars(obj: Any) -> Any:
        """Recursively replace ${VAR_NAME} with environment variables"""

        if isinstance(obj, str):
            # Replace ${VAR_NAME} with environment variable value
            if "${" in obj and "}" in obj:
                import re
                def replace_var(match):
                    var_name = match.group(1)
                    return os.getenv(var_name, match.group(0))
                return re.sub(r'\$\{([^}]+)\}', replace_var, obj)
            return obj

        elif isinstance(obj, dict):
            return {k: ConfigLoader._replace_env_vars(v) for k, v in obj.items()}

        elif isinstance(obj, list):
            return [ConfigLoader._replace_env_vars(item) for item in obj]

        return obj

    def get_services_config(self) -> Dict[str, Any]:
        """Get services configuration from services.yaml"""
        services_file = self.config_dir.parent / "services.yaml"

        if not services_file.exists():
            raise FileNotFoundError(f"Services file not found: {services_file}")

        with open(services_file) as f:
            services_config = yaml.safe_load(f) or {}

        # Replace environment variables
        services_config = self._replace_env_vars(services_config)

        return services_config.get('services', {})

    def validate_config(self) -> tuple[bool, str]:
        """Validate configuration"""

        if self.env == "prod":
            required_vars = [
                'DB_HOST', 'DB_USER', 'DB_PASSWORD',
                'REDIS_HOST'
            ]

            missing_vars = [var for var in required_vars if not os.getenv(var)]

            if missing_vars:
                return False, f"Missing required environment variables for production: {', '.join(missing_vars)}"

        return True, "Configuration valid"

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key (dot notation: 'backend.port')"""
        keys = key.split('.')
        value = self.config

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default

        return value if value is not None else default


def load_services_yaml(path: Path) -> Dict[str, Any]:
    """Load services.yaml file"""
    if not path.exists():
        raise FileNotFoundError(f"services.yaml not found: {path}")

    with open(path) as f:
        content = yaml.safe_load(f)

    # Replace environment variables
    content = ConfigLoader._replace_env_vars(content)

    return content
