import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReviewPanel } from './ReviewPanel';

jest.mock('../hooks/useWorkflow', () => ({
  useWorkflowQuestions: () => ({
    questions: [],
    total: 0,
    loading: false,
    error: null,
    approveQuestion: jest.fn(),
    rejectQuestion: jest.fn(),
    bulkApprove: jest.fn(),
    refetch: jest.fn(),
  }),
}));

describe('ReviewPanel', () => {
  it('renders correctly', () => {
    const status = { status: 'NOT_STARTED' as any, progress: 0, startedAt: null, finishedAt: null, errorReason: null };
    render(<ReviewPanel examId="test-exam-id" status={status} onReview={jest.fn()} />);
    expect(screen.getByText('Question Review Queue')).toBeInTheDocument();
  });
});
