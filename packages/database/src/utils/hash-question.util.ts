import * as crypto from 'crypto';

export interface HashQuestionParams {
  templateId: string;
  parameters: Record<string, unknown>;
  options?: unknown[];
  correctAnswer?: unknown;
}

/**
 * Generates a deterministic SHA-256 hash for a question based on its core components.
 * This ensures that identical generated questions have the exact same hash,
 * enabling strict anti-duplication at the database level.
 */
export function generateQuestionHash(params: HashQuestionParams): string {
  // Sort keys in parameters to ensure deterministic JSON stringification
  const deterministicParams = sortObjectKeys(params.parameters || {});
  
  let hashInput = `${params.templateId}|${JSON.stringify(deterministicParams)}`;
  
  if (params.options && params.options.length > 0) {
    // Sort options if they are simple strings/numbers to prevent order variations causing different hashes
    const sortedOptions = [...params.options].sort();
    hashInput += `|${JSON.stringify(sortedOptions)}`;
  }
  
  if (params.correctAnswer !== undefined) {
    hashInput += `|${JSON.stringify(params.correctAnswer)}`;
  }

  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Recursively sorts the keys of an object to ensure deterministic JSON.stringify output.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  for (const key of keys) {
    sortedObj[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  
  return sortedObj;
}
