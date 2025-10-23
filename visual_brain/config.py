"""
Zyron Visual Brain Configuration
"""

import os
from pathlib import Path


class VisualBrainConfig:
    """Configuration for Visual Brain service"""

    # Service settings
    SERVICE_NAME = "Zyron Visual Brain"
    VERSION = "0.1.0-stub"
    MODE = "stub"  # Will be "production" in Phase 3

    # Server settings
    HOST = os.getenv("VISUAL_BRAIN_HOST", "127.0.0.1")
    PORT = int(os.getenv("VISUAL_BRAIN_PORT", "8001"))
    WORKERS = int(os.getenv("VISUAL_BRAIN_WORKERS", "1"))

    # GPU settings
    GPU_ENABLED = os.getenv("GPU_ENABLED", "false").lower() == "true"
    GPU_DEVICE = os.getenv("GPU_DEVICE", "0")

    # Model settings
    MODEL_CACHE = Path(os.getenv("MODEL_CACHE", "./models"))
    MAX_MODEL_SIZE_GB = 20

    # Generation settings
    MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "1"))
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "300"))

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

    @classmethod
    def validate(cls):
        """Validate configuration"""
        cls.MODEL_CACHE.mkdir(parents=True, exist_ok=True)
        return True

    @classmethod
    def get_info(cls) -> dict:
        """Get configuration info as dictionary"""
        return {
            "name": cls.SERVICE_NAME,
            "version": cls.VERSION,
            "mode": cls.MODE,
            "host": cls.HOST,
            "port": cls.PORT,
            "workers": cls.WORKERS,
            "gpu_enabled": cls.GPU_ENABLED,
            "model_cache": str(cls.MODEL_CACHE),
            "max_concurrent_requests": cls.MAX_CONCURRENT_REQUESTS
        }
