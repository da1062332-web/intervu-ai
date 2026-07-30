'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScratchPad } from './useScratchPad';
import { useSandboxZIndex } from './useSandboxZIndex';
import { ScratchCanvas } from './ScratchCanvas';
import { Minus, X, Maximize2, FileText, Palette, Trash2, GripHorizontal } from 'lucide-react';

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 480;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 260;

export function FloatingScratchPad() {
  const {
    isOpen,
    isMinimized,
    activeTab,
    text,
    position,
    setOpen,
    setMinimized,
    setActiveTab,
    setText,
    setPosition,
    clearAll,
  } = useScratchPad();

  const { scratchPadZ, bringToFront } = useSandboxZIndex();
  const windowRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isInitializedPos, setIsInitializedPos] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Resizing state
  const [isResizing, setIsResizing] = useState<false | 'bottom-right' | 'right' | 'bottom'>(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({ startX: 0, startY: 0, startW: 0, startH: 0 });

  // Set initial position and size or restore from store
  useEffect(() => {
    if (!isOpen && !isMinimized) return;
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      setCurrentPos({ x: position.x, y: position.y });
      if (position.width && position.height) {
        setSize({ width: position.width, height: position.height });
      }
      setIsInitializedPos(true);
    } else if (!isInitializedPos && typeof window !== 'undefined') {
      // Default coordinate at right side under video camera
      const x = Math.max(20, window.innerWidth - DEFAULT_WIDTH - 15);
      const y = 120;
      setCurrentPos({ x, y });
      setIsInitializedPos(true);
    }
  }, [isOpen, isMinimized, position, isInitializedPos]);

  // Ensure 40px of title bar always remains within viewport during resize or screen monitor shift
  const constrainToViewport = useCallback((x: number, y: number, currentWidth = size.width) => {
    if (typeof window === 'undefined') return { x, y };
    const maxLeft = window.innerWidth - 40; // At least 40px visible on right edge
    const minLeft = -currentWidth + 40;     // At least 40px visible on left edge
    const minTop = 0;                       // Title bar cannot go above top viewport
    const maxTop = window.innerHeight - 40; // At least 40px of top bar visible at bottom

    const clampedX = Math.max(minLeft, Math.min(x, maxLeft));
    const clampedY = Math.max(minTop, Math.min(y, maxTop));
    return { x: clampedX, y: clampedY };
  }, [size.width]);

  useEffect(() => {
    const handleResize = () => {
      setCurrentPos((prev) => {
        const next = constrainToViewport(prev.x, prev.y);
        if (next.x !== prev.x || next.y !== prev.y) {
          setPosition({ ...next, width: size.width, height: size.height }, { width: window.innerWidth, height: window.innerHeight });
        }
        return next;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport, setPosition, size.width, size.height]);

  // Drag logic
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isResizing) return;
    bringToFront('scratchpad');
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - currentPos.x, y: clientY - currentPos.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rawX = clientX - dragOffset.x;
      const rawY = clientY - dragOffset.y;
      const constrained = constrainToViewport(rawX, rawY);
      setCurrentPos(constrained);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setPosition({ ...currentPos, width: size.width, height: size.height }, { width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, currentPos, constrainToViewport, setPosition, size.width, size.height]);

  // Border Resizing Logic
  const startResize = (e: React.MouseEvent | React.TouchEvent, mode: 'bottom-right' | 'right' | 'bottom') => {
    e.stopPropagation();
    bringToFront('scratchpad');
    setIsResizing(mode);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = { startX: clientX, startY: clientY, startW: size.width, startH: size.height };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - resizeRef.current.startX;
      const deltaY = clientY - resizeRef.current.startY;

      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;

      if (isResizing === 'right' || isResizing === 'bottom-right') {
        newW = Math.max(MIN_WIDTH, Math.min(resizeRef.current.startW + deltaX, window.innerWidth - currentPos.x - 10));
      }
      if (isResizing === 'bottom' || isResizing === 'bottom-right') {
        newH = Math.max(MIN_HEIGHT, Math.min(resizeRef.current.startH + deltaY, window.innerHeight - currentPos.y - 10));
      }

      setSize({ width: Math.round(newW), height: Math.round(newH) });
    };

    const handleEnd = () => {
      setIsResizing(false);
      setPosition(
        { ...currentPos, width: size.width, height: size.height },
        { width: window.innerWidth, height: window.innerHeight }
      );
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, currentPos, size.width, size.height, setPosition]);

  // Accessibility ESC key to close when active window
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, showConfirmModal, setOpen]);

  if (!isOpen) return null;

  // Minimized Floating Chip View
  if (isMinimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false);
          bringToFront('scratchpad');
        }}
        className='fixed bottom-[74px] right-[240px] z-[950] bg-[#1c3e66] hover:bg-[#142d4a] text-white px-3.5 py-2 rounded-full shadow-lg border border-blue-400 flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in zoom-in-95 duration-150'
        style={{ zIndex: scratchPadZ }}
        aria-label='Restore Rough Paper Notes'
      >
        <span>📝 Notes</span>
        <Maximize2 className='size-3.5 ml-1 text-blue-200' />
      </button>
    );
  }

  // Full Window Modal View with Border Resizing
  return (
    <div
      ref={windowRef}
      role='dialog'
      aria-label='Rough Paper (Scratch Pad)'
      className='fixed flex flex-col rounded-lg border border-gray-400/80 bg-white shadow-2xl select-none animate-in zoom-in-95 duration-150 overflow-hidden'
      style={{
        left: currentPos.x,
        top: currentPos.y,
        width: size.width,
        height: size.height,
        zIndex: scratchPadZ,
      }}
      onMouseDown={() => bringToFront('scratchpad')}
      onTouchStart={() => bringToFront('scratchpad')}
    >
      {/* Title Header Bar - Draggable */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className='flex items-center justify-between px-3 py-2.5 bg-[#1c3e66] text-white cursor-move select-none shrink-0'
      >
        <div className='flex items-center gap-2 overflow-hidden font-bold text-sm'>
          <GripHorizontal className='size-4 text-blue-300 shrink-0' />
          <span>📝 Rough Paper (Scratch Pad)</span>
        </div>
        <div className='flex items-center gap-1 shrink-0 ml-2'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(true);
            }}
            className='p-1 hover:bg-white/15 text-blue-200 hover:text-white rounded transition-colors cursor-pointer'
            title='Minimize to floating chip'
            aria-label='Minimize'
          >
            <Minus className='size-4' />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className='p-1 hover:bg-red-600 text-blue-200 hover:text-white rounded transition-colors ml-0.5 cursor-pointer'
            title='Close (Data will be preserved)'
            aria-label='Close'
          >
            <X className='size-4' />
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Notes | Drawing) */}
      <div className='flex items-center justify-between bg-gray-100 px-3 border-b border-gray-200 shrink-0'>
        <div className='flex items-center gap-1 -mb-px'>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'border-[#1c3e66] text-[#1c3e66] bg-white shadow-xs'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FileText className='size-3.5' />
            <span>Plain Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('drawing')}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeTab === 'drawing'
                ? 'border-[#1c3e66] text-[#1c3e66] bg-white shadow-xs'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Palette className='size-3.5' />
            <span>Freehand Drawing</span>
          </button>
        </div>

        {/* Clear All action - triggers safe in-app modal instead of browser alert */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className='flex items-center gap-1 px-2 py-1 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 border border-gray-200 rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer'
          title='Clear All notes and drawing'
        >
          <Trash2 className='size-3' />
          <span>Clear All</span>
        </button>
      </div>

      {/* Content Body */}
      <div className='flex-1 relative w-full h-full bg-white overflow-hidden flex flex-col select-text pb-4 pr-1'>
        {activeTab === 'notes' ? (
          <div className='flex flex-1 flex-col p-3 bg-white h-full overflow-hidden'>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type rough calculations, thoughts, formulas, or essay points here... (Auto-saved automatically)'
              className='w-full flex-1 p-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none leading-relaxed select-text'
              aria-label='Scratchpad notes textarea'
              autoFocus
            />
            <div className='flex items-center justify-between text-[11px] text-gray-400 mt-1 px-1 font-sans shrink-0'>
              <span>Char count: {text.length}</span>
              <span className='mr-3'>⚡ Saved to assessment memory</span>
            </div>
          </div>
        ) : (
          <ScratchCanvas />
        )}
      </div>

      {/* In-App Confirmation Modal (No native alert/confirm to preserve Fullscreen Mode) */}
      {showConfirmModal && (
        <div 
          className='absolute inset-0 z-[200] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none'
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className='bg-white rounded-lg p-5 max-w-[320px] w-full shadow-2xl border border-gray-200 text-gray-800 flex flex-col space-y-3 animate-in zoom-in-95 duration-150'>
            <div className='flex items-center gap-2 text-red-600 font-bold text-sm'>
              <span className='text-lg'>⚠️</span>
              <span>Clear Rough Paper?</span>
            </div>
            <p className='text-xs text-gray-600 leading-relaxed font-sans font-normal'>
              Are you sure you want to completely erase your plain notes and freehand drawing history? This action cannot be undone.
            </p>
            <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-100'>
              <button
                onClick={() => setShowConfirmModal(false)}
                className='px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAll();
                  setShowConfirmModal(false);
                }}
                className='px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer'
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Border & Corner Resize Handles */}
      {/* Right Edge Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'right')}
        onTouchStart={(e) => startResize(e, 'right')}
        className='absolute top-0 right-0 w-2 h-full cursor-ew-resize z-[100] hover:bg-blue-500/20 transition-colors'
        title='Drag horizontally to resize width'
      />
      {/* Bottom Edge Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'bottom')}
        onTouchStart={(e) => startResize(e, 'bottom')}
        className='absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-[100] hover:bg-blue-500/20 transition-colors'
        title='Drag vertically to resize height'
      />
      {/* Bottom-Right Corner Grip Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'bottom-right')}
        onTouchStart={(e) => startResize(e, 'bottom-right')}
        className='absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-[110] flex items-end justify-end p-0.5 bg-gray-100 hover:bg-blue-100 border-t border-l border-gray-300 rounded-tl transition-colors text-gray-500 hover:text-blue-600 shadow-xs'
        title='Drag corner to resize window'
      >
        <svg className='size-3 stroke-current' viewBox='0 0 16 16' fill='none' strokeWidth='2'>
          <line x1='14' y1='6' x2='6' y2='14' />
          <line x1='14' y1='10' x2='10' y2='14' />
        </svg>
      </div>
    </div>
  );
}
