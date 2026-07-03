import React from 'react';
import { render, screen } from '@testing-library/react';
import { AttemptHistoryTable } from './AttemptHistoryTable';
import { useAttemptHistory } from '../hooks/useAttemptHistory';

jest.mock('../hooks/useAttemptHistory', () => ({
  useAttemptHistory: jest.fn(),
}));

describe('AttemptHistoryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no attempts', () => {
    (useAttemptHistory as jest.Mock).mockReturnValue({
      data: { attempts: [], pagination: { totalPages: 1 } },
      isLoading: false,
    });

    render(<AttemptHistoryTable />);

    expect(screen.getByText('No attempt history found.')).toBeInTheDocument();
  });

  it('renders table with data', () => {
    (useAttemptHistory as jest.Mock).mockReturnValue({
      data: {
        attempts: [
          {
            instanceId: '1',
            assessmentName: 'Test 1',
            date: '2026-06-01T00:00:00Z',
            status: 'COMPLETED',
            score: 85,
          },
        ],
        pagination: { totalPages: 1 },
      },
      isLoading: false,
    });

    render(<AttemptHistoryTable />);

    expect(screen.getByText('Attempt History')).toBeInTheDocument();
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});
