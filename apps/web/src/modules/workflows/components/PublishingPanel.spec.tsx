import React from 'react';
import { render, screen } from '@testing-library/react';
import { PublishingPanel } from './PublishingPanel';

describe('PublishingPanel', () => {
  it('renders correctly', () => {
    const status = {
      status: 'NOT_STARTED' as any,
      progress: 0,
      startedAt: null,
      finishedAt: null,
      errorReason: null,
    };
    render(<PublishingPanel status={status} onPublish={jest.fn()} />);
    expect(screen.getByText('Publish Test')).toBeInTheDocument();
  });
});
