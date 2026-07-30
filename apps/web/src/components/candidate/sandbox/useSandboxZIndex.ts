'use client';

import { create } from 'zustand';

export type SandboxTool = 'scratchpad' | 'calculator';

interface SandboxZIndexState {
  activeTool: SandboxTool | null;
  scratchPadZ: number;
  calculatorZ: number;
  bringToFront: (tool: SandboxTool) => void;
}

export const useSandboxZIndex = create<SandboxZIndexState>((set) => ({
  activeTool: null,
  scratchPadZ: 1000,
  calculatorZ: 1001,
  bringToFront: (tool: SandboxTool) => {
    set((state) => {
      if (state.activeTool === tool) return state;
      if (tool === 'scratchpad') {
        return {
          activeTool: 'scratchpad',
          scratchPadZ: Math.max(state.scratchPadZ, state.calculatorZ) + 1,
        };
      } else {
        return {
          activeTool: 'calculator',
          calculatorZ: Math.max(state.scratchPadZ, state.calculatorZ) + 1,
        };
      }
    });
  },
}));
