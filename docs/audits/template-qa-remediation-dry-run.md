# Template QA Remediation — Dry Run

**Status:** dry run only. Nothing has been written to the database. Snapshot of the live database taken 2026-10-08 07:09 UTC (read-only).
Source audit: `curriculum-audit-2026-10-07.json` (1,186 active templates).  Machine-readable plan with full before/after values: `template-qa-remediation-plan.json`.  Author work list: `AUTHOR_REQUIRED.md`.

## 1. Findings the audit did not report (need a decision first)

1. **Corrupted MANUAL answer keys (critical).** A bulk edit on 2026-10-05 (no script in the repo) re-lettered `structure.correctAnswer`, `config.correctAnswer/correctOptionKey/correctOption` and appended `Correct Answer: Option X` to the solution text without moving the figures. Proven on two items: `TEMPLATE_MATRIX_XOR_COMBINATION_OF_FIGURES_01` (reasoning and the solving image are option A, key says C) and `TEMPLATE_ODD_FIGURES_COMPOSITE_STRUCTURAL_ANOMALY_01` (reasoning and `isCorrect` say D, key says B). **127 MANUAL templates** carry an untrustworthy key. 19 of their questions were served 46 times in 9 submitted test instances (2026-10-06 → 2026-10-08), so some candidates may have been scored against a wrong key.
2. **Visual MANUAL items with blank options.** 77 templates show four choices labelled only 'Option A–D' (no text, no image). For 70 of them the option images exist in storage (`…/qN_opt_a..d.png`) but were never linked. The audit flagged only 13.
3. **Deactivation does not stick for MANUAL templates.** `TemplateService.syncAllManualTemplatesToQuestionBank()` runs on every API boot, iterates *all* MANUAL/SVG templates (no `isActive`/`deletedAt` filter) and hard-codes `status: "ACTIVE"` on their Question rows. The allocator selects Question rows by `status: ACTIVE` only. Separately, **96 ACTIVE questions already belong to inactive or deleted templates** (66 VARIABLE soft-deleted, 27 VARIABLE inactive, 3 MANUAL/SVG deleted) and are selectable today.
4. **`gcd`/`lcm` are rejected by the production generator.** `ParameterGeneratorService.extractReferencedVariables` treats any name not in its reserved-word list as an unknown variable, so HCF/LCM templates using `gcd()` fail every generation.
5. **Concept codes are frozen inside published history.** The codes the audit wants renamed/merged appear in `ExamConfigVersion.snapshot`, `assembly_versions.snapshot`, `exam_version_questions`, `exam_version_sections.topic_distribution_json` and `TestInstanceQuestion.questionSnapshot`. `CODING-DECODING` is also a `Topic.code`. Renaming live rows would leave published versions pointing at codes that no longer exist.
6. **Audit false positives.** 24 of the 25 'DATASET template has no datasetId' items are linked through `TemplateDatasetConfig` (what `DatasetGenerationStrategy` actually reads); the audit only looked at the legacy JSON. The re-audit must use the relational link.
7. **The runtime path is not the path the audit simulated.** Exam assembly calls `generation-ai/GenerationRetryService`, where VARIABLE questions are written by the LLM from the hydrated stem; the answer is computed by the model, not read from `solutionSchema`. The audit's `ParameterGenerator + QuestionInstantiator` path is the deterministic one (generation module). Both read the stem from `structure.questionTemplate → questionStatement → prompt`, so the stem migration fixes both; the answer fix only binds the deterministic path (the AI path receives it as the 'Correct Answer Value' hint).
8. A batch job rewrote ~315 Question rows between 07:14–07:17 UTC today — that was the boot-time sync in (3), not a concurrent editor. The apply step will still re-read each record and refuse to write if `updatedAt` moved since the snapshot.

## 2. Classification of all 1,186 active templates

| Category | Templates | of which audit-INVALID |
|---|---|---|
| VALID | 339 | 0 |
| AUDIT_FALSE_POSITIVE | 24 | 24 |
| NON_BLOCKING_ONLY | 135 | 0 |
| AUTO_FIXABLE | 200 | 126 |
| AUTO_FIXABLE_REVIEW | 207 | 69 |
| AUTHOR_REQUIRED | 240 | 125 |
| FIXTURE | 41 | 41 |

| Strategy | VALID | AUDIT_FALSE_POSITIVE | NON_BLOCKING_ONLY | AUTO_FIXABLE | AUTO_FIXABLE_REVIEW | AUTHOR_REQUIRED | FIXTURE |
|---|---|---|---|---|---|---|---|
| VARIABLE | 0 | 0 | 50 | 120 | 69 | 111 | 24 |
| MANUAL | 0 | 0 | 3 | 44 | 138 | 127 | 1 |
| DATASET | 338 | 24 | 25 | 0 | 0 | 2 | 0 |
| CODING_PATTERN | 1 | 0 | 57 | 36 | 0 | 0 | 16 |

- **VALID** – untouched (339).  **AUDIT_FALSE_POSITIVE** – no change needed.  **NON_BLOCKING_ONLY** – generates correctly; only key-format/explanation-style findings.
- **AUTO_FIXABLE** – repaired purely from data already in the record.  **AUTO_FIXABLE_REVIEW** – repaired from the record plus a derivation shown per item (answer variable chosen, or static item solved); listed for sign-off.
- **AUTHOR_REQUIRED** – information is missing or untrustworthy; nothing is changed, item goes to `AUTHOR_REQUIRED.md`.  **FIXTURE** – deactivated.

## 3. Proposed changes

### 3.1 Fixtures to deactivate (`isActive=false`, never deleted)

| templateKey | Name | Strategy | conceptKey |
|---|---|---|---|
| cms79il2m0005m5z10mn17c08 | Test Template | VARIABLE | TEST_FRACTION |
| tpl_meta_1787568166096 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1787568165098 |
| cmssuufjy0001xmdub3lxodi7 | DB Persistence Test Template | VARIABLE | db-persistence-test |
| tpl_privacy_1787568168065 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1787568168065 |
| tpl_meta_1787641998111 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1787641996281 |
| tpl_privacy_1787642001322 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1787642001322 |
| audit_template_time_work_easy | Audit Template time_work easy | VARIABLE | time_work |
| audit_template_time_work_medium | Audit Template time_work medium | VARIABLE | time_work |
| audit_template_percentages_easy | Audit Template percentages easy | VARIABLE | percentages |
| audit_template_percentages_medium | Audit Template percentages medium | VARIABLE | percentages |
| cmssuufek000113ex7kczivhk | Question Test Template | VARIABLE | q-gen-test |
| audit_template_probability_easy | Audit Template probability easy | VARIABLE | probability |
| cmssuufkv0001r1kh4crfnzle | Preview Test Template | VARIABLE | preview-test |
| audit_template_probability_medium | Audit Template probability medium | VARIABLE | probability |
| audit_template_profit_loss_easy | Audit Template profit_loss easy | VARIABLE | profit_loss |
| audit_template_averages_easy | Audit Template averages easy | VARIABLE | averages |
| audit_template_averages_medium | Audit Template averages medium | VARIABLE | averages |
| audit_template_profit_loss_medium | Audit Template profit_loss medium | VARIABLE | profit_loss |
| tpl_meta_1787911373980 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1787911371543 |
| tpl_privacy_1787911378271 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1787911378271 |
| cmsecs8k70017nnxemiqc5keg | New Templatet test | VARIABLE | CONCEPT_NODE_BACKEND |
| tpl_meta_1788947168430 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1788947163505 |
| tpl_privacy_1788947174393 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1788947174393 |
| tpl_privacy_1789096308117 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1789096308117 |
| audit_template_percentages_hard | Audit Template percentages hard | VARIABLE | percentages |
| audit_template_probability_hard | Audit Template probability hard | VARIABLE | probability |
| tpl_meta_1789096296552 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1789096288441 |
| audit_template_time_work_hard | Audit Template time_work hard | VARIABLE | time_work |
| one | template 1 | VARIABLE | CONCEPT_REACT_FRONTEND |
| audit_template_averages_hard | Audit Template averages hard | VARIABLE | averages |
| audit_template_profit_loss_hard | Audit Template profit_loss hard | VARIABLE | profit_loss |
| cmui9q12r00883l7s9jwclosr | New Template | VARIABLE | default_concept |
| cmuiarc870003w0zu8mmw7man | New Test Template | VARIABLE | default_concept |
| tpl_meta_1791372618582 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1791372617582 |
| tpl_privacy_1791372619418 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1791372619418 |
| verify_eval_tpl_1790918230279 | Legacy Template | VARIABLE | percentages |
| cmu6wbqsi0001569mo58ezl4u | New Template | MANUAL | IMG |
| tpl_meta_1791179914809 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1791179913989 |
| tpl_privacy_1791179915568 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1791179915568 |
| tpl_meta_1791350160105 | Coding Template | CODING_PATTERN | ARRYA_SPECMETA_1791350159016 |
| tpl_privacy_1791350161782 | Prime Template | CODING_PATTERN | CONCEPT_privacy_1791350161782 |

Plus: archive (status `ARCHIVED`) the 10 Question rows generated from `audit_template_percentages_*`, and the 96 ACTIVE questions whose template is inactive/deleted (Finding 3).

### 3.2 Template repairs

| Repair (mechanical, meaning-preserving) | Templates |
|---|---|
| LETTER_FREE_EXPLANATION | 176 |
| MIGRATE_LEGACY_STEM | 96 |
| FLAT_VARSCHEMA | 71 |
| CONSTRAINT_SEVERITY | 33 |
| ANSWER_FROM_EXISTING_KEY | 24 |
| MANUAL_STEM | 6 |
| OPTION_EXPRESSIONS | 4 |
| NL_CONSTRAINTS (constraints) | 2 |
| NL_CONSTRAINTS (variableSchema.generationStrategyConfig) | 2 |

Plus `difficulty := difficultyLevel` on 36 templates (every selector reads `difficultyLevel`; the API always writes both equal, these drifted to the column default).

Repair kinds: `MIGRATE_LEGACY_STEM` question/options/answer-index from `structure.questionText`/`config.prompt` into `structure.questionTemplate`+`questionStatement`, `optionsTemplate`, `solutionSchema.correctOptionIndex` (legacy copies removed, one source of truth). `FLAT_VARSCHEMA` map-style variable schema → `variables[]`, pinned to the authored defaults where the options are fixed text. `ANSWER_FROM_EXISTING_KEY` existing `solutionSchema.correctAnswer` → index/variable. `ANSWER_TIER_B` answer bound to a derived variable named `answer`, to the derived variable shown as option 0, or to a static item solved by hand (derivation in the plan). `OPTION_EXPRESSIONS` `{{area + 22}}` → derived `opt_expr_n`. `SINGLE_BRACE` `{x}` → `{{x}}`. `NL_CONSTRAINTS` prose rules on variable-free items moved to `authorNotes`. `CONSTRAINT_SEVERITY` `severity:'critical'` on executable rules. `MANUAL_STEM` `config.statement` → `config.questionText`/`structure.stem`. `LETTER_FREE_EXPLANATION` 'Option A'/'Figure B' references → 'the correct option' (options are shuffled per candidate).

### 3.3 Generation verification of the proposed after-images (production services, in memory)

`ParameterGeneratorService` + `QuestionInstantiatorService` from `apps/api`, 40 generations per template, current record vs proposed record.

| Metric | Value |
|---|---|
| VARIABLE templates with proposed edits (kept) | 189 |
| Generations run (after) | 7560 |
| Templates clean 40/40 BEFORE | 0 |
| Templates clean 40/40 AFTER | 185 |
| Withheld (>10% failures after fix) → author | 8 |

Checks per generation: no exception, non-empty stem, no `{{x}}`/`{x}` left, no NaN/Infinity, ≤4 decimals, distinct options, answer present exactly once. I hand-checked one rendered sample of every review-tier template for mathematical correctness (all correct); impossible-value cases (36.6 coins, 1621.3 workers, 9:9 ratios) are listed as author items.

### 3.4 Dataset items (15) — author-required

All 15 have the correct answer duplicated (e.g. `NEDRAG` twice for GARDEN reversed). The lost distractor is not recoverable from the data; no item is changed.

### 3.5 Curriculum

- **Archive (status INACTIVE) test topics/concepts, none mapped to any exam section:** 8 × `Meta Topic …`, 8 × `Topic privacy_…`, `Data Structures e2e_…`, `A Testing Topic`, `m m`.
- **Needs your confirmation:** `A - IMAGE BASED QUE` and `A a- IMAGE BASED QUE new` (3 templates, 6 active questions, not in any section) look like image-feature sandboxes.
- **Duplicate concepts (23 pairs, same name, same topic):** created by the 2026-10-07 `VR_*` seed alongside the 2026-09-30 concepts. Semantically identical. Merge = repoint `Template.conceptKey`, `GeneratedQuestion.conceptKey`, `Question.conceptId`, then set the duplicate INACTIVE. Blocked by Finding 5 — see decision B.
- **Code renames:** `CAUSE-EFFECT_RELATIONSHIP`, `CODING-DECODING`, `RULE-BASED_REASONING` → UPPER_SNAKE. Blocked by Finding 5 — see decision B.
- **Empty concepts:** 9 are genuine curriculum concepts with no content (Hidden Figures ×3, Complete the Pattern ×2, ProfitChange, ProfitRatio, CI yearly Interest, Vocabulary Usage) → `AUTHOR_REQUIRED.md`; 2 are the empty halves of duplicate pairs; `Percentage` under *Reasoning Ability (General)* looks misplaced — reported, not moved.
- **Difficulty coverage (520 concepts):** no curriculum/exam config requires all three levels per concept (difficulty is distributed per section). Reported per concept; no filler content created.
- **Section mapping:** `MULTI_CRITERIA_TRADEOFFS` is under *Decision Making (Reasoning)*, mapped to Critical Reasoning / Reasoning Ability sections — correct, no change.

### 3.6 Code changes required for the fixes to hold

1. `template.service.ts` `syncManualTemplateToQuestionBank`: set `status` to `ARCHIVED` when the template is inactive or soft-deleted (today it forces `ACTIVE`).
2. `parameter-generator.service.ts` `extractReferencedVariables`: allow mathjs functions `gcd`, `lcm`, `isInteger`, `nthRoot`, `log10`, `combinations`, `permutations`, `factorial`.

## 4. Safety

- Backup: full before-image of every touched row is in the plan JSON; the apply script also exports the live rows to `docs/audits/backup/` immediately before writing.
- One transaction per batch; each row is re-read and skipped if `updatedAt` changed since the snapshot. No hard deletes. Historical tables (test instances, published versions, snapshots) are never written.
- VALID templates: zero writes. Templates with any blocking author item: zero writes (no half-fixes).
- After apply: rerun the 40× generation check from the database, re-run the audit with a corrected checker (relational dataset links, MANUAL key consistency, option media), write `template-qa-remediation-report.md`.

## 5. Applied so far

### Batch 1 — 2026-10-08 (approved: fixtures + leaked questions; pull untrustworthy-key MANUAL items)

- Backup: `docs/audits/backup/2026-10-08-batch1-before.json` (full rows of 168 templates and 225 questions). Script: `docs/audits/backup/apply-batch1.cjs`.
- Guard: 0 of 168 templates had changed since the snapshot. One transaction.
- `Template.isActive=false`: 168 (41 fixtures + 127 MANUAL with untrustworthy or blank answer keys).
- `questions.status=ARCHIVED`: 225 (questions of those templates plus every ACTIVE question whose template was already inactive or soft-deleted).
- Verified with the production filters: pulled templates selectable = 0; ACTIVE questions from pulled templates = 0; ACTIVE questions with inactive/deleted template = 0; other templates touched = 0; active templates 1,186 → 1,018.
- Code (not yet deployed): `TemplateService.syncManualTemplateToQuestionBank` and `ExamConfigReadinessService.syncManualTemplatesForTopics` now write `ARCHIVED` instead of `ACTIVE` for inactive or soft-deleted templates. **Until deployed, the next API boot or readiness check re-activates the 128 MANUAL questions.**

### Still exposed (not covered by batch 1)

| Where | Bad-key MANUAL | Fixture | Previously leaked |
|---|---|---|---|
| READY pregenerated instances (of 638) | 355 | 18 | 583 |
| ACTIVE published versions | 1 (Qloax Assessment v2) | 10 (Infosys Standard Fresher/SE v1) | 3 (Qloax Assessment v2) |
| Submitted attempts already scored | 19 questions × 46 servings in 9 attempts | – | – |
