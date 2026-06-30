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
<<<<<<< HEAD
    render(<PublishingPanel examId='test-exam-123' status={status} onPublish={jest.fn()} />);
=======
    render(<PublishingPanel status={status} onPublish={jest.fn()} />);
>>>>>>> df114762eb99866ba825edb9aff504802cb730eb
    expect(screen.getByText('Publish Test')).toBeInTheDocument();
  });
});
