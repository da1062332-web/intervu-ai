# 10 Candidates MNC2026 Coupon Load Test Execution Report

**Execution Target:** SkillitriX Live Render Backend (`https://skillitrix.onrender.com/api/v1`)  
**Coupon Code:** `MNC2026` (Unlocks: TCS NQT Placement Assessment)  
**Total Candidates:** 10  

---

### Core Performance Metrics

| Metric | Attempted | Successful | Failed | Error % | 429 | 4xx | 5xx | Timeouts | p50 | p95 | Max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Candidate Signup & Flow** | 10 | 10 | 0 | 0.00% | 0 | 0 | 0 | 0 | 1730ms | 2172ms | 2324ms |

### Endpoint Breakdown
- **Signups Successful:** 10 / 10
- **Logins Successful:** 10 / 10
- **Auth /me Verifications:** 10 / 10
- **Referral Status Queries:** 10 / 10
- **Dashboard Entitlements:** 10 / 10
- **Assessments Started:** 10 / 10

### Latency Profiles
- **Signup:** p50=1730ms, p95=2172ms, max=2324ms
- **Login:** p50=1529ms, p95=2573ms, max=3100ms
- **Assessment Start:** p50=6086ms, p95=6791ms, max=6955ms
