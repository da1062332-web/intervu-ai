'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFaceTracker } from '../hooks/useFaceTracker';
import { AlertCircle, Camera, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceTrackerProps {
  onSubmit: () => void;
}

// ── Generic warning dialog rendered into body via portal ──────────────────
function WarningDialog({
  isOpen,
  icon,
  title,
  description,
  badge,
  onDismiss,
}: {
  isOpen: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      role='dialog'
      aria-modal='true'
    >
      <div className='absolute inset-0 bg-black/60' />
      <div className='relative z-10 flex flex-col items-center justify-center bg-white rounded-2xl shadow-2xl border-2 border-red-300 p-8 max-w-sm w-full mx-4'>
        {icon}
        <h2 className='text-2xl font-bold text-gray-900 text-center uppercase tracking-wide mb-3'>
          {title}
        </h2>
        <p className='text-gray-500 text-center text-sm mb-5 leading-relaxed'>
          {description}
        </p>
        <span className='inline-flex items-center justify-center bg-red-50 text-red-600 font-bold px-5 py-2 rounded-full text-sm mb-6 border border-red-200'>
          {badge}
        </span>
        <button
          onClick={onDismiss}
          className='bg-red-500 hover:bg-red-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-sm'
        >
          I Understand
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function FaceTracker({ onSubmit }: FaceTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isModelLoaded,
    violations,
    maxViolations,
    isFaceDetected,
    isMultipleFaces,
    hasCameraError,
  } = useFaceTracker({ videoRef, canvasRef, onSubmit });

  const [noFaceDismissed, setNoFaceDismissed] = useState(false);
  const [multiFaceDismissed, setMultiFaceDismissed] = useState(false);

  // Reset dismissal once face is back to normal (single face)
  useEffect(() => {
    if (isFaceDetected && !isMultipleFaces) {
      setNoFaceDismissed(false);
      setMultiFaceDismissed(false);
    }
    if (isFaceDetected) setNoFaceDismissed(false);
    if (!isMultipleFaces) setMultiFaceDismissed(false);
  }, [isFaceDetected, isMultipleFaces]);

  return (
    <>
      {/* Warning: no face detected */}
      <WarningDialog
        isOpen={!isFaceDetected && !noFaceDismissed && isModelLoaded && !hasCameraError}
        icon={<AlertCircle className='size-14 text-red-500 mb-4 animate-bounce' />}
        title='Warning: Face Not Detected'
        description='Please ensure your face is clearly visible in the camera frame. The assessment will be automatically submitted if this persists.'
        badge={`Violations: ${violations} / ${maxViolations}`}
        onDismiss={() => setNoFaceDismissed(true)}
      />

      {/* Warning: multiple faces detected */}
      <WarningDialog
        isOpen={isMultipleFaces && !multiFaceDismissed && isModelLoaded && !hasCameraError}
        icon={<Users className='size-14 text-orange-500 mb-4 animate-bounce' />}
        title='Warning: Multiple Faces Detected'
        description='Only one person is allowed during the assessment. Having another person present is considered a violation and may result in automatic submission.'
        badge={`Violations: ${violations} / ${maxViolations}`}
        onDismiss={() => setMultiFaceDismissed(true)}
      />

      <div
        ref={containerRef}
        className={cn(
          'w-[calc(100%-2rem)] mx-auto bg-card rounded-xl shadow-sm overflow-hidden border-2 transition-colors mb-0',
          !isFaceDetected
            ? 'border-red-400'
            : isMultipleFaces
            ? 'border-orange-400'
            : 'border-border/40',
        )}
      >
        <div className='relative w-full aspect-video bg-black flex flex-col items-center justify-center'>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              'w-full h-full object-cover',
              hasCameraError || !isModelLoaded ? 'hidden' : 'block',
            )}
          />
          <canvas
            ref={canvasRef}
            className='absolute top-0 left-0 w-full h-full pointer-events-none'
          />

          {!isModelLoaded && !hasCameraError && (
            <p className='text-xs text-white/70 animate-pulse'>Loading camera...</p>
          )}
          {hasCameraError && (
            <div className='flex flex-col items-center text-red-400'>
              <Camera className='size-6 mb-1' />
              <span className='text-[10px] text-center px-2'>Camera error</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
