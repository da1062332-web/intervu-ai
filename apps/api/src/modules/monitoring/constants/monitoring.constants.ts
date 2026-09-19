export const MONITORING_CONFIG = {
  HEARTBEAT_INTERVAL_MS: 15000, // 15 seconds for scale
  HEARTBEAT_WARNING_THRESHOLD_MS: 30000, // 30 seconds
  HEARTBEAT_DISCONNECT_THRESHOLD_MS: 90000, // 90 seconds -> Mark DISCONNECTED (client heartbeat cadence is ~28s with p95 latency up to ~11s under load; 45s left almost no margin and caused false OFFLINE flags on candidates who were actively answering)
  PROLONGED_DISCONNECT_THRESHOLD_MS: 180000, // 180 seconds -> P1 Critical Alert
  SLOW_LATENCY_THRESHOLD_MS: 600, // 600ms latency -> SLOW
  HIGH_STRIKE_THRESHOLD: 3, // >= 3 strikes -> Needs Attention
  MAX_PROCTORING_STRIKES: 5, // 5 strikes -> Auto-submit
  ASSESSMENT_STORM_DISCONNECT_PERCENT: 0.10, // 10% active disconnect in 60s -> P0 Platform Incident
  REDIS_STATE_TTL_SECONDS: 180, // 3 minutes TTL for candidate live hash
  REDIS_ALERT_TTL_SECONDS: 86400, // 24 hours
  LOCK_RECOVERY_TTL_SECONDS: 15, // 15s distributed lock for resume
  MAX_RESUMES_PER_ATTEMPT: 3, // Max allowed resumes per attempt
  PROCTORING_VIOLATION_COOLDOWN_SECONDS: 5, // 5s debounce window per candidate & violation type
  ATTEMPT_METADATA_TTL_SECONDS: 14400, // 4 hours TTL for attempt metadata cache
  DB_FALLBACK_COOLDOWN_MS: 300000, // 5 minutes between watchdog DB-scan fallbacks when Redis index is empty
};

export const REDIS_KEYS = {
  activeAssessmentsIndex: () => "monitoring:active_assessments",
  attemptMetadata: (attemptId: string) => `monitoring:attempt_meta:${attemptId}`,
  attemptState: (assessmentId: string, attemptId: string) =>
    `assessment:${assessmentId}:attempt:${attemptId}:state`,
  assessmentActiveSet: (assessmentId: string) =>
    `assessment:${assessmentId}:active_attempts`,
  assessmentEventsChannel: (assessmentId: string) =>
    `assessment:${assessmentId}:events`,
  assessmentAlertsList: (assessmentId: string) =>
    `assessment:${assessmentId}:alerts`,
  recoveryLock: (attemptId: string) => `lock:recovery:${attemptId}`,
  candidateHeartbeat: (attemptId: string) => `attempt:${attemptId}:heartbeat`,
  assessmentStats: (assessmentId: string) => `assessment:${assessmentId}:stats`,
  assessmentStormTracker: (assessmentId: string) => `assessment:${assessmentId}:disconnect_storm`,
  proctoringCooldown: (attemptId: string, eventType: string) => `cooldown:proctoring:${attemptId}:${eventType}`,
};

export type CandidateLiveState =
  | "NOT_STARTED"
  | "STARTING"
  | "ACTIVE"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "SUBMITTING"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EVALUATING"
  | "COMPLETED"
  | "TERMINATED"
  | "ADMIN_REVIEW"
  | "RESUME_AUTHORIZED"
  | "RESUMED";

export type AlertSeverity = "P0" | "P1" | "P2" | "P3";

export type AlertCategory =
  | "PLATFORM"
  | "DISCONNECT"
  | "AUTOSAVE"
  | "PROCTORING"
  | "CODING"
  | "TIMEOUT"
  | "SYSTEM";

export const VALID_STATE_TRANSITIONS: Record<CandidateLiveState, CandidateLiveState[]> = {
  NOT_STARTED: ["STARTING", "ACTIVE", "SUBMITTED", "TERMINATED"],
  STARTING: ["ACTIVE", "DISCONNECTED", "SUBMITTED", "TERMINATED"],
  ACTIVE: [
    "DISCONNECTED",
    "RECONNECTING",
    "SUBMITTING",
    "SUBMITTED",
    "AUTO_SUBMITTED",
    "TERMINATED",
  ],
  DISCONNECTED: [
    "RECONNECTING",
    "ACTIVE",
    "AUTO_SUBMITTED",
    "SUBMITTED",
    "TERMINATED",
  ],
  RECONNECTING: [
    "ACTIVE",
    "DISCONNECTED",
    "AUTO_SUBMITTED",
    "SUBMITTED",
    "TERMINATED",
  ],
  SUBMITTING: [
    "SUBMITTED",
    "AUTO_SUBMITTED",
    "ACTIVE", // On retryable submission failure
    "TERMINATED",
  ],
  SUBMITTED: ["EVALUATING", "COMPLETED", "ADMIN_REVIEW"],
  // SUBMITTED is included so an admin's force-submit can always land here,
  // regardless of which state the candidate's attempt was stuck in.
  AUTO_SUBMITTED: ["ADMIN_REVIEW", "EVALUATING", "SUBMITTED", "TERMINATED"],
  ADMIN_REVIEW: ["RESUME_AUTHORIZED", "TERMINATED", "EVALUATING", "SUBMITTED"],
  RESUME_AUTHORIZED: ["RESUMED", "SUBMITTED", "TERMINATED"],
  RESUMED: ["ACTIVE", "DISCONNECTED", "SUBMITTING", "AUTO_SUBMITTED", "SUBMITTED", "TERMINATED"],
  EVALUATING: ["COMPLETED", "TERMINATED"],
  COMPLETED: [], // Terminal
  TERMINATED: [], // Terminal
};

/**
 * Single source of truth for mapping a persisted TestInstanceStatus (DB) to the
 * richer CandidateLiveState used by the live dashboard. Keep in sync with the
 * TestInstanceStatus enum in schema.prisma — every enum value must appear here
 * so a rehydrated record never silently falls back to a default status.
 */
export const TEST_INSTANCE_STATUS_TO_LIVE_STATE: Record<string, CandidateLiveState> = {
  CREATED: "NOT_STARTED",
  NOT_STARTED: "NOT_STARTED",
  STARTING: "STARTING",
  IN_PROGRESS: "ACTIVE",
  ACTIVE: "ACTIVE",
  DISCONNECTED: "DISCONNECTED",
  RECONNECTING: "RECONNECTING",
  SUBMITTING: "SUBMITTING",
  SUBMITTED: "SUBMITTED",
  AUTO_SUBMITTED: "AUTO_SUBMITTED",
  EVALUATING: "EVALUATING",
  COMPLETED: "COMPLETED",
  TERMINATED: "TERMINATED",
  ADMIN_REVIEW: "ADMIN_REVIEW",
  RESUME_AUTHORIZED: "RESUME_AUTHORIZED",
  RESUMED: "RESUMED",
};
