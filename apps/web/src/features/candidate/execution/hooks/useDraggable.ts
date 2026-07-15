import { useState, useEffect, RefObject } from 'react';

interface Position {
  x: number;
  y: number;
}

export function useDraggable(ref: RefObject<HTMLElement>) {
  const [position, setPosition] = useState<Position>({ x: -1000, y: -1000 }); // Render off-screen initially
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);

  useEffect(() => {
    // Set initial position to right side (below question palette)
    if (ref.current && position.x === -1000) {
      const width = ref.current.offsetWidth || 192; // fallback width for w-48
      const x = window.innerWidth - width - 24; // 24px padding from right
      const y = 88; // Just below header, above question palette
      setPosition({ x, y });
    }
  }, [ref, position.x]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStart) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep within window bounds roughly
      const maxX = window.innerWidth - (ref.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (ref.current?.offsetHeight || 0);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position.x, position.y, ref]);

  return { position, isDragging };
}
