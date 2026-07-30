'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useScratchPad } from './useScratchPad';
import { Pencil, Eraser, Undo2, Redo2, Trash2, Circle } from 'lucide-react';

const PEN_COLORS = ['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#9333ea'];
const BRUSH_SIZES = [
  { label: 'Small', value: 2 },
  { label: 'Medium', value: 5 },
  { label: 'Large', value: 10 },
];

export function ScratchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorIndicatorRef = useRef<HTMLDivElement | null>(null);
  
  const { canvasHistory, canvasIndex, pushCanvasState, undo, redo, clearCanvas } = useScratchPad();
  
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState<string>('#0f172a');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate rubber eraser footprint diameter based on size setting
  const getEraserWidth = useCallback((size: number) => {
    return size <= 2 ? 14 : size <= 5 ? 26 : 44;
  }, []);

  // Handle high DPI display density scaling and responsive sizing
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Restore existing drawing from reliable store state after resize
    if (canvasIndex >= 0 && canvasHistory[canvasIndex]) {
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          ctx.restore();
        }
      };
      img.src = canvasHistory[canvasIndex];
    }
  }, [canvasIndex, canvasHistory]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    const container = containerRef.current;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        resizeCanvas();
      });
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [resizeCanvas]);

  // Restore canvas whenever canvasIndex changes (Undo / Redo / Initial Load / Clear)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Guaranteed complete physical buffer wipe regardless of DPI scaling or active transforms
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (canvasIndex >= 0 && canvasHistory[canvasIndex]) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        ctx.restore();
      };
      img.src = canvasHistory[canvasIndex];
    }
  }, [canvasIndex, canvasHistory]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  // Hardware-accelerated direct DOM update for custom drawing cursor without triggering React re-renders
  const updateCursorPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const { x, y } = getCoordinates(e);
    if (cursorIndicatorRef.current && ('clientX' in e || 'touches' in e)) {
      cursorIndicatorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursorIndicatorRef.current.style.opacity = '1';
    }
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (showClearModal) return;
    e.preventDefault();
    const { x, y } = updateCursorPosition(e);
    setIsDrawing(true);
    lastPosRef.current = { x, y };

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? getEraserWidth(brushSize) : brushSize;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    updateCursorPosition(e);
    if (!isDrawing || showClearModal) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? getEraserWidth(brushSize) : brushSize;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
    }
    lastPosRef.current = { x, y };
  };

  const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      pushCanvasState(dataUrl);
    }
  };

  return (
    <div className='flex flex-col h-full w-full bg-white rounded-b-md overflow-hidden select-none relative'>
      {/* Canvas Toolbar */}
      <div className='flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0 flex-wrap z-10'>
        <div className='flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-2xs'>
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              tool === 'pen' ? 'bg-[#d6eafb] text-[#1c3e66] font-bold' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title='Pencil Tool'
            aria-label='Pencil Tool'
          >
            <Pencil className='w-4 h-4' />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
              tool === 'eraser' ? 'bg-[#d6eafb] text-[#1c3e66] font-bold' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title='Rubber (Eraser) Tool'
            aria-label='Rubber (Eraser) Tool'
          >
            <Eraser className='w-4 h-4' />
          </button>
        </div>

        {/* Color Palette (Active only when Pencil is chosen) */}
        {tool === 'pen' && (
          <div className='flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200 shadow-2xs animate-in fade-in duration-150'>
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border border-gray-300 transition-transform cursor-pointer ${
                  color === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 shadow-xs' : 'hover:scale-110'
                }`}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        )}

        {/* Dynamic Brush / Rubber Size Selector */}
        <div className='flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-2xs text-xs font-medium text-gray-700'>
          {BRUSH_SIZES.map((size) => {
            const isSelected = brushSize === size.value;
            return (
              <button
                key={size.label}
                onClick={() => setBrushSize(size.value)}
                className={`px-2 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected ? 'bg-gray-200 font-bold text-gray-950 shadow-2xs' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={`Select ${size.label} ${tool === 'pen' ? 'Pencil' : 'Rubber'} Size`}
              >
                {tool === 'pen' ? (
                  <Circle
                    className='fill-current transition-transform'
                    style={{
                      width: size.value + 4,
                      height: size.value + 4,
                      color: isSelected ? color : 'currentColor',
                    }}
                  />
                ) : (
                  <Eraser
                    className='text-slate-700 transition-transform'
                    style={{
                      width: size.value <= 2 ? 13 : size.value <= 5 ? 16 : 20,
                      height: size.value <= 2 ? 13 : size.value <= 5 ? 16 : 20,
                    }}
                  />
                )}
                <span className='hidden sm:inline'>{size.label}</span>
              </button>
            );
          })}
        </div>

        {/* History and Clear Actions */}
        <div className='flex items-center gap-1 ml-auto'>
          <button
            onClick={undo}
            disabled={canvasIndex <= -1}
            className='p-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
            title='Undo (Ctrl+Z)'
            aria-label='Undo'
          >
            <Undo2 className='w-4 h-4' />
          </button>
          <button
            onClick={redo}
            disabled={canvasIndex >= canvasHistory.length - 1}
            className='p-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
            title='Redo (Ctrl+Y)'
            aria-label='Redo'
          >
            <Redo2 className='w-4 h-4' />
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className='p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded ml-1 transition-colors cursor-pointer'
            title='Clear Drawing Only'
            aria-label='Clear Drawing Only'
          >
            <Trash2 className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Drawing Surface with Custom Hardware-Accelerated Floating Cursor */}
      <div
        ref={containerRef}
        onMouseEnter={(e) => {
          if (cursorIndicatorRef.current) cursorIndicatorRef.current.style.opacity = '1';
          updateCursorPosition(e);
        }}
        onMouseLeave={(e) => {
          if (cursorIndicatorRef.current) cursorIndicatorRef.current.style.opacity = '0';
          endDrawing(e);
        }}
        className='flex-1 relative w-full h-full bg-white overflow-hidden cursor-none'
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={handleMouseMove}
          onTouchEnd={endDrawing}
          className='absolute top-0 left-0 w-full h-full block touch-none cursor-none'
        />

        {/* Floating Custom Tool Cursor Indicator */}
        <div
          ref={cursorIndicatorRef}
          className='pointer-events-none absolute top-0 left-0 z-30 transition-opacity duration-150 opacity-0 hidden sm:block'
          style={{ willChange: 'transform' }}
        >
          {tool === 'pen' ? (
            <div className='relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2'>
              {/* Exact ink brush dot preview */}
              <div
                className='rounded-full border border-slate-400/80 shadow-2xs'
                style={{
                  width: Math.max(4, brushSize),
                  height: Math.max(4, brushSize),
                  backgroundColor: color,
                }}
              />
              {/* Pencil icon pointing precisely at the cursor dot */}
              <div className='absolute bottom-[50%] left-[50%] -translate-x-[2px] translate-y-[2px] transform pointer-events-none filter drop-shadow'>
                <Pencil
                  className='size-5 text-slate-800 fill-amber-200 transform -rotate-12'
                  style={{ stroke: color === '#ffffff' ? '#0f172a' : color }}
                />
              </div>
            </div>
          ) : (
            <div className='relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2'>
              {/* Rubber footprint circle matching the chosen eraser size */}
              <div
                className='rounded-full bg-white/85 border-2 border-slate-700/80 shadow-md flex items-center justify-center backdrop-blur-[1px]'
                style={{
                  width: getEraserWidth(brushSize),
                  height: getEraserWidth(brushSize),
                }}
              >
                <Eraser
                  className='text-slate-700 opacity-80 shrink-0'
                  style={{
                    width: Math.max(10, Math.min(22, getEraserWidth(brushSize) * 0.55)),
                    height: Math.max(10, Math.min(22, getEraserWidth(brushSize) * 0.55)),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* In-App Confirmation Modal for Clearing Drawing Only */}
      {showClearModal && (
        <div
          className='absolute inset-0 z-[210] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150 select-none'
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className='bg-white rounded-lg p-5 max-w-[310px] w-full shadow-2xl border border-gray-200 text-gray-800 flex flex-col space-y-3 animate-in zoom-in-95 duration-150 font-sans'>
            <div className='flex items-center gap-2 text-red-600 font-bold text-sm'>
              <span className='text-lg'>⚠️</span>
              <span>Clear Drawing Canvas?</span>
            </div>
            <p className='text-xs text-gray-600 leading-relaxed font-normal'>
              Are you sure you want to completely clear your freehand drawing? Your Plain Notes will not be affected.
            </p>
            <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-100'>
              <button
                onClick={() => setShowClearModal(false)}
                className='px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setShowClearModal(false);
                }}
                className='px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer'
              >
                Yes, Clear Drawing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
