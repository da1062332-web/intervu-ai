# Judge0 Capacity and Cost Plan for a 500-Candidate Exam

| | |
| :--- | :--- |
| **System** | Intervu AI assessment platform |
| **Component** | Code execution sandbox (Judge0 CE `1.13.1`) on AWS EC2, `ap-south-1` |
| **Exam format** | 130-minute exam; final section is coding, 2 questions × 20 minutes |
| **Target** | 500 candidates in the coding section at the same time |
| **Basis** | Load tests on `m7i-flex.large`, 7 October 2026 ([implementation guide, section 9](judge0-aws-implementation-guide.md#9-capacity-model-sizing-by-requests)) |
| **Pricing basis** | AWS on-demand Linux, `ap-south-1`, October 2026; INR at about ₹88 per $1 |

This document answers three questions for the exam format above:

1. How many candidates can the current Judge0 server handle (sections 2–4)?
2. What is needed to serve 500 candidates, and how can we optimize it (sections 5–6)?
3. What does the 32 vCPU instance cost (sections 7–8)?

Section 9 is the exam-day checklist and section 10 lists the open items.

---

## 1. Summary

- **Today's limit.** The current server (`m7i-flex.large`, 2 vCPU) handles about **50 candidates** in a Java-heavy coding section, or about **300** if most candidates write Python. If everyone clicks Run at the same moment, it handles about **25 Java** candidates.
- **What 500 candidates need.** Use **`c6i.8xlarge` (32 vCPU)** during the exam window, plus three config fixes (section 6.2). Without those fixes, 500 candidates hit "at capacity" errors on any instance size.
- **Cost.** About **$4.30 (≈ ₹380) per exam**, or under ₹1 per candidate, if the instance runs only for the exam window. Left running all month, it costs about **$1,000 (≈ ₹88,000)**.
- **Optimizations.** A Run cooldown, background grading for Submit and staggered starts reduce the load spikes. A cheaper Java compile step could make a 16 vCPU instance (about $2.15 per exam) enough.

---

## 2. Exam profile and assumptions

Only the coding section uses Judge0, so the 90 minutes before it do not add load. All candidates reach the coding section together, so its load falls into one 40-minute window.

| Parameter | Value | Source |
| :--- | :--- | :--- |
| Coding window | 2 questions × 20 min = **40 min (2,400 s)** | Exam format |
| Actions per question | 5 Runs + 1 Submit | Planning baseline, guide §9.2 |
| Executions per action | **1** per Run or Submit (Java/Python driver runs all test cases in one execution) | Guide §2 |
| Executions per candidate | 2 × (5 + 1) = **12** | |
| Peak factor | **2×** (more clicks near deadlines than mid-question) | Guide §9.2 |
| CPU per execution | Java **~3 s**, Python **~0.5 s** | Measured, guide §9.1 |
| Judge0 budget | Run **40 s** ([coding-execution.service.ts:25](../../apps/api/src/modules/coding/services/coding-execution.service.ts#L25)), Submit **110 s** ([submission-evaluator.service.ts:13](../../apps/api/src/modules/coding/services/submission-evaluator.service.ts#L13)) | Code |
| Server behaviour | CPU-bound: throughput ≈ vCPU ÷ CPU seconds per execution | Measured, guide §9.1 |
| Safe load | 80% of throughput | Guide §9.3 |

The API also waits at most 45 s for a Run and 120 s for a Submit, including time in its own queue ([coding-execution.controller.ts:29-30](../../apps/api/src/modules/coding/controllers/coding-execution.controller.ts#L29-L30)). The figures below use the shorter 40 s and 110 s budgets, so they are slightly conservative.

**Demand per candidate during the coding section:**

```
12 executions ÷ 2,400 s × 2 (peak factor) = 0.01 executions/s per candidate
```

That is 2.3× the per-candidate rate of the 90-minute model in the implementation guide (0.0044/s), because the same work is packed into 40 minutes.

---

## 3. Capacity of the current instance

`m7i-flex.large`, 2 vCPU. Throughput is about **0.67 Java executions/s** (measured 0.64) or **4 Python executions/s** (measured 3.93).

There are three load patterns to check:

| Load pattern | Formula | Java | Python |
| :--- | :--- | :--- | :--- |
| **Spread out**: clicks spread over the 40 minutes | throughput × 0.8 ÷ 0.01 | **~50** | **~300** |
| **Run burst**: everyone clicks Run within the same 40 s | vCPU × 40 s ÷ CPU per execution | **~25** | **~160** |
| **Submit burst**: everyone clicks Submit at the 20-minute deadline | vCPU × 110 s ÷ CPU per execution | **~70** | **~440** |

The smallest figure for the expected language mix is the real limit. For a Java-heavy exam, plan on **about 25–50 candidates** on the current server. The low end applies when Runs bunch together, for example right after a question opens.

---

## 4. Capacity by instance size

Throughput grows roughly in line with vCPU, which gives a rule of thumb per vCPU:

| Load pattern | Java candidates per vCPU | Python candidates per vCPU |
| :--- | :--- | :--- |
| Spread out | ~27 | ~160 |
| Run burst | ~13 | ~80 |
| Submit burst | ~37 | ~220 |

**Java-heavy coding section (40 minutes):**

| Instance | vCPU / RAM | Spread out | Run burst | Submit burst |
| :--- | :--- | :--- | :--- | :--- |
| `m7i-flex.large` (current) | 2 / 8 GiB | ~50 | ~25 | ~70 |
| `c6i.xlarge` | 4 / 8 GiB | ~105 | ~50 | ~145 |
| `c6i.2xlarge` | 8 / 16 GiB | ~210 | ~105 | ~290 |
| `c6i.4xlarge` | 16 / 32 GiB | ~425 | ~210 | ~585 |
| **`c6i.8xlarge`** | **32 / 64 GiB** | **~850** | **~425** | **~1,170** |
| `c6i.12xlarge` | 48 / 96 GiB | ~1,280 | ~640 | ~1,760 |

A Python-heavy exam supports about 6× these figures.

> Only the 2 vCPU row is measured. The larger rows are extrapolated on the assumption that throughput scales with vCPU. Run the load test (section 6.5) on the chosen size before relying on it.

---

## 5. What 500 candidates need

| Load pattern | Java | Python |
| :--- | :--- | :--- |
| Spread out: 500 × 0.01 = 5 executions/s | 5 × 3 s ÷ 0.8 ≈ **19 vCPU** | 5 × 0.5 s ÷ 0.8 ≈ **3 vCPU** |
| Run burst: 500 Runs within 40 s | 500 × 3 s ÷ 40 s ≈ **38 vCPU** | 500 × 0.5 s ÷ 40 s ≈ **6 vCPU** |
| Submit burst: 500 Submits within 110 s | 500 × 3 s ÷ 110 s ≈ **14 vCPU** | 500 × 0.5 s ÷ 110 s ≈ **2 vCPU** |

**Choice: `c6i.8xlarge` (32 vCPU).** It covers the spread-out load with plenty of headroom (~850 candidates) and the full Submit burst (~1,170). It covers about 425 of 500 in the worst-case Run burst. In practice all 500 candidates will not click Run in the same 40 seconds, and the Run cooldown (section 6.3) makes that pattern even less likely.

For a Python-heavy exam, `c6i.4xlarge` (16 vCPU) is more than enough.

---

## 6. Optimization plan

The tiers are in order of impact. Tiers 1, 2 and 5 are required for the first 500-candidate exam. Tiers 3 and 4 lower the cost and the risk of later exams.

### 6.1 Tier 1: resize for the exam window (no code change)

- Resize the instance to `c6i.8xlarge` before the exam and back down afterwards. The procedure is in the [implementation guide, section 8 "Resizing for a bigger exam"](judge0-aws-implementation-guide.md#resizing-for-a-bigger-exam). It takes about 5 minutes, and Judge0 sizes its workers from `nproc` on start-up (`COUNT` = 64 workers on 32 vCPU).
- Use a `c6i` (compute-optimized) instance, not `m7i-flex`. `m7i-flex` is not meant for every core running at 100% for 40 minutes.

### 6.2 Tier 2: config fixes required for 500 candidates

| # | Problem | Where | Fix |
| :--- | :--- | :--- | :--- |
| 1 | **Queue depth is exactly 500.** The limit counts waiting plus active jobs across all API instances. If 500 candidates submit at a deadline while Runs are queued, some get **503 "at capacity"**. | [render.yaml:56](../../render.yaml#L56), default in [code-execution-queue.service.ts:32](../../apps/api/src/modules/coding/services/code-execution-queue.service.ts#L32) | Raise `CODE_EXECUTION_MAX_QUEUE_DEPTH` to about **1,500**. |
| 2 | **Memory overcommit.** Every execution asks for 2 GB. 64 workers × 2 GB = 128 GB on a 64 GiB host. | [judge.service.ts:162](../../apps/api/src/modules/coding/services/judge.service.ts#L162) and [:501](../../apps/api/src/modules/coding/services/judge.service.ts#L501) | Lower the default `memory_limit` to **512 MB** (512000 KB). This still covers the 256 MB Java heap cap (guide §7). |
| 3 | **Dispatch slightly below worker count.** The API sends `CODE_EXECUTION_CONCURRENCY` × API instances = 20 × 3–6 = **60–120** executions to Judge0 at a time. A 32 vCPU host has **64** workers, so at the minimum of 3 API instances, 4 workers sit idle. | [render.yaml:54](../../render.yaml#L54) | Raise `CODE_EXECUTION_CONCURRENCY` to **30** (90–180 in flight). Judge0 queues anything beyond its workers (`MAX_QUEUE_SIZE` 2000). |

### 6.3 Tier 3: shape demand (removes the deadline spikes)

| Change | Effect | Effort |
| :--- | :--- | :--- |
| **Run cooldown per candidate** (for example, one Run per 10 s). Today Run only falls under the general `assessment` limit of 300 per minute per user ([config.service.ts:94-97](../../apps/api/src/config/config.service.ts#L94-L97)), which does not stop repeated clicking. | Caps the Run rate per candidate and limits the Run-burst pattern. | Small |
| **Grade Submit in the background.** Accept the Submit straight away, show "Submitted, grading…", and grade it on the queue with no request-time limit. | A deadline rush becomes a backlog that clears within a minute or two. No candidate sees a timeout on Submit. | Medium |
| **Staggered starts**, for example 5 waves of 100 candidates starting 5 minutes apart. | Spreads the 20-minute deadlines so they do not all land together. | Scheduling only |

### 6.4 Tier 4: lower Java's CPU cost (needs a test spike)

Each Java execution compiles the candidate's code and the ~13 KB generated driver with `javac`, which costs about 3 s of CPU (guide §11, item 9).

- **Idea:** ship the driver's helper classes **precompiled**, using Judge0's `additional_files`, so `javac` compiles only the candidate's class.
- **Uncertainty:** the saving is unknown until it is measured, because JVM start-up may dominate the 3 s.
- **Payoff:** if the cost halves to about 1.5 s, `c6i.4xlarge` (16 vCPU, about $2.15 per exam) becomes enough for 500 Java candidates.

### 6.5 Tier 5: prove it with a load test

Extend [load-test-judge0.ts](../../apps/api/scripts/load-test-judge0.ts) to simulate the real exam profile:

- 500 candidates with Runs spread over each 20-minute question;
- a Submit rush in the last 60 seconds of each question;
- `--concurrency` set to the API's in-flight limit after fix 3.

Run it on the resized instance before the first exam at this size, and never during an exam. Pass criteria: no timeouts, no 503s, and p95 Run latency under 20 s.

---

## 7. Cost of the 32 vCPU instance

### 7.1 Unit prices

| Item | Price |
| :--- | :--- |
| `c6i.8xlarge` (32 vCPU, 64 GiB) | **$1.36 / hour** (≈ ₹120/h) |
| 40 GB `gp3` disk + Elastic IP | **$7.30 / month**, paid even when the instance is stopped |
| Data transfer | Negligible: under 1 GB per exam, normally inside the free 100 GB |

EC2 bills per second with a 60-second minimum. A stopped instance costs nothing for compute.

### 7.2 Cost per exam

Billed window: 30 min warm-up + 130 min exam + 30 min buffer = **190 min (3.17 h)**.

| | Calculation | Cost |
| :--- | :--- | :--- |
| Compute per exam | 3.17 h × $1.36 | **≈ $4.30** (≈ ₹380) |
| Per candidate (500) | $4.30 ÷ 500 | **≈ $0.009** (under ₹1) |

### 7.3 Monthly scenarios

| Scenario | Calculation | Monthly |
| :--- | :--- | :--- |
| 4 exams, stopped between exams | 4 × $4.30 + $7.30 | **≈ $25** (≈ ₹2,200) |
| 10 exams, stopped between exams | 10 × $4.30 + $7.30 | **≈ $50** (≈ ₹4,400) |
| 20 exams, stopped between exams | 20 × $4.30 + $7.30 | **≈ $93** (≈ ₹8,200) |
| Current small instance 24×7 for practice and demos, resized to 32 vCPU for 10 exams | $80 + 10 × ($4.30 − $0.32) | **≈ $120** (≈ ₹10,500) |
| 32 vCPU left running 24×7 | 730 h × $1.36 + $7.30 | **≈ $1,000** (≈ ₹88,000) |

The $0.32 in the hybrid row is what the small instance would have cost for the same 3.17 hours.

### 7.4 Comparison of sizes for one exam

| Instance | vCPU | Per exam | Suits 500 candidates? |
| :--- | :--- | :--- | :--- |
| `c6i.4xlarge` | 16 | ≈ $2.15 | Python-heavy exams; Java only after tiers 3 and 4 |
| **`c6i.8xlarge`** | **32** | **≈ $4.30** | **Yes, including Java-heavy exams** |
| `c6i.12xlarge` | 48 | ≈ $6.50 | More headroom than needed |

---

## 8. Cost safeguards

The main cost risk is forgetting to downsize or stop the instance after an exam. Each extra day at 32 vCPU costs about **$33 (≈ ₹2,900)**.

| Safeguard | Setting |
| :--- | :--- |
| AWS Budget alert | Monthly budget of $50, with email alerts at 80% and 100% |
| CloudWatch idle alarm | Stop the instance when average CPU stays below 5% for 3 hours |
| Elastic IP check | Confirm `15.252.223.20` is an Elastic IP before relying on stop/start (guide §11, item 6) |

---

## 9. Exam-day checklist

**One-off, before the first 500-candidate exam**

- [ ] Apply the three config fixes in section 6.2 and deploy the API.
- [ ] Add the Run cooldown (section 6.3).
- [ ] Set up the budget alert and the idle alarm (section 8).
- [ ] Resize to `c6i.8xlarge` and run the section 6.5 load test. Record the results in guide §9.1.

**Each exam**

| When | Step |
| :--- | :--- |
| T − 45 min | Resize to `c6i.8xlarge` and start the instance |
| T − 30 min | Smoke test: on-host `print(42)` check and an authenticated call over TLS (guide §6) |
| T − 30 min | Confirm `GET /workers` shows 64 workers |
| During the coding section | Watch `vmstat 1` on the host and the API logs for 503 and timeout errors |
| T + 130 min + 30 min buffer | Stop the instance or resize it back to `m7i-flex.large` |
| Next day | Check the AWS bill shows only the exam window |

---

## 10. Open items and caveats

1. **Larger sizes are extrapolated.** Every figure above 2 vCPU assumes throughput scales with vCPU. The section 6.5 load test confirms or corrects this.
2. **Prices change.** Confirm the `c6i.8xlarge` price in the AWS Pricing Calculator before setting a budget. The INR figures use about ₹88 per $1.
3. **Usage assumptions.** The plan assumes 5 Runs per question. If candidates run code much more often, demand rises in proportion; the Run cooldown keeps it bounded.
4. **Language mix.** Java costs 6× more than Python per execution. If the mix is known before the exam, size for it using the section 4 table.
5. **Single instance.** There is still no auto-recovery or failover (guide §11, item 4). Creating an AMI of the working host before the first large exam lets a replacement start within minutes.
