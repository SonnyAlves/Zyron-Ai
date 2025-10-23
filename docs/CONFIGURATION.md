# Zyron AI - Configuration Guide

## Overview

Zyron AI uses a **hierarchical YAML configuration system** with environment-specific overrides.

```
base.yaml (Common)
    ↓
zyron.{env}.yaml (Override)
    ↓
Environment Variables (Final)
    ↓
Running Configuration
```

## Configuration Files

### 1. Base Configuration (`config/base.yaml`)

Common configuration shared by all environments.

**DO NOT EDIT FOR ENVIRONMENT-SPECIFIC SETTINGS** - Use environment files instead.

```yaml
project:
  name: "Zyron AI"
  version: "0.2.0"

backend:
  port: 8000
  host: "127.0.0.1"
  log_level: "info"
  timeout: 300
```

### 2. Environment Configurations

#### Development (`config/zyron.dev.yaml`)

For local development with minimal setup.

```yaml
environment: development
debug: true

backend:
  port: 8000
  reload: true      # Hot reload
  workers: 1
  log_level: "debug"

database:
  type: "sqlite"
  path: "data/zyron_dev.db"
  echo_sql: false

redis:
  enabled: false    # Not needed for dev
```

**Usage:**
```bash
python dev-orchestrator.py start              # Uses dev by default
python dev-orchestrator.py start --env dev    # Explicit
```

#### Staging (`config/zyron.staging.yaml`)

Production-like setup for testing.

```yaml
environment: staging
debug: true

backend:
  port: 8000
  reload: false     # No hot reload
  workers: 2
  log_level: "info"

database:
  type: "postgresql"
  host: "${DB_HOST}"       # From .env
  port: 5432
  name: "zyron_staging"

redis:
  enabled: true
  host: "${REDIS_HOST}"
```

**Usage:**
```bash
python dev-orchestrator.py start --env staging --docker
```

**Requirements:**
- Docker must be running
- Database connection must work
- All ${VAR} substitutions must be in .env

#### Production (`config/zyron.prod.yaml`)

Strict configuration for production deployment.

```yaml
environment: production
debug: false

backend:
  port: 80          # Served via reverse proxy typically
  reload: false
  workers: 4        # Multiple workers
  log_level: "warning"

database:
  type: "postgresql"
  host: "${DB_HOST}"           # MUST be set
  port: 5432
  name: "${DB_NAME}"           # MUST be set
  password: "${DB_PASSWORD}"   # MUST be set
  ssl: true                      # Encrypted connection

redis:
  enabled: true
  host: "${REDIS_HOST}"        # MUST be set
  password: "${REDIS_PASSWORD}"
```

**Usage:**
```bash
DB_HOST=prod-db.internal \
DB_USER=zyron \
DB_PASSWORD=secure_password \
REDIS_HOST=prod-redis.internal \
REDIS_PASSWORD=secure_password \
python dev-orchestrator.py start --env prod
```

**Validation:**
- Missing required variables → Error
- Connections fail → Error
- Service startup fails → Rollback

## Environment Variables

### .env File

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit with your values:

```bash
# Environment
ENVIRONMENT=development

# Backend
BACKEND_PORT=8000
BACKEND_LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zyron_dev
DB_USER=zyron
DB_PASSWORD=dev_password_change_in_prod

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Visual Brain
VISUAL_BRAIN_PORT=8001
GPU_ENABLED=false
MODEL_CACHE=./models
```

### Variable Substitution

In YAML config files, use `${VAR_NAME}` syntax:

```yaml
database:
  host: "${DB_HOST}"           # Replaced with $DB_HOST
  user: "${DB_USER:-default}"  # With default value
  password: "${DB_PASSWORD}"
```

### Environment Variable Priority

1. **Runtime environment** (highest priority)
   ```bash
   DB_HOST=my-server python dev-orchestrator.py start
   ```

2. **.env file**
   ```
   DB_HOST=localhost
   ```

3. **Default in YAML** (lowest priority)
   ```yaml
   host: "localhost"
   ```

## Configuration by Environment

### Development Setup

```bash
# 1. Copy env template
cp .env.example .env

# 2. Keep .env defaults (SQLite, localhost)

# 3. Start
python dev-orchestrator.py start

# That's it! No Docker, SQLite auto-created
```

### Staging Setup

```bash
# 1. Copy and update .env
cp .env.example .env
# Edit:
# DB_HOST=staging-db.internal
# DB_PASSWORD=staging_password
# REDIS_HOST=staging-redis.internal

# 2. Start with Docker and staging config
python dev-orchestrator.py start --env staging --docker

# Services will use PostgreSQL and Redis
```

### Production Setup

```bash
# 1. Set environment variables (no .env file!)
export ENVIRONMENT=production
export DB_HOST=prod-db.example.com
export DB_PASSWORD=$(aws ssm get-parameter --name /zyron/db-password --query 'Parameter.Value' --output text)
export REDIS_HOST=prod-redis.example.com
export REDIS_PASSWORD=$(aws ssm get-parameter --name /zyron/redis-password --query 'Parameter.Value' --output text)

# 2. Start
python dev-orchestrator.py start --env prod

# Strict validation ensures all vars are set
```

## Configuration Reference

### Backend Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| `port` | 8000 | 8000 | 80 |
| `reload` | true | false | false |
| `workers` | 1 | 2 | 4 |
| `log_level` | debug | info | warning |
| `timeout` | 300s | 300s | 600s |

### Database Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| `type` | sqlite | postgresql | postgresql |
| `host` | - | localhost | ${DB_HOST} |
| `ssl` | false | false | true |
| `pool_size` | 1 | 10 | 20 |
| `echo_sql` | false | false | false |

### Redis Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| `enabled` | false | true | true |
| `host` | localhost | localhost | ${REDIS_HOST} |
| `password` | - | - | ${REDIS_PASSWORD} |
| `ssl` | false | false | true |

## Configuration Validation

### Validation Rules

**Development:**
- Minimal validation
- Warnings allowed
- Can use defaults

**Staging:**
- Database connection must work
- Redis connection must work
- Warnings are logged

**Production:**
- ALL environment variables MUST be set
- Database connection tested
- Redis connection tested
- Health checks pass for all services
- No warnings allowed

### Validation Commands

```bash
# Check current configuration
python dev-orchestrator.py config

# Validate for environment
python dev-orchestrator.py config --env prod  # Will error if incomplete

# Full health check (includes config validation)
python dev-orchestrator.py health
```

## Configuration Tips

### Tip 1: Use Environment Variables for Secrets

```yaml
# ❌ Bad - Hardcoded password
database:
  password: "super_secret_123"

# ✅ Good - From environment
database:
  password: "${DB_PASSWORD}"
```

Then set via environment:
```bash
export DB_PASSWORD="super_secret_123"
```

### Tip 2: Environment-Specific Overrides

Don't modify `base.yaml`. Instead, create overrides in `zyron.{env}.yaml`:

```yaml
# config/zyron.custom.yaml
environment: custom
backend:
  workers: 8        # Override only what's needed
```

Then use:
```bash
python dev-orchestrator.py start --env custom
```

### Tip 3: Defaults in YAML

Provide sensible defaults in base.yaml:

```yaml
database:
  pool_size: 5      # Default used if not overridden
```

### Tip 4: Conditional Configuration

Use feature flags in config:

```yaml
features:
  visual_brain: false   # Enable in staging/prod
  redis_cache: false    # Enable when needed
  ssl_required: false   # Enable in prod
```

## Troubleshooting Configuration

### Issue: "Missing required environment variable"

**Problem:**
```
Error: DB_PASSWORD not set (required for production)
```

**Solution:**
```bash
export DB_PASSWORD="your_password"
python dev-orchestrator.py start --env prod
```

### Issue: "Invalid configuration"

**Problem:**
```
Error: Invalid config: database.pool_size must be > 0
```

**Solution:**
Check `.env` or environment variables for invalid values.

### Issue: "Configuration doesn't apply"

**Problem:**
Changes to config files aren't reflected.

**Solution:**
1. Restart services: `python dev-orchestrator.py restart`
2. Verify loading: `python dev-orchestrator.py config`
3. Check which file is loaded:
   ```bash
   ls -la config/zyron.dev.yaml
   ```

### Issue: "Wrong environment being used"

**Problem:**
```
Application using dev config instead of staging
```

**Solution:**
```bash
# Explicitly specify environment
python dev-orchestrator.py start --env staging

# Verify loaded config
python dev-orchestrator.py config
```

## Best Practices

1. **Never commit .env to git**
   - Add to `.gitignore`
   - Use `.env.example` for template

2. **Use environment variables for secrets**
   - Never hardcode passwords
   - Use ${VAR_NAME} syntax

3. **Keep base.yaml generic**
   - Common configuration only
   - Environment-specific in zyron.{env}.yaml

4. **Test configuration before deploying**
   ```bash
   python dev-orchestrator.py config
   python dev-orchestrator.py health
   ```

5. **Document custom configurations**
   - Add comments in custom config files
   - Update .env.example with new variables

## Advanced: Custom Environments

Create custom environment configuration:

```bash
# config/zyron.testing.yaml
environment: testing
debug: true

backend:
  port: 9000         # Different port to avoid conflicts
  workers: 1

database:
  type: "sqlite"
  path: "data/zyron_test.db"
```

Use it:
```bash
python dev-orchestrator.py start --env testing
```

---

**See also:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [SERVICES.md](SERVICES.md) - Service details
- [../DEVELOPMENT.md](../DEVELOPMENT.md) - Development workflow
