#!/usr/bin/env python
"""
Zyron GPU Detection - Check if GPU is available for Visual Brain
"""

import platform
import psutil


def check_gpu():
    """Check GPU availability"""

    print("\n╔════════════════════════════════════════════════════╗")
    print("║      ZYRON VISUAL BRAIN - GPU DIAGNOSTICS        ║")
    print("╚════════════════════════════════════════════════════╝\n")

    # System info
    print("🖥️  System Information")
    print(f"   Platform:        {platform.system()} {platform.release()}")
    print(f"   Python:          {platform.python_version()}")
    print(f"   Processor:       {platform.processor()}")
    print()

    # Memory & Storage
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    print("💾 Memory & Storage")
    print(f"   RAM Available:   {mem.available / (1024 ** 3):.1f} GB")
    print(f"   Disk Free:       {disk.free / (1024 ** 3):.1f} GB")
    print()

    # GPU Detection
    print("🎮 GPU Detection")
    gpu_found = False

    # Check CUDA
    try:
        import torch
        if torch.cuda.is_available():
            print(f"   CUDA Available:  ✅ Yes")
            print(f"   CUDA Version:    {torch.version.cuda}")
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                vram_gb = props.total_memory / (1024 ** 3)
                print(f"   Device {i}:        {torch.cuda.get_device_name(i)} ({vram_gb:.1f} GB VRAM)")
                gpu_found = True
        else:
            print("   CUDA Available:  ❌ Not detected")
    except ImportError:
        print("   CUDA:            ⚠️  PyTorch not installed")

    # Check Metal Performance Shaders (Apple)
    if platform.system() == "Darwin":
        print("   MPS (Metal):     ✅ Available (Apple Silicon)")
        gpu_found = True

    # Check ROCm
    try:
        import torch
        if hasattr(torch, "cuda") and hasattr(torch.cuda, "is_available"):
            if "AMD" in platform.processor():
                print("   ROCm (AMD):      ⚠️  May be available (check manually)")
    except:
        pass

    if not gpu_found:
        print("   Status:          ⚠️  No GPU detected")

    print()

    # ML Framework Compatibility
    print("📊 ML Framework Compatibility")
    frameworks = {}

    try:
        import torch
        frameworks['PyTorch'] = torch.__version__
    except ImportError:
        frameworks['PyTorch'] = "Not installed"

    try:
        import tensorflow
        frameworks['TensorFlow'] = tensorflow.__version__
    except ImportError:
        frameworks['TensorFlow'] = "Not installed"

    for name, version in frameworks.items():
        status = "✅" if version != "Not installed" else "❌"
        print(f"   {name:15} {status} {version}")

    print()

    # Disk Space for Models
    print("📦 Disk Space Estimates")
    print(f"   Stable Diffusion XL:  ~7 GB required (free: {disk.free / (1024 ** 3):.1f} GB)")
    print(f"   Stable Diffusion 1.5: ~4 GB required")
    print(f"   ControlNet:           ~2 GB required")
    print()

    # Recommendations
    print("🔧 Recommendations")
    if gpu_found:
        print(f"   ✅ Your system CAN run Visual Brain with GPU acceleration")
    else:
        print(f"   ⚠️  No GPU detected - Visual Brain will use CPU (slower)")
        print(f"      For NVIDIA: Install CUDA 12.0+ and PyTorch")
        print(f"      For AMD: Install ROCm and PyTorch")

    if disk.free / (1024 ** 3) < 20:
        print(f"   ⚠️  Low disk space - ensure > 20GB free for models")

    if mem.available / (1024 ** 3) < 8:
        print(f"   ⚠️  Limited RAM - 16GB+ recommended for smooth operation")

    print()

    # Next Steps
    print("📋 Next Steps")
    print("   1. Visual Brain is currently in STUB mode (Phase 2)")
    print("   2. To enable ML features (Phase 3):")
    print("      - Install PyTorch: pip install torch torchvision")
    print("      - Download models: ./check-gpu download-models")
    print("      - Enable in services.yaml: visual_brain.enabled = true")
    print("   3. Documentation: visual_brain/README.md")
    print()

    print("🎯 Current Status: 🟡 STUB MODE (Phase 2)")
    print("🚀 Ready for Phase 3: ✅ Infrastructure prepared\n")


if __name__ == "__main__":
    check_gpu()
