.PHONY: help install setup backend frontend dev dev-backend dev-frontend logs clean stop restart status

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Help command
help: ## Show this help message
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║        Zyron-Ai Development Environment Management        ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup Commands:$(NC)"
	@grep -E "^\s*install|^setup" Makefile | grep "##" | awk 'BEGIN {FS = ":[^#]*## "} {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@grep -E "^dev|^backend|^frontend" Makefile | grep "##" | grep -v install | awk 'BEGIN {FS = ":[^#]*## "} {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Management Commands:$(NC)"
	@grep -E "^logs|^clean|^stop|^restart|^status" Makefile | grep "##" | awk 'BEGIN {FS = ":[^#]*## "} {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# Installation & Setup
install: ## Install all dependencies (backend + frontend)
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && python -m venv .venv && .venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r backend/requirements.txt
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@echo ""
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

setup: install ## Setup the project (install + git init + initial commit)
	@if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then \
		echo "$(BLUE)Initializing git repository...$(NC)"; \
		git init; \
		git config user.email "dev@zyron-ai.local"; \
		git config user.name "Zyron Developer"; \
		git add .; \
		git commit -m "Initial Zyron-Oryze setup"; \
		echo "$(GREEN)✓ Git repository initialized$(NC)"; \
	else \
		echo "$(YELLOW)Git repository already initialized$(NC)"; \
	fi

# Development Servers
backend: ## Start backend server (port 8000)
	@echo "$(BLUE)Starting backend server...$(NC)"
	@cd backend && python manage_server.py start --port 8000

backend-force: ## Force kill process on 8000 and start backend
	@echo "$(BLUE)Force starting backend server...$(NC)"
	@cd backend && python manage_server.py start --port 8000 --force

backend-stop: ## Stop backend server gracefully
	@echo "$(BLUE)Stopping backend server...$(NC)"
	@cd backend && python manage_server.py stop

backend-kill: ## Force kill backend server
	@echo "$(RED)Force killing backend server...$(NC)"
	@cd backend && python manage_server.py kill

backend-restart: ## Restart backend server
	@echo "$(BLUE)Restarting backend server...$(NC)"
	@cd backend && python manage_server.py restart

backend-status: ## Show backend server status
	@cd backend && python manage_server.py status

frontend: ## Start frontend dev server (port 5173)
	@echo "$(BLUE)Starting frontend dev server...$(NC)"
	cd frontend && npm run dev

frontend-build: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend build complete$(NC)"

# Combined Development
dev: ## Start both backend and frontend servers (recommended)
	@echo "$(BLUE)Starting Zyron-Ai development environment...$(NC)"
	@echo "$(YELLOW)This will start both servers. Open another terminal for separate control.$(NC)"
	@echo ""
	@echo "$(GREEN)Backend will be available at: http://127.0.0.1:8000$(NC)"
	@echo "$(GREEN)Frontend will be available at: http://localhost:5173$(NC)"
	@echo "$(GREEN)API Docs: http://127.0.0.1:8000/docs$(NC)"
	@echo ""
	@make -j2 backend frontend

dev-backend: ## Start only backend (quick alternative to 'make dev')
	@make backend

dev-frontend: ## Start only frontend (quick alternative to 'make dev')
	@make frontend

# Logs & Status
logs: ## Show backend server logs (follow mode)
	@echo "$(BLUE)Following backend logs... (Press Ctrl+C to stop)$(NC)"
	@tail -f logs/backend.log 2>/dev/null || echo "$(YELLOW)No logs yet. Start the server first.$(NC)"

logs-errors: ## Show only error logs
	@echo "$(RED)Backend error logs:$(NC)"
	@grep ERROR logs/backend.log 2>/dev/null || echo "$(YELLOW)No errors found.$(NC)"

logs-last: ## Show last 50 lines of logs
	@echo "$(BLUE)Last 50 lines of backend logs:$(NC)"
	@tail -50 logs/backend.log 2>/dev/null || echo "$(YELLOW)No logs yet.$(NC)"

status: ## Show server status (backend + frontend)
	@echo "$(BLUE)Server Status:$(NC)"
	@echo ""
	@make backend-status
	@echo ""
	@echo "$(YELLOW)Port availability:$(NC)"
	@lsof -i :8000 > /dev/null 2>&1 && echo "  $(RED)✗ Port 8000: In use$(NC)" || echo "  $(GREEN)✓ Port 8000: Available$(NC)"
	@lsof -i :5173 > /dev/null 2>&1 && echo "  $(RED)✗ Port 5173: In use$(NC)" || echo "  $(GREEN)✓ Port 5173: Available$(NC)"

# Cleanup & Maintenance
clean: ## Clean up logs and temporary files
	@echo "$(BLUE)Cleaning up...$(NC)"
	@rm -rf logs/*.log logs/*.json backend/__pycache__ backend/.pytest_cache
	@rm -rf frontend/dist frontend/.vite-metadata.json
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

clean-all: clean ## Deep clean (includes node_modules and .venv)
	@echo "$(RED)⚠  This will delete node_modules and .venv$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf backend/.venv frontend/node_modules; \
		echo "$(GREEN)✓ Deep clean complete$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

stop: backend-stop ## Stop all servers (alias for backend-stop)
	@echo "$(YELLOW)Note: Run 'make status' to verify servers are stopped$(NC)"

restart: ## Restart all services (backend + frontend)
	@echo "$(BLUE)Restarting services...$(NC)"
	@make backend-restart
	@echo "$(YELLOW)Frontend must be restarted manually (npm run dev in frontend dir)$(NC)"

# Health checks
health: ## Check if servers are running and healthy
	@echo "$(BLUE)Health Check:$(NC)"
	@echo ""
	@echo "Backend Health:"
	@curl -s -m 2 http://127.0.0.1:8000/health > /dev/null && echo "  $(GREEN)✓ Backend responding$(NC)" || echo "  $(RED)✗ Backend not responding$(NC)"
	@echo ""
	@echo "Frontend Status:"
	@curl -s -m 2 http://localhost:5173 > /dev/null && echo "  $(GREEN)✓ Frontend responding$(NC)" || echo "  $(RED)✗ Frontend not responding$(NC)"

# Development utilities
lint: ## Run linters (Python + JavaScript)
	@echo "$(BLUE)Running linters...$(NC)"
	@echo "Python linting..."
	@cd backend && .venv/bin/python -m pylint server.py 2>/dev/null || echo "$(YELLOW)pylint not installed$(NC)"
	@echo "JavaScript linting..."
	@cd frontend && npm run lint 2>/dev/null || echo "$(YELLOW)ESLint not configured$(NC)"

format: ## Format code (Python + JavaScript)
	@echo "$(BLUE)Formatting code...$(NC)"
	@echo "Python formatting..."
	@cd backend && .venv/bin/python -m black server.py 2>/dev/null || echo "$(YELLOW)black not installed$(NC)"
	@echo "JavaScript formatting..."
	@cd frontend && npm run format 2>/dev/null || echo "$(YELLOW)Prettier not configured$(NC)"

# Git utilities
init-git: ## Initialize git (if not already initialized)
	@if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then \
		git init && \
		git config user.email "dev@zyron-ai.local" && \
		git config user.name "Zyron Developer" && \
		git add . && \
		git commit -m "Initial commit"; \
		echo "$(GREEN)✓ Git initialized$(NC)"; \
	else \
		echo "$(YELLOW)Git already initialized$(NC)"; \
	fi
