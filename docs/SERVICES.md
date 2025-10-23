# Zyron AI - Services Reference

Complete documentation of all services and their configuration.

## Available Services

### 1. Backend API

**Type:** Process (Python/Uvicorn)
**Port:** 8000
**Command:** `uvicorn backend.server:app --reload --port 8000`

#### Health Check
```http
GET http://localhost:8000/health
```

Response: `{"status": "ok"}`

#### Documentation
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### Configuration (config/zyron.*.yaml)
```yaml
backend:
  port: 8000
  reload: true        # Dev only
  workers: 1          # Dev: 1, Staging: 2, Prod: 4
  log_level: debug    # Dev, info/warning for prod
  cors_origins:
    - http://localhost:5173
```

#### Environment Variables
- `BACKEND_PORT` - Port (default: 8000)
- `ENVIRONMENT` - Environment name
- `DATABASE_URL` - DB connection string (optional)
- `REDIS_URL` - Redis connection string (optional)

#### Dependencies
- None (but connects to database if available)

#### Critical
Yes - Entire application depends on backend

---

### 2. Frontend

**Type:** Process (Node.js/Vite)
**Port:** 5173
**Command:** `npm run dev`

#### Health Check
```http
GET http://localhost:5173/
```

Response: `200 OK` with HTML

#### Configuration
```yaml
frontend:
  port: 5173
  host: localhost
```

#### Scripts
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

#### Dependencies
- None

#### Critical
No - App works (in degraded mode) without frontend

---

### 3. PostgreSQL Database (Optional)

**Type:** Docker Container
**Image:** `postgres:16-alpine`
**Port:** 5432
**Status:** Disabled by default

#### Enable Database
```bash
# Start with Docker support
python dev-orchestrator.py start --docker

# Or enable in services.yaml
postgres:
  enabled: true
```

#### Health Check
```bash
pg_isready -U zyron
```

#### Configuration
```yaml
postgres:
  image: postgres:16-alpine
  container_name: zyron_postgres
  port: 5432
  environment:
    POSTGRES_DB: zyron_dev
    POSTGRES_USER: zyron
    POSTGRES_PASSWORD: dev_password_change_in_prod
  volumes:
    - ./data/postgres:/var/lib/postgresql/data
```

#### Environment Variables (from .env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zyron_dev
DB_USER=zyron
DB_PASSWORD=dev_password_change_in_prod
```

#### Data Persistence
- Volume: `./data/postgres/`
- Survives container restarts
- Deleted with `docker volume rm zyron_postgres`

#### Startup Timeout
- 60 seconds (includes init scripts)

#### Dependencies
- None (backend will use SQLite if not available)

#### Critical
- Yes for staging/prod
- No for development

---

### 4. Redis Cache (Optional)

**Type:** Docker Container
**Image:** `redis:7-alpine`
**Port:** 6379
**Status:** Disabled by default

#### Enable Redis
```bash
python dev-orchestrator.py start --docker
```

#### Health Check
```bash
redis-cli ping
```

Response: `PONG`

#### Configuration
```yaml
redis:
  image: redis:7-alpine
  container_name: zyron_redis
  port: 6379
  command: redis-server --appendonly yes
  volumes:
    - ./data/redis:/data
```

#### Use Cases
- Session caching
- Rate limiting
- Job queues (for Visual Brain)
- Real-time data

#### Environment Variables (from .env)
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

#### Startup Timeout
- 30 seconds

#### Dependencies
- None

#### Critical
- No (optional for development)

---

### 5. Visual Brain (ML Service)

**Type:** Process (Python/FastAPI)
**Port:** 8001
**Status:** Disabled by default (Phase 2 stub)

#### Current State (Phase 2)
- Stub implementation with 10+ endpoints
- Returns 501 (Not Implemented) for `/generate`
- GPU detection available via `/gpu-info`
- Ready for Phase 3 ML implementation

#### Enable Visual Brain
```bash
# Edit services.yaml
visual-brain:
  enabled: true

# Then start
python dev-orchestrator.py start visual-brain
```

#### Available Endpoints
```
GET /              - Root info
GET /health        - Service health
GET /status        - Service status
GET /models        - List models (empty in Phase 2)
GET /gpu-info      - GPU availability
GET /requirements  - System requirements
POST /generate     - Generate image (501 Not Implemented)
```

#### Health Check
```http
GET http://localhost:8001/health
```

Response:
```json
{
  "status": "ok",
  "mode": "stub",
  "gpu_available": false,
  "models_loaded": [],
  "platform": "Darwin"
}
```

#### Configuration
```yaml
visual-brain:
  port: 8001
  enabled: false     # Phase 2: disabled
  gpu_required: true # Phase 3: may need GPU
  depends_on: [redis] # For queue system
```

#### Environment Variables
```
VISUAL_BRAIN_PORT=8001
GPU_ENABLED=false
MODEL_CACHE=./models
```

#### Startup Timeout
- 60 seconds

#### Dependencies
- Redis (for job queue in Phase 3)

#### Critical
- No (Phase 3 feature)

#### Phase 3 Roadmap
- [ ] PyTorch integration
- [ ] Stable Diffusion XL
- [ ] GPU acceleration (CUDA/MPS/ROCm)
- [ ] Model caching and management
- [ ] Batch processing
- [ ] Job queue system
- [ ] Rate limiting

---

## Service Startup Order

### Development (SQLite, no Docker)
```
backend → frontend
```

No dependencies, can start in parallel.

### Staging (PostgreSQL + Redis)
```
postgres → redis → backend → frontend
         ↑
    Critical wait for health check
```

Database must be healthy before backend connects.

### Production
```
postgres → redis → backend → frontend
                              ↑
                   visual-brain (optional, if enabled)
                        ↓
                    depends_on: redis
```

All critical services healthy before frontend serves.

---

## Service Status Tracking

Each service has a status file: `logs/{service}_status.json`

Example:
```json
{
  "name": "backend",
  "status": "running",
  "port": 8000,
  "pid": 12345,
  "uptime": 3600.5,
  "healthy": true,
  "timestamp": 1729747200.123
}
```

Status values:
- `running` - Service is active
- `stopped` - Service is not running
- `failed` - Service crashed or failed health check
- `starting` - Service is initializing

---

## Accessing Services

### From Host Machine
```
Backend:     http://127.0.0.1:8000
Frontend:    http://localhost:5173
Database:    localhost:5432 (psql)
Redis:       localhost:6379 (redis-cli)
Visual Brain: http://localhost:8001
```

### From Docker Container (if running)
```
Backend:     http://backend:8000
Frontend:    http://frontend:5173
Database:    postgres:5432
Redis:       redis:6379
```

### From Backend Application
```python
# Database (SQLite)
DATABASE_URL = "sqlite:///./data/zyron_dev.db"

# Or PostgreSQL
DATABASE_URL = "postgresql://zyron:password@localhost/zyron"

# Redis
REDIS_URL = "redis://localhost:6379"

# Visual Brain
VISUAL_BRAIN_URL = "http://localhost:8001"
```

---

## Common Operations

### View Service Logs
```bash
# All logs
tail -f logs/*.log

# Specific service
tail -f logs/backend.log
tail -f logs/postgres.log
```

### Check Service Health
```bash
python dev-orchestrator.py health

# Detailed output
curl http://localhost:8000/health
```

### Restart Service
```bash
# Single service
python dev-orchestrator.py restart backend

# Multiple services
python dev-orchestrator.py restart backend frontend
```

### Stop Specific Service
```bash
python dev-orchestrator.py stop backend
```

Note: Dependents (frontend) will also stop.

### Get Service Status
```bash
python dev-orchestrator.py status
```

Shows all services and their status.

---

## Troubleshooting

### Service Won't Start
1. Check logs: `tail -f logs/{service}.log`
2. Check configuration: `python dev-orchestrator.py config`
3. Verify ports are free: `lsof -i :{port}`

### Health Check Fails
1. Check service is running: `python dev-orchestrator.py status`
2. Test endpoint manually: `curl http://localhost:8000/health`
3. Check firewall rules
4. Verify environment variables

### Database Connection Error
1. Start with Docker: `python dev-orchestrator.py start --docker`
2. Check DB is running: `lsof -i :5432`
3. Test connection: `psql -U zyron -h localhost -d zyron_dev`
4. Check credentials in `.env`

### Docker Container Issues
1. Check Docker is running: `docker ps`
2. View container logs: `docker logs zyron_postgres`
3. Restart container: `docker restart zyron_postgres`

---

**See also:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration details
- [../DEVELOPMENT.md](../DEVELOPMENT.md) - Development workflow
