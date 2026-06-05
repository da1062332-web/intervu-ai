import { toast } from 'sonner';

import { useUIStore } from '@/store/ui.store';
import { normalizeApiError } from '@/services/api/error';

export function notifySuccess(message: string): void {
  toast.success(message);
}

function formatValidationSummary(validationErrors: Record<string, string[]>): string | null {
  const entry = Object.entries(validationErrors)[0];

  if (!entry) {
    return null;
  }

  const [field, messages] = entry;
  const friendlyField = field.replaceAll('_', ' ').replaceAll('.', ' ');
  const detail = messages[0];

  return `${friendlyField}: ${detail}`;
}

export function notifyApiError(
  error: unknown,
  fallbackMessage = 'Unable to complete request.',
): void {
  const normalized = normalizeApiError(error);

  if (normalized.notified) {
    return;
  }

  const validationSummary = formatValidationSummary(normalized.validationErrors);
  const message = normalized.message || fallbackMessage;
  const renderedMessage = validationSummary ? `${message} (${validationSummary})` : message;

  useUIStore.getState().setError(renderedMessage);

  toast.error(renderedMessage);
  normalized.notified = true;
}
