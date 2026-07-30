'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { useScratchPad } from './useScratchPad';

interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface CalculatorState {
  assessmentId: string | null;
  isOpen: boolean;
  isMinimized: boolean;
  display: string;
  expression: string;
  previousOperand: number | null;
  currentOperand: string;
  operation: string | null;
  lastResult: string | null;
  history: string[];
  position: Position | null;
  viewport: Viewport | null;
  hasQuotaFailed: boolean;

  // Actions
  initialize: (assessmentId: string) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  performOperation: (nextOp: string) => void;
  calculatePercentage: () => void;
  calculateSquareRoot: () => void;
  toggleSign: () => void;
  backspace: () => void;
  clear: () => void;
  equals: () => void;
  setPosition: (pos: Position, vp?: Viewport) => void;
  clearCalculator: () => void;
}

function safeSetItem(key: string, value: string, onQuotaError: () => void) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (err: any) {
    onQuotaError();
  }
}

export const useCalculator = create<CalculatorState>((set, get) => {
  const saveState = (newState: Partial<CalculatorState>) => {
    const nextState = { ...get(), ...newState };
    const { assessmentId } = nextState;
    if (!assessmentId) return;

    const payload = JSON.stringify({
      display: nextState.display,
      expression: nextState.expression,
      previousOperand: nextState.previousOperand,
      currentOperand: nextState.currentOperand,
      operation: nextState.operation,
      lastResult: nextState.lastResult,
      history: nextState.history,
    });

    safeSetItem(
      `candidate:${assessmentId}:calculator`,
      payload,
      () => {
        if (!nextState.hasQuotaFailed) {
          set({ hasQuotaFailed: true });
          toast.error('Unable to save locally. Your calculations will remain until this session ends.', { id: 'calculator-quota' });
        }
      }
    );
  };

  const compute = (prev: number, curr: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + curr;
      case '-':
        return prev - curr;
      case '×':
      case '*':
        return prev * curr;
      case '÷':
      case '/':
        if (curr === 0) throw new Error('Divide by zero');
        return prev / curr;
      default:
        return curr;
    }
  };

  const formatNumber = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) return 'Error';
    // Precision formatting to avoid 0.1 + 0.2 = 0.30000000000000004
    const fixed = Math.round(num * 1e10) / 1e10;
    return String(fixed);
  };

  return {
    assessmentId: null,
    isOpen: false,
    isMinimized: false,
    display: '0',
    expression: '',
    previousOperand: null,
    currentOperand: '0',
    operation: null,
    lastResult: null,
    history: [],
    position: null,
    viewport: null,
    hasQuotaFailed: false,

    initialize: (assessmentId: string) => {
      if (typeof window === 'undefined') return;

      const calcKey = `candidate:${assessmentId}:calculator`;
      const positionKey = `candidate:${assessmentId}:calculator:position`;

      const savedCalc = localStorage.getItem(calcKey);
      const savedPositionStr = localStorage.getItem(positionKey);

      let overrides: Partial<CalculatorState> = {};
      if (savedCalc) {
        try {
          const parsed = JSON.parse(savedCalc);
          overrides = {
            display: parsed.display ?? '0',
            expression: parsed.expression ?? '',
            previousOperand: parsed.previousOperand ?? null,
            currentOperand: parsed.currentOperand ?? '0',
            operation: parsed.operation ?? null,
            lastResult: parsed.lastResult ?? null,
            history: Array.isArray(parsed.history) ? parsed.history : [],
          };
        } catch (e) {
          console.error('Error parsing calculator storage:', e);
        }
      }

      let position: Position | null = null;
      let viewport: Viewport | null = null;
      if (savedPositionStr) {
        try {
          const parsedPos = JSON.parse(savedPositionStr);
          if (parsedPos && typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
            position = { x: parsedPos.x, y: parsedPos.y };
            if (parsedPos.viewport) {
              viewport = parsedPos.viewport;
              // Monitor boundary check
              if (
                window.innerWidth < parsedPos.x + 40 ||
                window.innerHeight < parsedPos.y + 40
              ) {
                position = null;
                viewport = null;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing calculator position:', e);
        }
      }

      set({
        assessmentId,
        ...overrides,
        position,
        viewport,
      });
    },

    toggleOpen: () => {
      set((state) => ({ isOpen: !state.isOpen, isMinimized: false }));
    },

    setOpen: (open: boolean) => {
      set({ isOpen: open, isMinimized: false });
    },

    setMinimized: (minimized: boolean) => {
      set({ isMinimized: minimized });
    },

    inputDigit: (digit: string) => {
      const { currentOperand, display, operation, previousOperand, lastResult, expression } = get();

      // If a previous calculation just finished and no new operator was pressed, start fresh
      if (lastResult && !operation) {
        const newOperand = digit;
        const newState = {
          currentOperand: newOperand,
          display: newOperand,
          expression: '',
          lastResult: null,
          previousOperand: null,
        };
        set(newState);
        saveState(newState);
        return;
      }

      let newOperand = currentOperand === '0' && digit !== '0' ? digit : currentOperand === '0' ? '0' : currentOperand + digit;
      // Prevent overflowing screen length
      if (newOperand.length > 15) return;

      const newState = {
        currentOperand: newOperand,
        display: newOperand,
        lastResult: null,
      };
      set(newState);
      saveState(newState);
    },

    inputDecimal: () => {
      const { currentOperand, lastResult, operation } = get();
      if (lastResult && !operation) {
        const newState = {
          currentOperand: '0.',
          display: '0.',
          expression: '',
          lastResult: null,
          previousOperand: null,
        };
        set(newState);
        saveState(newState);
        return;
      }

      if (!currentOperand.includes('.')) {
        const newOperand = currentOperand + '.';
        const newState = {
          currentOperand: newOperand,
          display: newOperand,
        };
        set(newState);
        saveState(newState);
      }
    },

    performOperation: (nextOp: string) => {
      const { currentOperand, previousOperand, operation, display } = get();
      const currentVal = parseFloat(currentOperand);

      if (previousOperand === null) {
        if (isNaN(currentVal)) return;
        const newState = {
          previousOperand: currentVal,
          operation: nextOp,
          expression: `${formatNumber(currentVal)} ${nextOp}`,
          currentOperand: '0',
          display: formatNumber(currentVal),
        };
        set(newState);
        saveState(newState);
        return;
      }

      if (currentOperand === '0' && operation) {
        // Just switch operator if no new digit typed yet
        const newState = {
          operation: nextOp,
          expression: `${formatNumber(previousOperand)} ${nextOp}`,
        };
        set(newState);
        saveState(newState);
        return;
      }

      try {
        const result = compute(previousOperand, currentVal, operation || '+');
        const formatted = formatNumber(result);
        const newState = {
          previousOperand: result,
          operation: nextOp,
          expression: `${formatted} ${nextOp}`,
          display: formatted,
          currentOperand: '0',
        };
        set(newState);
        saveState(newState);
      } catch (e) {
        set({ display: 'Error', currentOperand: '0', previousOperand: null, operation: null, expression: '' });
      }
    },

    equals: () => {
      const { previousOperand, currentOperand, operation, history } = get();
      if (previousOperand === null || !operation) return;

      const currentVal = parseFloat(currentOperand);
      try {
        const result = compute(previousOperand, currentVal, operation);
        const formatted = formatNumber(result);
        const calcStr = `${formatNumber(previousOperand)} ${operation} ${formatNumber(currentVal)} = ${formatted}`;
        const newHistory = [calcStr, ...history].slice(0, 20); // Keep last 20 entries

        const newState = {
          display: formatted,
          expression: `${formatNumber(previousOperand)} ${operation} ${formatNumber(currentVal)} =`,
          previousOperand: null,
          currentOperand: formatted,
          operation: null,
          lastResult: formatted,
          history: newHistory,
        };
        set(newState);
        saveState(newState);
      } catch (e) {
        set({ display: 'Error', expression: '', previousOperand: null, currentOperand: '0', operation: null });
      }
    },

    calculatePercentage: () => {
      const { currentOperand, previousOperand, operation } = get();
      const currentVal = parseFloat(currentOperand);
      if (isNaN(currentVal)) return;

      let result = currentVal / 100;
      if (previousOperand !== null && (operation === '+' || operation === '-')) {
        result = (previousOperand * currentVal) / 100;
      }

      const formatted = formatNumber(result);
      const newState = {
        currentOperand: formatted,
        display: formatted,
      };
      set(newState);
      saveState(newState);
    },

    calculateSquareRoot: () => {
      const { currentOperand } = get();
      const currentVal = parseFloat(currentOperand);
      if (isNaN(currentVal) || currentVal < 0) {
        set({ display: 'Error', currentOperand: '0' });
        return;
      }
      const result = Math.sqrt(currentVal);
      const formatted = formatNumber(result);
      const newState = {
        currentOperand: formatted,
        display: formatted,
        expression: `√(${currentVal})`,
        lastResult: formatted,
      };
      set(newState);
      saveState(newState);
    },

    toggleSign: () => {
      const { currentOperand } = get();
      const currentVal = parseFloat(currentOperand);
      if (isNaN(currentVal) || currentVal === 0) return;

      const result = currentVal * -1;
      const formatted = formatNumber(result);
      const newState = {
        currentOperand: formatted,
        display: formatted,
      };
      set(newState);
      saveState(newState);
    },

    backspace: () => {
      const { currentOperand, display, lastResult } = get();
      if (lastResult) {
        // If backspacing a calculated result, clear
        get().clear();
        return;
      }

      if (currentOperand.length > 1) {
        const nextOperand = currentOperand.slice(0, -1);
        const newState = { currentOperand: nextOperand, display: nextOperand };
        set(newState);
        saveState(newState);
      } else {
        const newState = { currentOperand: '0', display: '0' };
        set(newState);
        saveState(newState);
      }
    },

    clear: () => {
      const newState = {
        display: '0',
        expression: '',
        previousOperand: null,
        currentOperand: '0',
        operation: null,
        lastResult: null,
      };
      set(newState);
      saveState(newState);
    },

    clearCalculator: () => {
      set({
        display: '0',
        expression: '',
        previousOperand: null,
        currentOperand: '0',
        operation: null,
        lastResult: null,
        history: [],
      });
      const { assessmentId } = get();
      if (assessmentId && typeof window !== 'undefined') {
        localStorage.removeItem(`candidate:${assessmentId}:calculator`);
      }
      toast.success('Calculator memory cleared');
    },

    setPosition: (pos: Position, vp?: Viewport) => {
      set({ position: pos, viewport: vp || null });
      const { assessmentId } = get();
      if (assessmentId && typeof window !== 'undefined') {
        const payload = JSON.stringify({ x: pos.x, y: pos.y, width: pos.width, height: pos.height, viewport: vp });
        safeSetItem(`candidate:${assessmentId}:calculator:position`, payload, () => {});
      }
    },
  };
});

/**
 * Unified helper called exclusively upon confirmed test submission or expiration
 * to clean up all storage keys for an assessment.
 */
export function clearAssessmentSandboxStorage(assessmentId: string) {
  if (typeof window === 'undefined' || !assessmentId) return;
  const keys = [
    `candidate:${assessmentId}:scratchpad:text`,
    `candidate:${assessmentId}:scratchpad:canvas`,
    `candidate:${assessmentId}:scratchpad:position`,
    `candidate:${assessmentId}:calculator`,
    `candidate:${assessmentId}:calculator:position`,
  ];
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key}:`, e);
    }
  });

  // Reset stores in memory if active for this assessment
  const scratchState = useScratchPad.getState();
  if (scratchState.assessmentId === assessmentId) {
    useScratchPad.setState({ text: '', canvasHistory: [], canvasIndex: -1, isOpen: false });
  }

  const calcState = useCalculator.getState();
  if (calcState.assessmentId === assessmentId) {
    useCalculator.setState({ display: '0', expression: '', history: [], isOpen: false, previousOperand: null, operation: null });
  }
}
