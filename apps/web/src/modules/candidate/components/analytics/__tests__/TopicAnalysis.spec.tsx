import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopicAnalysis } from '../TopicAnalysis';

describe('TopicAnalysis (FIX-08 Topic Preservation)', () => {
  it('renders empty state message when no topics are provided', () => {
    render(<TopicAnalysis topics={[]} />);
    expect(screen.getByText(/No topic analysis available/i)).toBeInTheDocument();
  });

  it('renders single topic correctly', () => {
    render(<TopicAnalysis topics={[{ topic: 'Data Structures', score: 95 }]} />);
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('preserves all attempted topics without dropping low-performing ones', () => {
    const eightTopics = [
      { topic: 'Topic A', score: 90 },
      { topic: 'Topic B', score: 85 },
      { topic: 'Topic C', score: 80 },
      { topic: 'Topic D', score: 30 },
      { topic: 'Topic E', score: 25 },
      { topic: 'Topic F', score: 20 },
      { topic: 'Topic G', score: 15 },
      { topic: 'Topic H', score: 10 },
    ];

    render(<TopicAnalysis topics={eightTopics} />);

    // Initially top 5 are shown
    expect(screen.getByText('Topic A')).toBeInTheDocument();
    expect(screen.getByText('Topic B')).toBeInTheDocument();
    expect(screen.getByText('Topic C')).toBeInTheDocument();
    expect(screen.getByText('Topic D')).toBeInTheDocument();
    expect(screen.getByText('Topic E')).toBeInTheDocument();

    // The expansion toggle indicates all 8 topics exist
    const toggleBtn = screen.getByRole('button', { name: /View All 8 Attempted Topics/i });
    expect(toggleBtn).toBeInTheDocument();

    // Click toggle to view all 8 topics including low-performing topics
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Topic F')).toBeInTheDocument();
    expect(screen.getByText('Topic G')).toBeInTheDocument();
    expect(screen.getByText('Topic H')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('safely handles and preserves unresolved UUID/ID topics', () => {
    const unresolvedTopics = [
      { topic: '123e4567-e89b-12d3-a456-426614174000', score: 75 },
      { topic: 'clx0123456789012345678901', score: 60 },
      { topic: 'Algorithms', score: 90 },
    ];

    render(<TopicAnalysis topics={unresolvedTopics} />);

    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getAllByText('Core Technical Concepts')).toHaveLength(2);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
