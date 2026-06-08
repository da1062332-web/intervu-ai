export type DomainError = {
  code: string;
  message: string;
};

export class RepositoryError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

// Return type for repository operations
export type RepositoryResponse<T> = T;
