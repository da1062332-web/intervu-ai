import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowDashboard } from '../WorkflowDashboard';
import { useWorkflows } from '../../hooks/useWorkflow';

// Mock the hook
jest.mock('../../hooks/useWorkflow', () => ({
  useWorkflows: jest.fn(),
}));

// Mock the AdminInsights component to simplify testing
jest.mock('../AdminInsights', () => ({
  AdminInsights: () => <div data-testid='admin-insights-mock'>Admin Insights</div>,
}));

describe('WorkflowDashboard', () => {
  const mockFetchWorkflows = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useWorkflows as jest.Mock).mockReturnValue({
      workflows: [],
      loading: true,
      error: null,
      fetchWorkflows: mockFetchWorkflows,
    });

    render(<WorkflowDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useWorkflows as jest.Mock).mockReturnValue({
      workflows: [],
      loading: false,
      error: 'Failed to fetch',
      fetchWorkflows: mockFetchWorkflows,
    });

    render(<WorkflowDashboard />);
    expect(screen.getByText('Error loading workflows')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('renders workflows and AdminInsights on success', () => {
    (useWorkflows as jest.Mock).mockReturnValue({
      workflows: [
        {
          id: '1',
          examId: 'exam-1',
          examName: 'Frontend Developer Test',
          currentStep: 'CONFIGURATION',
          workflowStatus: 'IN_PROGRESS',
        },
      ],
      loading: false,
      error: null,
      fetchWorkflows: mockFetchWorkflows,
    });

    render(<WorkflowDashboard />);

    expect(screen.getByText('Exam Workflows')).toBeInTheDocument();
    expect(screen.getByTestId('admin-insights-mock')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer Test')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });
});
