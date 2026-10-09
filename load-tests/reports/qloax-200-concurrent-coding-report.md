```

================================================================================
  k6 REPORT — 200 CONCURRENT CODING CANDIDATES (run k6-cc200-1791526777)
================================================================================
Target API:                https://skillitrix.onrender.com/api/v1
Assessment:                cmsifafam000099s9csfe33pg
Duration:                  1505s   HTTP requests: 6519
Language mix:              20% Java / 80% Python
--------------------------------------------------------------------------------
CANDIDATES
  Registered:              200 / 200
  Started assessment:      200 / 200
  In waiting room at burst:200  (late: 0)
  Finished assessment:     92  (completion 46.00%)
--------------------------------------------------------------------------------
CODE EXECUTION
  Runs / Submits:          1807 / 400
  Success rate (all):      3.81%
  Success rate (burst):    41.00%
  Runs slower than 45s:    1266
--------------------------------------------------------------------------------
LATENCY
  Burst run (all at once): avg=37774ms p50=45312ms p90=45519ms p95=45579ms p99=45987ms max=46005ms
  Run (all):               avg=34113ms p50=45113ms p90=45252ms p95=45406ms p99=120000ms max=120001ms
  Submit:                  avg=71702ms p50=120000ms p90=120001ms p95=120001ms p99=120001ms max=120009ms
  Start test:              avg=9065ms p50=9051ms p90=9317ms p95=9403ms p99=9651ms max=9931ms
  Heartbeat:               avg=182ms p50=120ms p90=189ms p95=979ms p99=1102ms max=1848ms
  Finish assessment:       avg=6211ms p50=4820ms p90=17187ms p95=17236ms p99=60001ms max=60001ms
  /health probe:           avg=171ms p50=113ms p90=165ms p95=212ms p99=421ms max=10000ms
--------------------------------------------------------------------------------
ERRORS & STABILITY
  2xx / 4xx / 429:         4065 / 0 / 0
  5xx total (502 / 503):   1753 (0 / 511)
  Conn failures/timeouts:  478
  /health availability:    99.55%
  API process restarts:    0
================================================================================

```
