export const CANDIDATE_STATUSES = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
] as const;

export const CANDIDATE_SORT_OPTIONS = [
  { label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  { label: 'Name (A - Z)', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Name (Z - A)', sortBy: 'name', sortOrder: 'desc' },
  { label: 'Email (A - Z)', sortBy: 'email', sortOrder: 'asc' },
] as const;

export const DEFAULT_PAGE_SIZE = 10;
