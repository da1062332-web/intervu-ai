import { describe, it, expect } from 'vitest';
import { detectCircularDependencies } from '../formula-dependency-validator';

describe('detectCircularDependencies', () => {
  it('TEST 1 - detects self reference (A -> A)', () => {
    const vars = [
      { name: 'A', expression: 'A + 10' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(true);
    expect(res.cycle).toEqual(['A', 'A']);
  });

  it('TEST 2 - detects two-node cycle (A -> B -> A)', () => {
    const vars = [
      { name: 'A', expression: 'B * 2' },
      { name: 'B', expression: 'A - 5' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(true);
    // Cycle could start with A or B depending on DFS order, but should contain the cycle
    expect(res.cycle).toBeDefined();
    expect(res.cycle!.length).toBe(3);
    expect(res.cycle![0]).toBe(res.cycle![2]);
  });

  it('TEST 3 - detects three-node cycle (A -> B -> C -> A)', () => {
    const vars = [
      { name: 'A', expression: 'B + 1' },
      { name: 'B', expression: 'C * 2' },
      { name: 'C', expression: 'A - 3' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(true);
    expect(res.cycle).toBeDefined();
    expect(res.cycle!.length).toBe(4);
    expect(res.cycle![0]).toBe(res.cycle![3]);
  });

  it('TEST 4 - detects four-node cycle (A -> B -> C -> D -> A)', () => {
    const vars = [
      { name: 'A', expression: 'B' },
      { name: 'B', expression: 'C' },
      { name: 'C', expression: 'D' },
      { name: 'D', expression: 'A' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(true);
    expect(res.cycle).toBeDefined();
    expect(res.cycle!.length).toBe(5);
    expect(res.cycle![0]).toBe(res.cycle![4]);
  });

  it('TEST 5 - passes valid chain (A -> B -> C -> D)', () => {
    const vars = [
      { name: 'A', expression: 'B + 5' },
      { name: 'B', expression: 'C - 2' },
      { name: 'C', expression: 'D * 10' },
      { name: 'D', expression: '100' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(false);
  });

  it('TEST 6 - passes valid branching graph (A -> B, A -> C, B -> D, C -> D)', () => {
    const vars = [
      { name: 'A', expression: 'B + C' },
      { name: 'B', expression: 'D * 2' },
      { name: 'C', expression: 'D - 1' },
      { name: 'D', expression: '10' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(false);
  });

  it('TEST 7 - passes independent variables', () => {
    const vars = [
      { name: 'A', expression: '10' },
      { name: 'B', expression: '20' },
      { name: 'C', expression: '30' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(false);
  });

  it('TEST 8 - passes multiple independent chains', () => {
    const vars = [
      { name: 'A', expression: 'B' },
      { name: 'B', expression: '10' },
      { name: 'X', expression: 'Y' },
      { name: 'Y', expression: '20' }
    ];
    const res = detectCircularDependencies(vars);
    expect(res.hasCycle).toBe(false);
  });
});
