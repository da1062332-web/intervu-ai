# Judge0 on AWS EC2

> Full guide (specification, Java metaspace patch, capacity model and cost plan):
> [docs/infrastructure/judge0-aws-implementation-guide.md](../../docs/infrastructure/judge0-aws-implementation-guide.md).

Production Judge0 for the Intervu API (Render, `singapore`), running on EC2 in
`ap-south-1` from `~/judge0` on the host. Replaces the local
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
| Region | `ap-south-1` (Mumbai) today; `ap-southeast-1` would sit next to the Render API |
| AMI | Ubuntu Server 24.04 LTS (x86_64); never run `do-release-upgrade` (it drops cgroup v1) |
| Type | `m7i-flex.large` (2 vCPU) day to day; resize to a `c6i` size for exams (guide, section 9) |
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

- Judge0 sizes itself from the vCPU count at container start
  (`RAILS_MAX_THREADS = nproc`, `COUNT = 2 × nproc` workers), so a resize needs
  no config change. Judge0 1.13.1 has no `N_WORKERS` setting.
- The API sends each Run/Submit as one batch (`POST /submissions/batch`) and
  polls, so code runs in the `workers` container, not in web threads.
- The current 2-vCPU instance handles about 50–80 concurrent candidates. Resize
  before a large exam and run `apps/api/scripts/load-test-judge0.ts` on the new
  size first.
- Stop the instance between exam windows to save cost. The Elastic IP and data
  persist, and containers come back on boot via `restart: always`.

## Logging

Judge0 1.13.1 logs at debug level and prints every request's full source code,
stdin and expected output. `log-filter.rb` is mounted into `server` and
`workers` as a Rails initializer: it filters those fields to `[FILTERED]` and
drops the level to `INFO` (no SQL lines). Every container's log is also capped
at 3 × 10 MB (`x-logging` in `docker-compose.yml`). Changes to either need
`docker compose up -d`, since a restart does not recreate the containers.

## Operations

```bash
docker compose logs -f server workers   # live logs
docker compose pull && docker compose up -d   # upgrade images
docker compose restart workers          # recover stuck workers
```
