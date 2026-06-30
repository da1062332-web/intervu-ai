import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowDetail } from './WorkflowDetail';
import { useWorkflowDetails } from '../hooks/useWorkflow';

jest.mock('../hooks/useWorkflow');

describe('WorkflowDetail', () => {
  it('renders loading spinner when loading details', () => {
    (useWorkflowDetails as jest.Mock).mockReturnValue({
      details: null,
      loading: true,
      error: null,
      fetchDetails: jest.fn(),
    });
    render(<WorkflowDetail examId='e1' />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 creates svg, need specific role/label in real app
  });
});
