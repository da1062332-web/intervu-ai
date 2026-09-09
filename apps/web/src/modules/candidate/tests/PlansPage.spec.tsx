import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlansPage from '@/app/plans/page';
import { billingApi } from '@/services/api/billing.api';
import { notifyApiError } from '@/services/notifications/toast';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock billing API
vi.mock('@/services/api/billing.api', () => ({
  billingApi: {
    getPublicPlans: vi.fn(),
    createOrder: vi.fn(),
    subscribeFree: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

// Mock notifications
vi.mock('@/services/notifications/toast', () => ({
  notifySuccess: vi.fn(),
  notifyApiError: vi.fn(),
}));

// Mock stores
vi.mock('@/store/subscription.store', () => ({
  useSubscriptionStore: vi.fn((selector) =>
    selector({
      plan: 'FREE',
      loadEntitlements: vi.fn(),
      setHasActivePlan: vi.fn(),
    })
  ),
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { id: 'u1', fullName: 'Test Candidate', email: 'test@example.com' },
    })
  ),
}));

describe('PlansPage Component (SEC-01 Verification)', () => {
  let queryClient: QueryClient;
  const originalEnv = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = originalEnv;
    vi.restoreAllMocks();
  });

  it('safely alerts when neither order.keyId nor env key is configured (no hardcoded fallback)', async () => {
    (billingApi.getPublicPlans as any).mockResolvedValue([
      {
        slug: 'pro',
        name: 'Pro Plan',
        description: 'Pro tier for serious candidates',
        priceMonthly: 240000,
        currency: 'INR',
        interval: 'MONTHLY',
        features: ['Unlimited Practice'],
        isActive: true,
      },
    ]);

    (billingApi.createOrder as any).mockResolvedValue({
      orderId: 'order_12345',
      amount: 240000,
      currency: 'INR',
      // Notice keyId is omitted to test fallback logic
    });

    // Mock window.Razorpay script as already loaded
    (window as any).Razorpay = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <PlansPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    const upgradeBtn = screen.getByRole('button', { name: /Upgrade/i });
    fireEvent.click(upgradeBtn);

    await waitFor(() => {
      expect(notifyApiError).toHaveBeenCalledWith(
        'Payment gateway key is not configured. Please contact support.'
      );
    });

    // Ensure Razorpay constructor was NOT called with any dummy/hardcoded key
    expect((window as any).Razorpay).not.toHaveBeenCalled();
  });

  it('uses dynamic keyId when provided by server order', async () => {
    (billingApi.getPublicPlans as any).mockResolvedValue([
      {
        slug: 'pro',
        name: 'Pro Plan',
        priceMonthly: 240000,
        currency: 'INR',
        interval: 'MONTHLY',
        features: ['Unlimited Practice'],
        isActive: true,
      },
    ]);

    (billingApi.createOrder as any).mockResolvedValue({
      orderId: 'order_dynamic_999',
      keyId: 'rzp_test_dynamic_key_abc',
      amount: 240000,
      currency: 'INR',
    });

    let createdInstance: any = null;
    class MockRazorpay {
      open = vi.fn();
      on = vi.fn();
      constructor(public options: any) {
        createdInstance = this;
      }
    }
    (window as any).Razorpay = MockRazorpay;

    render(
      <QueryClientProvider client={queryClient}>
        <PlansPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    const upgradeBtn = screen.getByRole('button', { name: /Upgrade/i });
    fireEvent.click(upgradeBtn);

    await waitFor(() => {
      expect(createdInstance).not.toBeNull();
      expect(createdInstance.options).toEqual(
        expect.objectContaining({
          key: 'rzp_test_dynamic_key_abc',
          order_id: 'order_dynamic_999',
        })
      );
      expect(createdInstance.open).toHaveBeenCalled();
    });
  });
});
