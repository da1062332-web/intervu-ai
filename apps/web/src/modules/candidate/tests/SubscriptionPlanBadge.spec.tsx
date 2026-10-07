import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionPlanBadge } from '@/components/billing/subscription-plan-badge';
import { useSubscriptionStore } from '@/store/subscription.store';

// Mock Zustand Store
vi.mock('@/store/subscription.store', () => {
  const storeState = {
    hasActivePlan: true,
    plan: 'PRO',
    planName: 'Pro Plan',
    planSlug: 'pro',
    status: 'ACTIVE',
    isLoading: false,
    entitlements: {
      hasActivePlan: true,
      plan: 'PRO',
      status: 'ACTIVE',
    },
    checkSubscription: vi.fn().mockResolvedValue(true),
    loadEntitlements: vi.fn().mockResolvedValue(null),
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

describe('SubscriptionPlanBadge component', () => {
  const mockOpenPricingModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSubscriptionStore.setState({
      hasActivePlan: true,
      plan: 'PRO',
      planName: 'Pro Plan',
      planSlug: 'pro',
      status: 'ACTIVE',
      isLoading: false,
      openPricingModal: mockOpenPricingModal,
      entitlements: {
        hasActivePlan: true,
        plan: 'PRO',
        status: 'ACTIVE',
        features: {
          monthlyRoundsLimit: 10,
          monthlyRoundsUsed: 0,
          monthlyRoundsRemaining: 10,
          roundFormats: [],
          roundHistoryLimit: null,
        },
      } as any,
    });
  });

  it('renders PRO badge for active Pro plan', () => {
    render(<SubscriptionPlanBadge />);

    const badge = screen.getByRole('button', { name: /Subscription plan: PRO/i });
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('renders TEAMS badge for active Teams plan', () => {
    useSubscriptionStore.setState({
      hasActivePlan: true,
      plan: 'TEAMS',
      planSlug: 'teams',
      status: 'ACTIVE',
      entitlements: {
        hasActivePlan: true,
        plan: 'TEAMS',
        status: 'ACTIVE',
        features: {
          monthlyRoundsLimit: 25,
          monthlyRoundsUsed: 0,
          monthlyRoundsRemaining: 25,
          roundFormats: [],
          roundHistoryLimit: null,
        },
      } as any,
    });

    render(<SubscriptionPlanBadge />);

    expect(screen.getByText('TEAMS')).toBeInTheDocument();
  });

  it('renders VIP badge for active VIP plan or entitlement', () => {
    useSubscriptionStore.setState({
      hasActivePlan: true,
      plan: 'VIP_UNLIMITED',
      planSlug: 'vip-pass',
      status: 'ACTIVE',
      entitlements: {
        hasActivePlan: true,
        plan: 'VIP_UNLIMITED',
        status: 'ACTIVE',
        features: {
          monthlyRoundsLimit: null,
          monthlyRoundsUsed: 0,
          monthlyRoundsRemaining: null,
          roundFormats: [],
          roundHistoryLimit: null,
        },
      } as any,
    });

    render(<SubscriptionPlanBadge />);

    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders FREE badge when user has no active subscription', () => {
    useSubscriptionStore.setState({
      hasActivePlan: false,
      plan: null,
      status: null,
      entitlements: null,
    });

    render(<SubscriptionPlanBadge />);

    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('renders FREE badge when user subscription is EXPIRED', () => {
    useSubscriptionStore.setState({
      hasActivePlan: true,
      plan: 'PRO',
      status: 'EXPIRED',
      entitlements: {
        hasActivePlan: false,
        plan: 'PRO',
        status: 'EXPIRED',
        features: {
          monthlyRoundsLimit: 0,
          monthlyRoundsUsed: 0,
          monthlyRoundsRemaining: 0,
          roundFormats: [],
          roundHistoryLimit: null,
        },
      } as any,
    });

    render(<SubscriptionPlanBadge />);

    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('renders loading skeleton when fetching subscription state', () => {
    useSubscriptionStore.setState({
      hasActivePlan: null,
      isLoading: true,
    });

    render(<SubscriptionPlanBadge />);

    expect(screen.getByTestId('plan-badge-skeleton')).toBeInTheDocument();
  });

  it('opens pricing modal when badge is clicked', () => {
    render(<SubscriptionPlanBadge />);

    const badge = screen.getByRole('button');
    fireEvent.click(badge);

    expect(mockOpenPricingModal).toHaveBeenCalledTimes(1);
  });
});
