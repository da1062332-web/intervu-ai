'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Mic, MicOff, UserCheck, UserX } from 'lucide-react';

interface MediaPreviewProps {
  onFaceDetected: (detected: boolean) => void;
  onMicActive: (active: boolean) => void;
}

export function MediaPreview({ onFaceDetected, onMicActive }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [hasFace, setHasFace] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    // Load models
    const loadModels = async () => {
      try {
        await Promise.allSettled([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models', err);
        setStreamError(
          'Failed to load face detection models. Ensure models exist in /models directory.',
        );
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

    let activeStream: MediaStream | null = null;
    let isActive = true;

    const setupMedia = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media capture APIs not supported (requires HTTPS or localhost).');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio context
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        startDetectionLoop();
      } catch (err) {
        setStreamError(err instanceof Error ? err.message : String(err));
      }
    };

    setupMedia();

    return () => {
      isActive = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [modelsLoaded]);

  const startDetectionLoop = () => {
    const detect = async () => {
      // Audio Detection
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setVolume(average);

        const isMicActive = average > 5;
        setMicActive(isMicActive);
        onMicActive(isMicActive);
      }

      // Face Detection
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const isSsdReady = faceapi.nets.ssdMobilenetv1.isLoaded;
          const options = isSsdReady
            ? new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
            : new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 });
          const detection = await faceapi.detectSingleFace(videoRef.current, options);

          if (canvasRef.current && videoRef.current) {
            const displaySize = {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            };

            // Only match dimensions if they differ to prevent clearing the canvas unnecessarily
            if (
              canvasRef.current.width !== displaySize.width ||
              canvasRef.current.height !== displaySize.height
            ) {
              faceapi.matchDimensions(canvasRef.current, displaySize);
            }

            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              if (detection) {
                const resizedDetections = faceapi.resizeResults(detection, displaySize);
                ctx.strokeStyle = '#ef4444'; // Red-500
                ctx.lineWidth = 2; // Thin
                ctx.strokeRect(
                  resizedDetections.box.x,
                  resizedDetections.box.y,
                  resizedDetections.box.width,
                  resizedDetections.box.height,
                );
              }
            }
          }

          const faceDetected = !!detection;
          setHasFace(faceDetected);
          onFaceDetected(faceDetected);
        } catch {
          // ignore detection errors on unmount
        }
      }

      // Continue loop with a timeout to reduce CPU usage
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(detect);
      }, 500);
    };

    detect();
  };

  if (streamError) {
    return (
      <div className='w-full bg-red-50 text-red-600 p-4 rounded-lg border border-red-200'>
        <p className='font-semibold text-sm'>Media Error</p>
        <p className='text-xs'>{streamError}</p>
      </div>
    );
  }

  return (
    <div className='relative w-full overflow-hidden rounded-lg border bg-slate-900 aspect-video flex flex-col items-center justify-center shadow-inner'>
      {!modelsLoaded ? (
        <div className='text-white text-sm flex flex-col items-center gap-2'>
          <div className='w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin'></div>
          Loading AI Models...
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Muted to prevent audio feedback loop
            className='w-full h-full object-cover transform -scale-x-100'
          />
          <canvas
            ref={canvasRef}
            className='absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none'
          />

          {/* Overlay Gradients for readability */}
          <div className='absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none' />

          <div className='absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none'>
            {/* Mic Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${micActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
            >
              {micActive ? <Mic className='w-3.5 h-3.5' /> : <MicOff className='w-3.5 h-3.5' />}
              <div className='flex gap-0.5 items-end h-3'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${micActive ? 'bg-green-400' : 'bg-red-400/50'}`}
                    style={{
                      height: micActive
                        ? `${Math.max(20, Math.min(100, volume * (i / 1.5)))}%`
                        : '20%',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Face Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${hasFace ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
            >
              {hasFace ? <UserCheck className='w-3.5 h-3.5' /> : <UserX className='w-3.5 h-3.5' />}
              {hasFace ? 'Face Detected' : 'No Face Detected'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
