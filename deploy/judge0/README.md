# Production Judge0 Deployment (for 2,000 Concurrent Students)

This directory contains the production-grade Judge0 configuration tuned to support **1,000 to 2,000 concurrent assessment candidates** without connection drops or ngrok limits.

---

## 🖥️ Recommended Cloud Server

- **AWS EC2**: `c6i.4xlarge` (16 vCPUs, 32 GB RAM) or `c6i.2xlarge` (8 vCPUs, 16 GB RAM)
- **DigitalOcean**: 8 vCPU / 16 GB RAM Droplet ($84/mo) or 16 vCPU / 32 GB RAM Droplet
- **OS**: Ubuntu 22.04 LTS

---

## 🚀 3-Minute Quick Setup

1. **SSH into your cloud server**:
   ```bash
   ssh ubuntu@your-server-ip
   ```

2. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

3. **Clone or copy this directory**:
   ```bash
   mkdir -p /opt/judge0 && cd /opt/judge0
   # Copy docker-compose.yml and judge0.conf here
   docker compose up -d
   ```

4. **Verify Health**:
   ```bash
   curl -s http://localhost:2358/about
   ```

5. **Connect to Intervu API**:
   In your API environment variables (on Render or in your .env):
   ```env
   JUDGE0_URL=http://your-server-ip:2358
   # or with SSL/domain: https://judge0.yourdomain.com
   ```
