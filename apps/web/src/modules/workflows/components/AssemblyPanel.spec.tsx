import React from 'react';
import { render, screen } from '@testing-library/react';
import { AssemblyPanel } from './AssemblyPanel';

describe('AssemblyPanel', () => {
  it('renders correctly', () => {
    const status = {
      status: 'NOT_STARTED' as any,
      progress: 0,
      startedAt: null,
      finishedAt: null,
      errorReason: null,
    };
    render(<AssemblyPanel examId='test-exam-123' status={status} onAssemble={jest.fn()} />);
    expect(screen.getByText('Generate Test')).toBeInTheDocument();
  });
});
