"""
Zyron Visual Brain Health Checks
"""

from typing import Dict, Any
import platform
import psutil


def check_system_health() -> Dict[str, Any]:
    """Check system health for Visual Brain"""

    return {
        "system": {
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "processor": platform.processor()
        },
        "memory": {
            "total_gb": psutil.virtual_memory().total / (1024 ** 3),
            "available_gb": psutil.virtual_memory().available / (1024 ** 3),
            "percent_used": psutil.virtual_memory().percent
        },
        "disk": {
            "total_gb": psutil.disk_usage("/").total / (1024 ** 3),
            "free_gb": psutil.disk_usage("/").free / (1024 ** 3),
            "percent_used": psutil.disk_usage("/").percent
        },
        "cpu": {
            "count": psutil.cpu_count(),
            "percent_used": psutil.cpu_percent(interval=1)
        }
    }


def check_gpu_availability() -> Dict[str, Any]:
    """Check GPU availability"""

    gpu_info = {
        "cuda_available": False,
        "mps_available": platform.system() == "Darwin",
        "rocm_available": False,
        "devices": []
    }

    # Try CUDA
    try:
        import torch
        if torch.cuda.is_available():
            gpu_info["cuda_available"] = True
            gpu_info["cuda_version"] = torch.version.cuda
            for i in range(torch.cuda.device_count()):
                gpu_info["devices"].append({
                    "index": i,
                    "name": torch.cuda.get_device_name(i),
                    "memory_gb": torch.cuda.get_device_properties(i).total_memory / (1024 ** 3)
                })
    except ImportError:
        pass

    return gpu_info
