export declare enum QueueType {
    GENERATION = "generation",
    EVALUATION = "evaluation",
    ANALYTICS = "analytics"
}
export interface BaseQueuePayload {
    jobId: string;
    type: QueueType;
    timestamp: number;
    userId?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
}
export interface GenerationQueuePayload extends BaseQueuePayload {
    type: QueueType.GENERATION;
    payload: {
        assemblyId: string;
        templateId?: string;
        difficulty?: string;
        customPrompt?: string;
        retryCount?: number;
    };
}
export interface EvaluationQueuePayload extends BaseQueuePayload {
    type: QueueType.EVALUATION;
    payload: {
        testId: string;
        userId: string;
        evaluationCriteria?: Record<string, any>;
        retryCount?: number;
    };
}
export interface AnalyticsQueuePayload extends BaseQueuePayload {
    type: QueueType.ANALYTICS;
    payload: {
        eventType: string;
        eventData: Record<string, any>;
        batchId?: string;
    };
}
export type QueuePayload = GenerationQueuePayload | EvaluationQueuePayload | AnalyticsQueuePayload;
export interface QueueJobResult {
    success: boolean;
    jobId: string;
    result?: any;
    error?: string;
    duration: number;
    completedAt: number;
}
//# sourceMappingURL=queue.types.d.ts.map