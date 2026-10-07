# Judge0 on AWS EC2

Production Judge0 for the Intervu API (Render, `singapore`). Replaces the local
Docker + ngrok tunnel (`start-judge0-tunnel.bat`).

```
Render intervu-api ──HTTPS + X-Auth-Token──▶ EC2 (Elastic IP)
                                              └─ Caddy :443 ─▶ Judge0 server :2358
                                                               Judge0 workers (isolate, privileged)
                                                               Postgres + Redis (local, internal only)
```

## Why EC2 and not ECS Fargate / App Runner

Judge0 runs code inside `isolate`, which needs **privileged containers** and
**cgroup v1**. Fargate and App Runner do not allow privileged containers, and
Amazon Linux 2023 is cgroup v2 only. Use **Ubuntu 22.04 on EC2**.

## 1. Launch the instance

| Setting | Value |
| --- | --- |
| Region | `ap-southeast-1` (Singapore), next to the Render API |
| AMI | Ubuntu Server 22.04 LTS (x86_64) |
| Type | `c6i.4xlarge` (16 vCPU / 32 GB) for live exams; `c6i.2xlarge` for staging |
| Storage | 40 GB gp3 |
| Elastic IP | Allocate and associate one, so the address survives restarts |

Security group inbound rules:

| Port | Source | Purpose |
| --- | --- | --- |
| 22 | Your IP only | SSH |
| 80 | 0.0.0.0/0 | Let's Encrypt HTTP challenge |
| 443 | 0.0.0.0/0, or Render's Singapore outbound IP ranges | Judge0 API |

Do **not** open 2358. It is bound to localhost and fronted by Caddy.

## 2. Prepare the host

```bash
scp -r deploy/judge0 ubuntu@<elastic-ip>:~/
ssh ubuntu@<elastic-ip>
bash ~/judge0/bootstrap-ec2.sh   # enables cgroup v1
sudo reboot
# reconnect, then:
bash ~/judge0/bootstrap-ec2.sh   # verifies cgroup v1, creates /opt/judge0
cp -r ~/judge0/. /opt/judge0/
```

## 3. Configure and start

```bash
cd /opt/judge0
cp .env.example .env
nano .env          # set JUDGE0_DOMAIN, POSTGRES_PASSWORD, AUTHN_TOKEN (openssl rand -hex 32)
docker compose up -d
```

`JUDGE0_DOMAIN` must resolve to the Elastic IP before Caddy can get a
certificate. Use a DNS A record (`judge0.yourdomain.com`) or, with no domain,
`<elastic-ip-with-dashes>.sslip.io` (for example `13-250-1-2.sslip.io`).

## 4. Verify

```bash
# On the box: Judge0 healthy and sandbox working
curl -s http://localhost:2358/about
curl -s -X POST "http://localhost:2358/submissions?wait=true" \
  -H "Content-Type: application/json" -H "X-Auth-Token: $(grep AUTHN_TOKEN .env | cut -d= -f2)" \
  -d '{"source_code":"print(42)","language_id":71}'
# Expect "status":{"id":3,"description":"Accepted"} and "stdout":"42\n"

# From your laptop: TLS and auth
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<JUDGE0_DOMAIN>/submissions \
  -H 'Content-Type: application/json' -d '{}'   # expect 401 (no token)
```

If submissions return status 13 (Internal Error) with a cgroup message, the
host is still on cgroup v2. Re-run `bootstrap-ec2.sh`.

## 5. Point the API at it

On the `intervu-api` Render service, set:

```env
JUDGE0_URL=https://<JUDGE0_DOMAIN>
JUDGE0_AUTH_TOKEN=<same value as AUTHN_TOKEN>
```

`judge.service.ts` already sends `X-Auth-Token` when `JUDGE0_AUTH_TOKEN` is set.
Redeploy, run a coding question end to end, then retire the ngrok tunnel.

## Sizing

- `N_WORKERS` in `judge0.conf` is how many submissions run at once. Keep it near
  the instance's vCPU count; more workers than cores makes wall-time limits flaky.
- The API's queue concurrency (`CODE_EXECUTION_CONCURRENCY=20`) applies **per API
  instance**. With 3 to 6 Render instances, up to 60 to 120 submissions can reach
  Judge0 at once; the rest wait in Judge0's queue. If you see poll timeouts
  during load, raise `N_WORKERS` on a bigger instance or lower API concurrency.
- Stop the instance between exam windows to save cost. The Elastic IP and data
  persist, and containers come back on boot via `restart: always`.

## Operations

```bash
docker compose logs -f server workers   # live logs
docker compose pull && docker compose up -d   # upgrade images
docker compose restart workers          # recover stuck workers
```
