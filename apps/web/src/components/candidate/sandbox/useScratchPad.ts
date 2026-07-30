'use client';

import { create } from 'zustand';
import { toast } from 'sonner';

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

interface ScratchPadState {
  assessmentId: string | null;
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'notes' | 'drawing';
  text: string;
  canvasHistory: string[]; // Stack of data URLs for Undo/Redo
  canvasIndex: number; // Current position in history stack (-1 if empty)
  position: Position | null;
  viewport: Viewport | null;
  hasQuotaFailed: boolean;

  // Actions
  initialize: (assessmentId: string) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setActiveTab: (tab: 'notes' | 'drawing') => void;
  setText: (text: string) => void;
  pushCanvasState: (dataUrl: string) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  clearAll: () => void;
  setPosition: (pos: Position, vp?: Viewport) => void;
}

// Debounce helper for auto-saving text notes
let textSaveTimeout: NodeJS.Timeout | null = null;

function safeSetItem(key: string, value: string, onQuotaError: () => void) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (err: any) {
    // QuotaExceededError or other storage failure
    onQuotaError();
  }
}

export const useScratchPad = create<ScratchPadState>((set, get) => ({
  assessmentId: null,
  isOpen: false,
  isMinimized: false,
  activeTab: 'notes',
  text: '',
  canvasHistory: [],
  canvasIndex: -1,
  position: null,
  viewport: null,
  hasQuotaFailed: false,

  initialize: (assessmentId: string) => {
    if (typeof window === 'undefined') return;

    const textKey = `candidate:${assessmentId}:scratchpad:text`;
    const canvasKey = `candidate:${assessmentId}:scratchpad:canvas`;
    const positionKey = `candidate:${assessmentId}:scratchpad:position`;

    const savedText = localStorage.getItem(textKey) || '';
    const savedCanvas = localStorage.getItem(canvasKey);
    const savedPositionStr = localStorage.getItem(positionKey);

    let canvasHistory: string[] = [];
    let canvasIndex = -1;
    if (savedCanvas) {
      try {
        const parsed = JSON.parse(savedCanvas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          canvasHistory = parsed;
          canvasIndex = parsed.length - 1;
        } else if (typeof parsed === 'string' && parsed.length > 0) {
          canvasHistory = [parsed];
          canvasIndex = 0;
        }
      } catch (e) {
        // Fallback if raw string dataUrl was stored
        canvasHistory = [savedCanvas];
        canvasIndex = 0;
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
            // Check monitor safety: if monitor changed significantly or window is out of bounds, reset position
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
        console.error('Error parsing scratchpad position:', e);
      }
    }

    set({
      assessmentId,
      text: savedText,
      canvasHistory,
      canvasIndex,
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

  setActiveTab: (tab: 'notes' | 'drawing') => {
    set({ activeTab: tab });
  },

  setText: (newText: string) => {
    set({ text: newText });

    const { assessmentId } = get();
    if (!assessmentId) return;

    // 500ms debounce auto-save
    if (textSaveTimeout) clearTimeout(textSaveTimeout);
    textSaveTimeout = setTimeout(() => {
      safeSetItem(
        `candidate:${assessmentId}:scratchpad:text`,
        newText,
        () => {
          if (!get().hasQuotaFailed) {
            set({ hasQuotaFailed: true });
            toast.error('Unable to save locally. Your notes will remain until this session ends.', { id: 'scratchpad-quota' });
          }
        }
      );
    }, 500);
  },

  pushCanvasState: (dataUrl: string) => {
    const { canvasHistory, canvasIndex, assessmentId } = get();
    // Slice off any redo future if we drew a new line after undoing
    const nextHistory = [...canvasHistory.slice(0, canvasIndex + 1), dataUrl];
    const nextIndex = nextHistory.length - 1;

    set({ canvasHistory: nextHistory, canvasIndex: nextIndex });

    if (assessmentId) {
      safeSetItem(
        `candidate:${assessmentId}:scratchpad:canvas`,
        JSON.stringify(nextHistory),
        () => {
          if (!get().hasQuotaFailed) {
            set({ hasQuotaFailed: true });
            toast.error('Unable to save locally. Your notes will remain until this session ends.', { id: 'scratchpad-quota' });
          }
        }
      );
    }
  },

  undo: () => {
    const { canvasIndex, canvasHistory, assessmentId } = get();
    if (canvasIndex <= 0) {
      // If index is 0 or less, undoing goes to empty state (-1)
      if (canvasIndex === 0) {
        set({ canvasIndex: -1 });
        if (assessmentId) {
          safeSetItem(`candidate:${assessmentId}:scratchpad:canvas`, JSON.stringify([]), () => {});
        }
      }
      return;
    }
    const nextIndex = canvasIndex - 1;
    set({ canvasIndex: nextIndex });
    if (assessmentId) {
      safeSetItem(
        `candidate:${assessmentId}:scratchpad:canvas`,
        JSON.stringify(canvasHistory.slice(0, nextIndex + 1)),
        () => {}
      );
    }
  },

  redo: () => {
    const { canvasIndex, canvasHistory, assessmentId } = get();
    if (canvasIndex >= canvasHistory.length - 1) return;
    const nextIndex = canvasIndex + 1;
    set({ canvasIndex: nextIndex });
    if (assessmentId) {
      safeSetItem(
        `candidate:${assessmentId}:scratchpad:canvas`,
        JSON.stringify(canvasHistory.slice(0, nextIndex + 1)),
        () => {}
      );
    }
  },

  clearCanvas: () => {
    set({ canvasHistory: [], canvasIndex: -1 });
    const { assessmentId } = get();
    if (assessmentId && typeof window !== 'undefined') {
      localStorage.removeItem(`candidate:${assessmentId}:scratchpad:canvas`);
    }
  },

  clearAll: () => {
    if (textSaveTimeout) clearTimeout(textSaveTimeout);
    set({
      text: '',
      canvasHistory: [],
      canvasIndex: -1,
    });
    const { assessmentId } = get();
    if (assessmentId && typeof window !== 'undefined') {
      localStorage.removeItem(`candidate:${assessmentId}:scratchpad:text`);
      localStorage.removeItem(`candidate:${assessmentId}:scratchpad:canvas`);
    }
    toast.success('Scratch pad cleared');
  },

  setPosition: (pos: Position, vp?: Viewport) => {
    set({ position: pos, viewport: vp || null });
    const { assessmentId } = get();
    if (assessmentId && typeof window !== 'undefined') {
      const payload = JSON.stringify({ x: pos.x, y: pos.y, width: pos.width, height: pos.height, viewport: vp });
      safeSetItem(`candidate:${assessmentId}:scratchpad:position`, payload, () => {});
    }
  },
}));
