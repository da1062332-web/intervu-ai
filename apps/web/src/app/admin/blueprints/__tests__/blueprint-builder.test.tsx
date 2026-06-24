import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { TopicAllocator } from '../components/TopicAllocator';
import { DifficultyAllocator } from '../components/DifficultyAllocator';
import { BlueprintHealthWidget } from '../components/BlueprintHealthWidget';

// Mock the queries
vi.mock('@/features/topic-section-mapping/api/queries', () => ({
  useSectionTopics: () => ({
    data: [
      { topicId: 't1', topicName: 'Arrays' },
      { topicId: 't2', topicName: 'Strings' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/services/exam-configs', () => ({
  useConfigs: () => ({ data: [{ id: 'c1', name: 'TCS NQT' }] }),
}));

vi.mock('@/services/blueprints/hooks', () => ({
  useStyleProfiles: () => ({ data: [{ id: 'p1', name: 'Strict Profile' }] }),
}));

describe('Blueprint Builder Components', () => {
  beforeEach(() => {
    useBlueprintBuilderStore.getState().reset();
    useBlueprintBuilderStore.getState().updateSection('sec1', {
      topicAllocations: [],
      difficultyAllocation: { easy: 0, medium: 0, hard: 0 },
    });
  });

  it('TopicAllocator should validate to 100%', () => {
    render(<TopicAllocator sectionId='sec1' />);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2); // 2 topics from mock

    fireEvent.change(inputs[0], { target: { value: '50' } });
    fireEvent.change(inputs[1], { target: { value: '50' } });

    expect(screen.getByText(/100% \/ 100%/)).toBeInTheDocument();
  });

  it('DifficultyAllocator should update store', () => {
    render(<DifficultyAllocator sectionId='sec1' />);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(3); // Easy, Medium, Hard

    fireEvent.change(inputs[0], { target: { value: '30' } });
    fireEvent.change(inputs[1], { target: { value: '50' } });
    fireEvent.change(inputs[2], { target: { value: '20' } });

    expect(screen.getByText(/100% \/ 100%/)).toBeInTheDocument();

    const state = useBlueprintBuilderStore.getState();
    const section = state.sections.find((s) => s.sectionId === 'sec1');
    expect(section?.difficultyAllocation).toEqual({ easy: 30, medium: 50, hard: 20 });
  });

  it('HealthWidget shows ready when all valid', () => {
    const store = useBlueprintBuilderStore.getState();
    store.setConfig('c1');
    store.setProfile('p1');
    store.updateSection('sec1', {
      topicAllocations: [{ topicId: 't1', percentage: 100 }],
      difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
      templateTypes: ['mcq'],
    });

    render(<BlueprintHealthWidget />);

    expect(screen.getByText(/Generation Ready/)).toBeInTheDocument();
  });

  it('HealthWidget shows invalid when allocations are not 100%', () => {
    const store = useBlueprintBuilderStore.getState();
    store.setConfig('c1');
    store.setProfile('p1');
    store.updateSection('sec1', {
      topicAllocations: [{ topicId: 't1', percentage: 90 }], // Invalid
      difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
      templateTypes: ['mcq'],
    });

    render(<BlueprintHealthWidget />);

    expect(screen.getByText(/Invalid Blueprint/)).toBeInTheDocument();
  });
});
