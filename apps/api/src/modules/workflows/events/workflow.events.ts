import { WorkflowStep } from "@prisma/client";

export class ConfigurationCompletedEvent {
  constructor(public readonly examId: string) {}
}

export class GenerationStartedEvent {
  constructor(public readonly examId: string) {}
}

export class GenerationCompletedEvent {
  constructor(
    public readonly examId: string,
    public readonly questionCount: number,
  ) {}
}

export class ReviewCompletedEvent {
  constructor(public readonly examId: string) {}
}

export class AssemblyCompletedEvent {
  constructor(public readonly examId: string) {}
}

export class PublishingCompletedEvent {
  constructor(public readonly examId: string) {}
}

export class WorkflowCompletedEvent {
  constructor(public readonly examId: string) {}
}

export class WorkflowFailedEvent {
  constructor(
    public readonly examId: string,
    public readonly reason: string,
  ) {}
}

export class WorkflowRetryEvent {
  constructor(
    public readonly examId: string,
    public readonly step: WorkflowStep,
  ) {}
}
