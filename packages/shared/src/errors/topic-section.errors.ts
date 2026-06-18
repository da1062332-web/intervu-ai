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
