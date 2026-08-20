'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFaceTracker } from '../hooks/useFaceTracker';
import { AlertCircle, Camera, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceTrackerProps {
  onSubmit: () => void;
}

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
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      role='dialog'
      aria-modal='true'
    >
      <div className='absolute inset-0 bg-black/60' />
      <div className='relative z-10 flex flex-col items-center justify-center bg-white rounded-lg shadow-2xl border border-gray-300 p-6 max-w-sm w-full mx-4'>
        {icon}
        <h2 className='text-lg font-bold text-gray-900 text-center uppercase tracking-wide mb-2'>
          {title}
        </h2>
        <p className='text-gray-600 text-center text-xs mb-4 leading-relaxed'>{description}</p>
        <span className='inline-flex items-center justify-center bg-red-50 text-red-600 font-bold px-4 py-1.5 rounded text-xs mb-5 border border-red-200'>
          {badge}
        </span>
        <button
          onClick={onDismiss}
          className='bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-sm font-semibold text-xs transition-colors shadow-sm'
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

  const prevViolationsRef = useRef(violations);
  useEffect(() => {
    if (violations > prevViolationsRef.current) {
      setNoFaceDismissed(false);
      setMultiFaceDismissed(false);
    }
    prevViolationsRef.current = violations;
  }, [violations]);

  useEffect(() => {
    if (isFaceDetected) setNoFaceDismissed(false);
  }, [isFaceDetected]);

  useEffect(() => {
    if (!isMultipleFaces) setMultiFaceDismissed(false);
  }, [isMultipleFaces]);

  return (
    <>
      <WarningDialog
        isOpen={!isFaceDetected && !noFaceDismissed && isModelLoaded && !hasCameraError}
        icon={<AlertCircle className='size-12 text-red-500 mb-3 animate-bounce' />}
        title='Warning: Face Not Detected'
        description='Please ensure your face is clearly visible in the camera frame. The assessment will be automatically submitted if this persists.'
        badge={`Violations: ${violations} / ${maxViolations}`}
        onDismiss={() => setNoFaceDismissed(true)}
      />

      <WarningDialog
        isOpen={isMultipleFaces && !multiFaceDismissed && isModelLoaded && !hasCameraError}
        icon={<Users className='size-12 text-orange-500 mb-3 animate-bounce' />}
        title='Warning: Multiple Faces Detected'
        description='Only one person is allowed during the assessment. Having another person present is considered a violation and may result in automatic submission.'
        badge={`Violations: ${violations} / ${maxViolations}`}
        onDismiss={() => setMultiFaceDismissed(true)}
      />

      <div
        ref={containerRef}
        className={cn(
          'w-full h-full bg-gray-100 flex items-center justify-center relative overflow-hidden select-none',
          !isFaceDetected && isModelLoaded && !hasCameraError
            ? 'ring-2 ring-red-500 inset-0'
            : isMultipleFaces
              ? 'ring-2 ring-orange-500 inset-0'
              : '',
        )}
      >
        <div className='relative w-full h-full flex flex-col items-center justify-center'>
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
            className='absolute top-0 left-0 w-full h-full object-cover pointer-events-none'
          />

          {(!isModelLoaded || hasCameraError) && (
            <div className='flex flex-col items-center justify-center text-gray-500 bg-gray-100 w-full h-full p-1'>
              {/* Classic silhouette portrait matching CBT exam UI */}
              <svg className='w-12 h-12 text-gray-600 fill-current' viewBox='0 0 24 24'>
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
              </svg>
              {hasCameraError && (
                <span className='text-[8px] text-red-500 font-semibold mt-0.5 text-center leading-none'>
                  Camera Offline
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
