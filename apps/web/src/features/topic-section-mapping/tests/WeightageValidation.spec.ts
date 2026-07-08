import { renderHook, act } from '@testing-library/react';
import { useTopicMappingStore } from '../store/topic-mapping.store';

describe('WeightageValidation', () => {
  beforeEach(() => {
    act(() => {
      useTopicMappingStore.setState({ weightages: {} });
    });
  });

  const getSectionWeightageTotal = (weightages: Record<string, number>) => {
    return Object.values(weightages).reduce((acc, curr) => acc + curr, 0);
  };

  it('validates 0-100 total boundaries correctly', () => {
    act(() => {
      useTopicMappingStore.getState().setWeightages({
        't1': 60,
        't2': 40
      });
    });

    const state = useTopicMappingStore.getState();
    const total = getSectionWeightageTotal(state.weightages);
    expect(total).toBe(100);
  });

  it('calculates incomplete weightage correctly', () => {
    act(() => {
      useTopicMappingStore.getState().setWeightages({
        't1': 60,
      });
    });

    const state = useTopicMappingStore.getState();
    const total = getSectionWeightageTotal(state.weightages);
    expect(total).toBe(60);
  });
});
