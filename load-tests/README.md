# Load tests

`k6-2000-candidates.js` is the "prove it" step from the concurrency
readiness audit: it drives the **real public API** — signup/login, starting
an attempt, repeated autosave, an optional real Judge0 coding submission,
and a final submit — ramping up to a configurable number of concurrent
virtual users (default 2,000). This is deliberately different from the
existing scripts in `scratch/` (`sustained-load.js`, `burst-test.js`,
`concurrency-sweep-post.js`), which call Judge0 directly, skip auth and the
API entirely, and never exceed 100 simulated users — none of them can
answer whether the deployed system holds up for a real exam session.

## Prerequisites

1. Install [k6](https://k6.io/docs/get-started/installation/) — it's a
   standalone binary, not an npm package.
2. **Run this against staging, never production.** It creates real candidate
   accounts (`loadtest-*@skillitrix-loadtest.invalid`) and real assessment
   attempts.
3. Have a real, published `testConfigId` in that environment (and,
   optionally, a real coding `questionId` if you want the coding-submission
   scenario included — otherwise that part is skipped).

## Running it

```bash
k6 run \
  -e BASE_URL=https://staging.skillitrix.com/api/v1 \
  -e TEST_CONFIG_ID=<test-config-uuid> \
  -e CODING_QUESTION_ID=<coding-question-uuid> \
  -e MAX_VUS=2000 \
  load-tests/k6-2000-candidates.js
```

Useful overrides:

| Env var               | Default | Meaning                                                        |
| ---------------------- | ------- | ---------------------------------------------------------------- |
| `MAX_VUS`               | `2000`  | Peak concurrent virtual users                                    |
| `CODING_VU_FRACTION`    | `0.2`   | Share of VUs that also run a coding submission                   |
| `AUTOSAVE_ROUNDS`       | `6`     | Autosave calls per candidate before submit                       |
| `SECTION_ADVANCES`      | `1`     | Section-advance calls per candidate, spaced evenly across the autosave rounds |
| `SIGNUP_PASSWORD`       | —       | Password used for the load-test accounts it creates              |

## Reading the results

The script fails its built-in thresholds (see `options.thresholds` in the
script) if: more than 1% of requests error, autosave's p95 latency exceeds
2s, or submit's p95 exceeds 5s. It also tracks `http_503_capacity_rejections`
— the new code-execution queue's backpressure valve returning 503 under load
is expected and healthy at some volume; a wall of 5xx from the *rest* of the
API (autosave, submit) is not, and indicates the database connection pool or
transaction path is the thing buckling.

Start well below 2,000 (e.g. `MAX_VUS=200`) to validate the script and your
staging environment's data before running the full ramp.

## What this doesn't cover

- It doesn't measure the actual Judge0 tunnel's real-world reliability under
  load — that depends on infrastructure outside this repo (see the
  concurrency readiness audit's Phase 01: move Judge0 off the local-machine
  ngrok tunnel first).
- It doesn't exercise the admin live-monitoring dashboard concurrently. Run
  it open in a browser tab during a load test to sanity-check the dashboard
  stays responsive too.
