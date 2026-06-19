import { BaseError, ErrorCode } from "./base.errors";

export class TopicAlreadyMappedError extends BaseError {
  constructor(message = "Topic is already mapped to this section") {
    super("TOPIC_ALREADY_MAPPED", message);
  }
}

export class TopicNotFoundError extends BaseError {
  constructor(message = "Topic not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class SectionNotFoundError extends BaseError {
  constructor(message = "Section not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class SectionTopicMappingNotFoundError extends BaseError {
  constructor(message = "Section-Topic mapping not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class WeightageTotalExceededError extends BaseError {
  constructor(message = "Total weightage for this section cannot exceed 100%") {
    super("WEIGHTAGE_TOTAL_EXCEEDED", message);
  }
}

export class WeightageTotalInvalidError extends BaseError {
  constructor(
    message = "Total weightage for this section must be exactly 100%",
  ) {
    super("WEIGHTAGE_TOTAL_INVALID", message);
  }
}

export class WeightageNotFoundError extends BaseError {
  constructor(message = "Topic weightage configuration not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class TopicNotMappedToSectionError extends BaseError {
  constructor(message = "Topic is not mapped to this section") {
    super("TOPIC_NOT_MAPPED_TO_SECTION", message);
  }
}
