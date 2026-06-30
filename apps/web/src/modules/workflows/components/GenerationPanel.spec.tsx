import React from 'react';
import { render, screen } from '@testing-library/react';
import { GenerationPanel } from './GenerationPanel';

describe('GenerationPanel', () => {
  it('renders correctly in NOT_STARTED state', () => {
    const status = { status: 'NOT_STARTED' as any, progress: 0, startedAt: null, finishedAt: null, errorReason: null };
    render(<GenerationPanel status={status} onGenerate={jest.fn()} />);
    expect(screen.getByText('Start Generation')).toBeInTheDocument();
  });
});
