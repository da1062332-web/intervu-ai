import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnrollmentCard } from '../components/EnrollmentCard';

// Mock hook
vi.mock('../hooks/useEnrollment', () => ({
  useEnrollment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock router / Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('EnrollmentCard component', () => {
  it('renders Start Assessment button when ENROLLED and quota is available', () => {
    render(
      <EnrollmentCard
        testId='test-123'
        testName='System Design Assessment'
        company='Google'
        status='ENROLLED'
        isQuotaExhausted={false}
      />,
    );

    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
  });

  it('renders Upgrade Plan to Start button when ENROLLED and quota is exhausted', () => {
    const handleUpgrade = vi.fn();
    render(
      <EnrollmentCard
        testId='test-123'
        testName='System Design Assessment'
        company='Google'
        status='ENROLLED'
        isQuotaExhausted={true}
        onUpgrade={handleUpgrade}
      />,
    );

    const upgradeBtn = screen.getByRole('button', { name: /Upgrade Plan to Start/i });
    expect(upgradeBtn).toBeInTheDocument();

    fireEvent.click(upgradeBtn);
    expect(handleUpgrade).toHaveBeenCalledTimes(1);
  });

  it('renders Resume Assessment when test is STARTED even if quota is exhausted', () => {
    render(
      <EnrollmentCard
        testId='test-123'
        testName='System Design Assessment'
        company='Google'
        status='STARTED'
        isQuotaExhausted={true}
      />,
    );

    expect(screen.getByText('Resume Assessment')).toBeInTheDocument();
    expect(screen.queryByText(/Upgrade Plan to Start/i)).not.toBeInTheDocument();
  });
});
