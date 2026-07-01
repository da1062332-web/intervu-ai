import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowDashboard } from './WorkflowDashboard';
import { useWorkflows } from '../hooks/useWorkflow';

jest.mock('../hooks/useWorkflow');

describe('WorkflowDashboard', () => {
  it('renders loading state', () => {
    (useWorkflows as jest.Mock).mockReturnValue({
      workflows: [],
      loading: true,
      error: null,
      fetchWorkflows: jest.fn(),
    });
    render(<WorkflowDashboard />);
    expect(screen.getByText('Loading workflows...')).toBeInTheDocument();
  });

  it('renders workflows table', () => {
    (useWorkflows as jest.Mock).mockReturnValue({
      workflows: [
        {
          id: '1',
          examId: 'e1',
          currentStep: 'CONFIGURATION',
          status: 'COMPLETED',
          nextAction: { label: 'Start Generation' },
        },
      ],
      loading: false,
      error: null,
      fetchWorkflows: jest.fn(),
    });
    render(<WorkflowDashboard />);
    expect(screen.getByText('Start Generation')).toBeInTheDocument();
  });
});
