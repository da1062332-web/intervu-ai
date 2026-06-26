import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopicSummary } from '../TopicSummary';

describe('TopicSummary', () => {
  const sectionsWithTopics = [
    {
      name: 'Data Structures',
      code: 'DS',
      topics: [
        { topicName: 'Arrays', topicCode: 'ARR', topicStatus: 'ACTIVE', weightagePercentage: 40 },
        {
          topicName: 'Linked Lists',
          topicCode: 'LL',
          topicStatus: 'INACTIVE',
          weightagePercentage: null,
        },
      ],
    },
    {
      name: 'Algorithms',
      code: 'ALGO',
      topics: [
        { topicName: 'Sorting', topicCode: 'SORT', topicStatus: 'ACTIVE', weightagePercentage: 60 },
      ],
    },
  ];

  it('renders the "Topic Coverage" heading', () => {
    render(<TopicSummary sections={sectionsWithTopics} />);
    expect(screen.getByText('Topic Coverage')).toBeInTheDocument();
  });

  it('shows correct active / total topic count', () => {
    render(<TopicSummary sections={sectionsWithTopics} />);
    expect(screen.getByText('2 active')).toBeInTheDocument();
    // total = 3
    expect(screen.getByText(/\/\s*3\s*total/i)).toBeInTheDocument();
  });

  it('renders section names', () => {
    render(<TopicSummary sections={sectionsWithTopics} />);
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
  });

  it('renders topic names and weightages', () => {
    render(<TopicSummary sections={sectionsWithTopics} />);
    expect(screen.getByText('Arrays')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Sorting')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows "No sections configured" when sections array is empty', () => {
    render(<TopicSummary sections={[]} />);
    expect(screen.getByText('No sections configured.')).toBeInTheDocument();
  });

  it('shows "No topics mapped" message for sections without topics', () => {
    render(<TopicSummary sections={[{ name: 'Empty Section', code: 'ES', topics: [] }]} />);
    expect(screen.getByText('No topics mapped to this section.')).toBeInTheDocument();
  });

  it('falls back to topicCount when topics array is not present', () => {
    const sectionsWithCount = [{ name: 'General', code: 'GEN', topicCount: 5 }];
    render(<TopicSummary sections={sectionsWithCount} />);
    expect(screen.getByText('5 topics mapped.')).toBeInTheDocument();
  });
});
