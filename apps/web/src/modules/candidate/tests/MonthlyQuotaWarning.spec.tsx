import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonthlyQuotaWarning } from '../components/MonthlyQuotaWarning';
import { useSubscriptionStore } from '@/store/subscription.store';

// Mock Zustand Store
vi.mock('@/store/subscription.store', () => {
  const storeState = {
    hasActivePlan: true,
    entitlements: {
      hasActivePlan: true,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: '2026-11-01T00:00:00.000Z',
      features: {
        monthlyRoundsLimit: 10,
        monthlyRoundsUsed: 10,
        monthlyRoundsRemaining: 0,
        roundFormats: ['technical'],
        roundHistoryLimit: 10,
      },
    },
    currentPeriodEnd: '2026-11-01T00:00:00.000Z',
    openPricingModal: vi.fn(),
  };

  const useSubscriptionStoreMock = (selector?: (state: any) => any) => {
    if (selector) return selector(storeState);
    return storeState;
  };

  useSubscriptionStoreMock.getState = () => storeState;
  useSubscriptionStoreMock.setState = (newState: any) => Object.assign(storeState, newState);

  return {
    useSubscriptionStore: useSubscriptionStoreMock,
  };
});

describe('MonthlyQuotaWarning component', () => {
  const mockOpenPricingModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSubscriptionStore.setState({
      hasActivePlan: true,
      openPricingModal: mockOpenPricingModal,
      currentPeriodEnd: '2026-11-01T00:00:00.000Z',
      entitlements: {
        hasActivePlan: true,
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: '2026-11-01T00:00:00.000Z',
        features: {
          monthlyRoundsLimit: 10,
          monthlyRoundsUsed: 10,
          monthlyRoundsRemaining: 0,
          roundFormats: ['technical'],
          roundHistoryLimit: 10,
        },
      },
    });
  });

  it('renders warning when monthlyRoundsRemaining is 0 with active subscription', () => {
    render(<MonthlyQuotaWarning />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Monthly assessment quota exhausted')).toBeInTheDocument();
    expect(
      screen.getByText(/You've used all your available assessment rounds for this month/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Remaining rounds:/i)).toBeInTheDocument();
    expect(screen.getByText(/Resets on:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upgrade Plan/i })).toBeInTheDocument();
  });

  it('does NOT render when candidate has positive monthly rounds remaining', () => {
    render(
      <MonthlyQuotaWarning
        hasActivePlan={true}
        monthlyRoundsRemaining={5}
        monthlyRoundsLimit={10}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Monthly assessment quota exhausted')).not.toBeInTheDocument();
  });

  it('does NOT render when candidate has unlimited monthly rounds (null)', () => {
    render(
      <MonthlyQuotaWarning
        hasActivePlan={true}
        monthlyRoundsRemaining={null}
        monthlyRoundsLimit={null}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Monthly assessment quota exhausted')).not.toBeInTheDocument();
  });

  it('does NOT render when user has no active subscription', () => {
    render(
      <MonthlyQuotaWarning
        hasActivePlan={false}
        monthlyRoundsRemaining={0}
        monthlyRoundsLimit={0}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onUpgrade or openPricingModal when Upgrade Plan button is clicked', () => {
    const customOnUpgrade = vi.fn();
    render(<MonthlyQuotaWarning onUpgrade={customOnUpgrade} />);

    const upgradeBtn = screen.getByRole('button', { name: /Upgrade Plan/i });
    fireEvent.click(upgradeBtn);

    expect(customOnUpgrade).toHaveBeenCalledTimes(1);
  });

  it('formats reset date correctly when provided', () => {
    render(
      <MonthlyQuotaWarning
        hasActivePlan={true}
        monthlyRoundsRemaining={0}
        monthlyRoundsLimit={15}
        currentPeriodEnd='2026-12-15T00:00:00.000Z'
      />,
    );

    expect(screen.getByText(/Dec 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/\/ 15/i)).toBeInTheDocument();
  });
});
