import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';

interface KeyboardShortcutProps {
  onSubmit: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({ onSubmit, disabled }: KeyboardShortcutProps) {
  const { goNext, goPrevious, toggleReview, currentQuestion } = useExecutionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // Prevent shortcut if we are typing in an input or textarea
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Aggressively block all function keys (F1-F12) and the Escape key
      if ((e.key.startsWith('F') && e.key.length > 1) || e.key === 'Escape') {
        e.preventDefault();
        return;
      }

      // If they are not typing in an input, block ALL Ctrl, Alt, and Meta (Windows/Cmd) key combinations
      if (!isInput && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        return;
      }

      // Even if they ARE in an input, block specific harmful combinations like Ctrl+R, Ctrl+P, Ctrl+S, etc.
      // (Copy/paste is already blocked at the ExecutionLayout level)
      if (isInput && (e.ctrlKey || e.metaKey)) {
        const key = e.key.toLowerCase();
        // Allow Ctrl+A (select all), Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+X/C/V (handled by layout)
        if (!['a', 'z', 'y', 'x', 'c', 'v'].includes(key)) {
          e.preventDefault();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious, toggleReview, onSubmit, currentQuestion, disabled]);
}
