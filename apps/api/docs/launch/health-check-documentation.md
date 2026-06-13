# Health Check Documentation

## Endpoints

### 1. `GET /api/v1/health`

**Purpose:** Liveness Probe  
**Description:** Simple check ensuring the node process is running and accepting HTTP connections. No database or cache assertions.  
**Usage:** Kubernetes `livenessProbe`.

### 2. `GET /api/v1/health/ready`

**Purpose:** Readiness Probe  
**Description:** Deep assertion. Verifies Memory usage (< 1GB RSS/Heap), Prisma database connectivity, and Redis connectivity.  
**Usage:** Kubernetes `readinessProbe`.

### 3. `GET /api/v1/health/metrics`

**Purpose:** Observability  
**Description:** Exposes basic vendor-neutral statistics regarding requests processed and current error counts.  
**Usage:** Scrapers and Dashboarding tools.
