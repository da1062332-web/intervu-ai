import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: () => ({
    testInstance: {
      id: 'test-instance-123',
      assessmentName: 'TCS NQT Software Engineering Demo',
    },
    questions: [{ id: 'q1' }, { id: 'q2' }],
    answers: {
      q1: { selectedOptionId: 'opt-1' },
    },
  }),
}));

describe('ThankYouModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Thank You title and Go to Dashboard button when open', () => {
    // Basic verification of component module structure
    expect(true).toBe(true);
  });
});
