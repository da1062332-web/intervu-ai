import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnrollmentCard } from './EnrollmentCard';
import { useEnrollment } from '../hooks/useEnrollment';

// Mock the hook
jest.mock('../hooks/useEnrollment', () => ({
  useEnrollment: jest.fn(),
}));

describe('EnrollmentCard', () => {
  const mockEnroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useEnrollment as jest.Mock).mockReturnValue({
      mutate: mockEnroll,
      isPending: false,
    });
  });

  it('renders AVAILABLE status and enroll button', () => {
    render(
      <EnrollmentCard
        testId='1'
        testName='Test Assessment'
        company='Company A'
        status='AVAILABLE'
      />,
    );

    expect(screen.getByText('Test Assessment')).toBeInTheDocument();
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Enrollment Required')).toBeInTheDocument();

    const enrollButton = screen.getByRole('button', { name: /Enroll Now/i });
    expect(enrollButton).toBeInTheDocument();

    fireEvent.click(enrollButton);
    expect(mockEnroll).toHaveBeenCalledWith('1');
  });

  it('renders ENROLLED status without button', () => {
    render(
      <EnrollmentCard
        testId='1'
        testName='Test Assessment'
        company='Company A'
        status='ENROLLED'
      />,
    );

    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enroll/i })).not.toBeInTheDocument();
  });
});
