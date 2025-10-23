# Zyron AI - System Architecture

## Phase 2: Multi-Service Orchestration

This document describes the architecture of the Zyron AI platform after Phase 2 implementation.

## Overview

Zyron AI is a **multi-service AI platform** with:
- FastAPI backend
- React/Vite frontend
- Optional PostgreSQL + Redis via Docker
- Visual Brain (ML service - Phase 3)
- Intelligent orchestration system

```
┌─────────────────────────────────────────────────────────────┐
│                   ZYRON AI ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Frontend   │      │   Backend    │                    │
│  │  (Vite/React)│◄────►│  (FastAPI)   │                    │
│  │  Port 5173   │      │  Port 8000   │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                                │                             │
│                         ┌──────▼───────┐                   │
│                         │   Database   │                    │
│                         │ (SQLite/PG)  │                    │
│                         │  Port 5432   │                    │
│                         └──────────────┘                    │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │    Redis     │      │ Visual Brain │                    │
│  │  (Optional)  │      │   (Phase 3)  │                    │
│  │  Port 6379   │      │  Port 8001   │                    │
│  └──────────────┘      └──────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                    ┌───────▼────────┐
                    │  Orchestrator  │
                    │ (dev-orchestr  │
                    │     ator.py)   │
                    └────────────────┘
```

## System Components

### 1. Core Orchestration (`lib/`)

#### **orchestrator.py** (450+ lines)
Central orchestration engine responsible for:
- Service lifecycle management (start/stop/restart)
- Dependency resolution (topological sort)
- Health check coordination
- Automatic rollback on failure
- Service status tracking

Key methods:
```python
orchestrator = Orchestrator(Path("config"), env="dev")
success, msg = orchestrator.start(service_names=["backend", "frontend"])
statuses = orchestrator.get_status()
all_healthy, results = orchestrator.health_check()
orchestrator.stop()
```

#### **service.py** (280+ lines)
Service abstraction layer:
- `Service` (abstract base class)
- `ProcessService` (Python/Node.js processes)
- `DockerService` (Docker containers)
- `ServiceStatus` (status tracking)

#### **docker_manager.py** (220+ lines)
Docker container lifecycle management:
- Container creation and removal
- Health check integration
- Volume management
- Port mapping

#### **health_checker.py** (250+ lines)
Health check system with:
- HTTP endpoint checks
- Command-based checks (for Docker containers)
- Retry mechanism (configurable)
- Async/parallel checking
- Response time tracking

#### **config_loader.py** (170+ lines)
Configuration management:
- YAML-based config loading
- Environment-specific overrides
- Environment variable substitution (${VAR_NAME})
- Configuration merging
- Schema validation (Pydantic)

#### **logger.py** (150+ lines)
Colored logging system:
- Per-service colored output
- File and console output
- Service-specific loggers
- ANSI color codes

### 2. Configuration System

#### **services.yaml**
Master service definitions with:
- Service metadata
- Port mappings
- Health check configuration
- Dependency graphs
- Docker image/volume specs
- Critical/non-critical flags

Example:
```yaml
services:
  backend:
    name: "Backend API"
    type: "process"
    command: "uvicorn backend.server:app --reload --port 8000"
    port: 8000
    depends_on: []
    critical: true
    health_check:
      type: "http"
      url: "http://localhost:8000/health"
```

#### **config/** (Environment configs)
- `base.yaml` - Base configuration
- `zyron.dev.yaml` - Development (SQLite)
- `zyron.staging.yaml` - Staging (PostgreSQL)
- `zyron.prod.yaml` - Production (strict validation)

### 3. Visual Brain Infrastructure

#### **visual_brain/server.py**
FastAPI stub with 10+ endpoints:
- `/health` - Service health check
- `/generate` - Image generation (returns 501 - not implemented)
- `/models` - List available models
- `/status` - Service status
- `/gpu-info` - GPU availability
- `/requirements` - System requirements

#### **visual_brain/config.py**
Service configuration module for Phase 3 ML implementation

#### **visual_brain/health.py**
System health checks (GPU, memory, disk)

### 4. CLI Tools

#### **dev-orchestrator.py**
Main orchestrator CLI:
```bash
python dev-orchestrator.py start [services]    # Start services
python dev-orchestrator.py stop [services]     # Stop services
python dev-orchestrator.py restart [services]  # Restart services
python dev-orchestrator.py status              # Show status
python dev-orchestrator.py health              # Health checks
python dev-orchestrator.py logs                # Show logs
python dev-orchestrator.py config              # Show configuration
```

#### **check-gpu.py**
GPU detection and diagnostics:
```bash
python check-gpu.py  # Detailed GPU report
```

## Service Lifecycle

### Startup Sequence (Dependency-Ordered)

```
1. Resolve dependencies (topological sort)
   backend depends_on: [database]
   → database must start first

2. Start services in order:
   database → backend → frontend → visual-brain

3. Health checks (parallel):
   Check all services simultaneously

4. Success/Failure handling:
   - If critical service fails → rollback all
   - If non-critical fails → continue with warning
```

### Shutdown Sequence (Reverse Order)

```
1. Identify services to stop
2. Get reverse dependency order
3. Stop in reverse: visual-brain → frontend → backend → database
4. Graceful shutdown (10s timeout, then force kill)
```

## Configuration Flow

```
┌─────────────────┐
│  base.yaml      │  (Common config)
└────────┬────────┘
         │
    ┌────▼────┐
    │  Merge  │
    └────┬────┘
         │
    ┌────▼──────────────┐
    │ zyron.{env}.yaml  │  (Environment override)
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │  Replace ${VAR}   │  (Environment variables)
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │  Validate Config  │  (Pydantic schema)
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │  Final Config    │  (Used by services)
    └───────────────────┘
```

## Dependency Resolution

### Algorithm: Topological Sort (Kahn's algorithm)

```python
# Build graph of dependencies
# Example: backend depends_on [database]
graph = {
    "database": ["backend"],  # database -> backend
    "backend": ["frontend"],  # backend -> frontend
    "frontend": []
}

# Kahn's algorithm produces: [database, backend, frontend]
# Reverse for shutdown: [frontend, backend, database]
```

### Example Dependency Graph

```
redis ─────┐
           ├──► backend ──► frontend
database ──┘

visual-brain ◄── redis
```

Startup order: `[database, redis, backend, frontend, visual-brain]`
Shutdown order: `[visual-brain, frontend, backend, redis, database]`

## Health Check Flow

```
┌──────────────────┐
│  Service Config  │  (with health_check settings)
└────────┬─────────┘
         │
    ┌────▼──────────────┐
    │  Check Type?      │
    └────┬──────┬───────┘
         │      │
    ┌────▼──┐ ┌─▼──────────┐
    │ HTTP  │ │ Command    │
    │ GET   │ │ (e.g. ping)│
    └────┬──┘ └─┬──────────┘
         │      │
    ┌────▼──────▼──────┐
    │  Retry Loop      │
    │  (3 attempts)    │
    └────┬─────────────┘
         │
    ┌────▼──────────────┐
    │  Return Result    │
    │  (healthy/unhealthy)
    └───────────────────┘
```

## Error Handling & Rollback

### Scenario: Critical Service Fails

```
Start sequence:
1. Start database ✅
2. Start backend ❌ (FAILS - critical=true)
3. ROLLBACK TRIGGERED
4. Stop database (reverse order)
5. Return error to user
```

### Scenario: Non-Critical Service Fails

```
Start sequence:
1. Start database ✅
2. Start backend ✅
3. Start frontend ❌ (FAILS - critical=false)
4. WARNING logged, continue
5. All other services continue
```

## Environment-Specific Behavior

### Development (`--env dev`)
- SQLite database (no Docker)
- Hot reload enabled
- Debug mode ON
- Minimal startup time
- No Redis required

### Staging (`--env staging`)
- PostgreSQL via Docker
- Hot reload disabled
- Debug mode ON
- Production-like setup
- Optional Redis

### Production (`--env prod`)
- PostgreSQL required (via Docker/external)
- No hot reload
- Debug mode OFF
- Strict validation
- Redis required
- All variables must be set via environment

## Logging Architecture

### Log Levels
```
DEBUG   - Detailed diagnostic info
INFO    - General operational info
WARNING - Warning conditions
ERROR   - Error conditions
```

### Log Destinations
```
Logs/
├── backend.log         # Backend API logs
├── frontend.log        # Frontend dev server logs
├── database.log        # Database logs
├── redis.log           # Redis logs
├── visual-brain.log    # Visual Brain logs
├── orchestrator.log    # Orchestrator logs
└── backend_status.json # Backend status JSON
```

### Log Format
```
[2025-10-24 00:53:24.284] [BACKEND] [INFO] Server started on port 8000
[timestamp]              [service] [level] message
```

## Service Ports

| Service | Port | Type | Environment |
|---------|------|------|-------------|
| Backend | 8000 | Process | All |
| Frontend | 5173 | Process | All |
| Database | 5432 | Docker | staging/prod |
| Redis | 6379 | Docker | staging/prod (optional) |
| Visual Brain | 8001 | Process | All (disabled by default) |

## Docker Integration

### Containers (Optional)

```yaml
postgres:
  image: postgres:16-alpine
  volumes: [./data/postgres:/var/lib/postgresql/data]
  health_check: pg_isready

redis:
  image: redis:7-alpine
  volumes: [./data/redis:/data]
  health_check: redis-cli ping
```

### Data Persistence

```
data/
├── postgres/   # PostgreSQL data (persistent)
└── redis/      # Redis data (persistent with AOF)
```

### Usage

```bash
# With Docker services
python dev-orchestrator.py start --docker

# Without Docker (SQLite only)
python dev-orchestrator.py start
```

## Phase 3 Preparation

### Visual Brain Stub

Current state:
- FastAPI server running on port 8001
- All endpoints return 501 (Not Implemented) or stub data
- GPU detection framework ready
- System health checks available
- Configuration structure prepared

Phase 3 additions:
- PyTorch/TensorFlow integration
- Model loading and caching
- GPU acceleration (CUDA/MPS/ROCm)
- Image generation pipeline
- Batch processing
- Queue system (via Redis)

## Future Enhancements

### Phase 3+
1. **AI Diagnostic Layer** - Pattern matching for common errors
2. **Monitoring** - Prometheus/Grafana metrics
3. **CI/CD** - GitHub Actions pipelines
4. **API Gateway** - Rate limiting, authentication
5. **Load Balancing** - Multiple backend instances
6. **Caching** - Redis integration for API responses

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI | 0.104+ |
| Frontend | React + Vite | 19.1 + 7.1 |
| Database | SQLite/PostgreSQL | 3/16 |
| Cache | Redis | 7 |
| Runtime | Python | 3.11+ |
| Orchestration | Native Python | - |
| Docker | Docker Desktop | 28.5+ |

## Development Workflow

### Quick Start
```bash
# Development mode (SQLite, no Docker)
python dev-orchestrator.py start

# Check status
python dev-orchestrator.py status

# Watch logs
tail -f logs/backend.log
```

### Staging/Production
```bash
# With Docker
python dev-orchestrator.py start --docker --env staging

# Full diagnostics
python dev-orchestrator.py health
```

### Debugging
```bash
# See what's happening
python dev-orchestrator.py logs

# Check configuration
python dev-orchestrator.py config

# GPU diagnostics
python check-gpu.py
```

## Performance Characteristics

### Startup Times
- **Development (no Docker)**: 5-10 seconds
- **Staging (with Docker)**: 30-60 seconds
  - DB init: 10-20s
  - Service startup: 20-40s
- **Health checks**: < 500ms each

### Resource Usage
- **Orchestrator**: < 50MB RAM
- **Backend**: 150-300MB RAM
- **Frontend**: 100-200MB RAM
- **PostgreSQL**: 50-200MB (based on data)
- **Redis**: 20-100MB

### Concurrency
- Default workers: 1 (dev), 2 (staging), 4 (prod)
- Max connections: 5 (dev), 10 (staging), 20 (prod)
- Async request handling via asyncio

---

**See also:**
- [SERVICES.md](SERVICES.md) - Service details
- [CONFIGURATION.md](CONFIGURATION.md) - Config guide
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development workflow
