import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CandidateReferralCard } from '../components/CandidateReferralCard';
import { referralsApi } from '@/services/api/referrals.api';

// Mock referrals API
vi.mock('@/services/api/referrals.api', () => ({
  referralsApi: {
    getCandidateReferralStatus: vi.fn(),
    redeemCode: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('@/services/notifications/toast', () => ({
  notifySuccess: vi.fn(),
  notifyApiError: vi.fn(),
}));

// Mock subscription store
vi.mock('@/store/subscription.store', () => ({
  useSubscriptionStore: vi.fn((selector) =>
    selector({
      checkSubscription: vi.fn(),
      loadEntitlements: vi.fn(),
    })
  ),
}));

describe('CandidateReferralCard Component (BUG-01 Verification)', () => {
  let queryClient: QueryClient;
  const originalClipboard = navigator.clipboard;
  let writeTextMock: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
  });

  it('renders personal referral link with ?ref=${code} query parameter', async () => {
    (referralsApi.getCandidateReferralStatus as any).mockResolvedValue({
      personalCode: 'CAND-TEST-1234',
      totalReferrals: 5,
      rewardedReferrals: 2,
      pendingReferrals: 3,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CandidateReferralCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Personal Referral Link/i)).toBeInTheDocument();
    });

    // Check stats are rendered
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Check that the effective referral link contains ?ref=CAND-TEST-1234
    const linkElement = screen.getByText(/\/signup\?ref=CAND-TEST-1234/);
    expect(linkElement).toBeInTheDocument();
  });

  it('copies referral link containing ?ref=${code} to clipboard', async () => {
    (referralsApi.getCandidateReferralStatus as any).mockResolvedValue({
      personalCode: 'CAND-TEST-5678',
      totalReferrals: 0,
      rewardedReferrals: 0,
      pendingReferrals: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CandidateReferralCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    const copyBtn = screen.getByText('Copy Link');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('/signup?ref=CAND-TEST-5678')
    );

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('generates social share links with ?ref=${code} parameter', async () => {
    (referralsApi.getCandidateReferralStatus as any).mockResolvedValue({
      personalCode: 'CAND-SHARE-999',
      totalReferrals: 1,
      rewardedReferrals: 1,
      pendingReferrals: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CandidateReferralCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Share on WhatsApp')).toBeInTheDocument();
    });

    // 1. WhatsApp share button
    const whatsappBtn = screen.getByTitle('Share on WhatsApp');
    fireEvent.click(whatsappBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('ref%3DCAND-SHARE-999'),
      '_blank',
      'noopener,noreferrer'
    );

    // 2. LinkedIn share button
    const linkedinBtn = screen.getByTitle('Share on LinkedIn');
    fireEvent.click(linkedinBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('ref%3DCAND-SHARE-999'),
      '_blank',
      'noopener,noreferrer'
    );

    // 3. X (Twitter) share button
    const twitterBtn = screen.getByTitle('Share on X (Twitter)');
    fireEvent.click(twitterBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('ref%3DCAND-SHARE-999'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('submits redeemCode with trimmed uppercase value', async () => {
    (referralsApi.getCandidateReferralStatus as any).mockResolvedValue({
      personalCode: 'MY-CODE',
      totalReferrals: 0,
      rewardedReferrals: 0,
      pendingReferrals: 0,
    });
    (referralsApi.redeemCode as any).mockResolvedValue({
      success: true,
      message: 'Bonus credited!',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CandidateReferralCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter your referral code/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Enter your referral code/i);
    fireEvent.change(input, { target: { value: '  candidate-abc  ' } });

    const redeemBtn = screen.getByRole('button', { name: /Redeem Code/i });
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(referralsApi.redeemCode).toHaveBeenCalledWith('CANDIDATE-ABC');
    });
  });

  it('generates Email share mailto link with referral link when native share unavailable', async () => {
    (referralsApi.getCandidateReferralStatus as any).mockResolvedValue({
      personalCode: 'CAND-MAIL-123',
      totalReferrals: 0,
      rewardedReferrals: 0,
      pendingReferrals: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CandidateReferralCard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Share via Email')).toBeInTheDocument();
    });

    const emailBtn = screen.getByTitle('Share via Email');
    fireEvent.click(emailBtn);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('ref%3DCAND-MAIL-123'),
      '_self'
    );
  });
});
