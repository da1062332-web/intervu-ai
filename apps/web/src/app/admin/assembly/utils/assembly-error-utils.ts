import { normalizeApiError } from '@/services/api/error';

export interface FormattedAssemblyError {
  displayMessage: string;
  isNoSections: boolean;
  code?: string;
}

interface TopicLike {
  id: string;
  name: string;
}

const UUID_REGEX = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g;

/**
 * Formats API errors from Test Assembly generation into user-friendly messages.
 * Handles known validation errors, extracts structured info when available,
 * and safely resolves topic UUIDs to topic names.
 */
export function formatAssemblyError(
  error: unknown,
  topics?: TopicLike[],
): FormattedAssemblyError {
  const normalized = normalizeApiError(error);
  const rawMsg = normalized.message || 'Failed to generate assembly';

  const isNoSections =
    rawMsg.includes('has no sections defined') ||
    rawMsg.includes('PRE_ASSEMBLY_READINESS_FAILED');

  let displayMsg = rawMsg;

  if (isNoSections) {
    displayMsg = 'This exam config has no sections defined. Redirecting to configure sections...';
  } else if (topics && topics.length > 0) {
    // Safely resolve any topic UUIDs present in the message
    displayMsg = displayMsg.replace(UUID_REGEX, (match: string) => {
      const foundTopic = topics.find((t) => t.id === match);
      return foundTopic ? `"${foundTopic.name}"` : match;
    });
  }

  return {
    displayMessage: displayMsg,
    isNoSections,
    code: normalized.code,
  };
}
