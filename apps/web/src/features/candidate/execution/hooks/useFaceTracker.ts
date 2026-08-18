'use client';

import { useEffect, useState, useRef } from 'react';

interface UseFaceTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onSubmit: () => void;
}

export function useFaceTracker({ videoRef, canvasRef, onSubmit }: UseFaceTrackerProps) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isMultipleFaces, setIsMultipleFaces] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const maxViolations = 5;

  const violationsRef = useRef(0);
  const isSubmittedRef = useRef(false);
  const noFaceSecondsRef = useRef(0);
  const multiFaceSecondsRef = useRef(0);
  const inNoFaceViolationRef = useRef(false);
  const inMultiFaceViolationRef = useRef(false);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // ─── Phase 1: Start camera immediately (no need to wait for model) ────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    // PRIV-001: Track mounted state to handle the case where the component
    // unmounts before getUserMedia resolves (race condition)
    let mounted = true;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      // PRIV-001: Clear the video srcObject so the browser stops the camera indicator
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      .then((s) => {
        // PRIV-001: If component unmounted before the promise resolved, stop immediately
        if (!mounted) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().catch(() => {});
        }
        setHasCameraError(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[FaceTracker] Camera error', err);
        setHasCameraError(true);
      });

    const handleCleanup = () => {
      console.log('[FaceTracker] Cleaning up runtime media tracks');
      stopStream();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('intervu-cleanup-runtime', handleCleanup);
    }

    return () => {
      // PRIV-001: Cleanup on unmount
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('intervu-cleanup-runtime', handleCleanup);
      }
      stopStream();
    };
  }, []); // run once on mount — independent of model state

  const cleanSingleFaceSecondsRef = useRef(0);

  // ─── Phase 2: Load models (dynamic import to avoid SSR issues) ────────────
  useEffect(() => {
    let cancelled = false;
    import('@vladmandic/face-api').then(async (faceapi) => {
      if (cancelled) return;
      try {
        // Load SSD MobileNet V1 (high accuracy for multi-face, tilted/angled heads)
        // and TinyFaceDetector as fallback
        await Promise.allSettled([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        ]);
        if (!cancelled) {
          console.log('[FaceTracker] Models loaded (SSD MobileNet V1 & TinyFaceDetector)');
          setIsModelLoaded(true);
        }
      } catch (err: unknown) {
        console.error('[FaceTracker] Model load error', err);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Phase 3: Detection loop starts only after model is ready ────────────
  useEffect(() => {
    if (!isModelLoaded) return;

    let faceapiModule: typeof import('@vladmandic/face-api') | null = null;
    let intervalId: ReturnType<typeof setInterval>;

    import('@vladmandic/face-api').then((faceapi) => {
      faceapiModule = faceapi;

      // Prefer SsdMobilenetv1 if weights loaded, otherwise use TinyFaceDetector
      const isSsdReady = faceapi.nets.ssdMobilenetv1.isLoaded;
      const options = isSsdReady
        ? new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 })
        : new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 });

      intervalId = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || isSubmittedRef.current || !faceapiModule) return;

        // Skip if video has no frames yet
        if (
          video.readyState < 2 ||
          video.videoWidth === 0 ||
          video.videoHeight === 0 ||
          video.paused
        ) {
          return;
        }

        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          // Sync video HTML attributes so face-api doesn't fail
          if (video.width !== vw) video.width = vw;
          if (video.height !== vh) video.height = vh;

          // Sync canvas pixel size to video native size
          if (canvas.width !== vw) canvas.width = vw;
          if (canvas.height !== vh) canvas.height = vh;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, vw, vh);

          const detections = await faceapiModule.detectAllFaces(video, options);

          // Scale from model input-space → video native-space
          const imgW = detections[0]?.imageDims?.width || vw;
          const imgH = detections[0]?.imageDims?.height || vh;
          const scaleX = vw / imgW;
          const scaleY = vh / imgH;

          if (detections.length > 1) {
            // ⚠️ Multiple faces (> 1) detected
            noFaceSecondsRef.current = 0;
            cleanSingleFaceSecondsRef.current = 0;
            multiFaceSecondsRef.current += 1;

            // Trigger visual warning state immediately when multiple faces are detected
            setIsMultipleFaces(true);

            // Draw orange bounding boxes and face indexes on all detected faces
            detections.forEach((det, idx) => {
              const { x, y, width, height } = det.box;
              const bx = x * scaleX;
              const by = y * scaleY;
              const bw = width * scaleX;
              const bh = height * scaleY;

              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 2;
              ctx.strokeRect(bx, by, bw, bh);

              // Draw label above face box
              ctx.fillStyle = '#f97316';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText(`Face ${idx + 1}`, bx, Math.max(12, by - 4));
            });

            // Count formal violation after 3 seconds of sustained multi-face detection
            if (multiFaceSecondsRef.current >= 3 && !inMultiFaceViolationRef.current) {
              inMultiFaceViolationRef.current = true;

              const next = violationsRef.current + 1;
              violationsRef.current = next;
              setViolations(next);
              console.log(`[FaceTracker] Violation #${next} — multiple faces`);

              if (next >= maxViolations) {
                isSubmittedRef.current = true;
                clearInterval(intervalId);
                onSubmitRef.current();
              }
            }
          } else if (detections.length === 1) {
            // ✅ One face detected in current frame
            noFaceSecondsRef.current = 0;
            cleanSingleFaceSecondsRef.current += 1;

            // HYSTERESIS LATCH: Require 3 consecutive clean seconds of 1 face
            // before clearing the multi-face warning. This prevents UI flickering
            // if a secondary face turns away or gets briefly obscured.
            if (cleanSingleFaceSecondsRef.current >= 3) {
              multiFaceSecondsRef.current = 0;
              if (inMultiFaceViolationRef.current || isMultipleFaces) {
                inMultiFaceViolationRef.current = false;
                setIsMultipleFaces(false);
              }
            }

            if (inNoFaceViolationRef.current || !isFaceDetected) {
              inNoFaceViolationRef.current = false;
              setIsFaceDetected(true);
            }

            // Draw bounding box: Orange if still latched in multi-face warning, Green if clean single-face
            const isLatchedWarning = cleanSingleFaceSecondsRef.current < 3 && multiFaceSecondsRef.current > 0;
            const { x, y, width, height } = detections[0].box;
            const bx = x * scaleX;
            const by = y * scaleY;
            const bw = width * scaleX;
            const bh = height * scaleY;

            ctx.strokeStyle = isLatchedWarning ? '#f97316' : '#22cc22';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);

            if (isLatchedWarning) {
              ctx.fillStyle = '#f97316';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText('Face 1 (Warning Active)', bx, Math.max(12, by - 4));
            }
          } else {
            // ❌ No face detected
            cleanSingleFaceSecondsRef.current = 0;
            multiFaceSecondsRef.current = 0;
            noFaceSecondsRef.current += 1;

            if (noFaceSecondsRef.current >= 5 && !inNoFaceViolationRef.current) {
              inNoFaceViolationRef.current = true;
              setIsFaceDetected(false);

              const next = violationsRef.current + 1;
              violationsRef.current = next;
              setViolations(next);
              console.log(`[FaceTracker] Violation #${next} — no face`);

              if (next >= maxViolations) {
                isSubmittedRef.current = true;
                clearInterval(intervalId);
                onSubmitRef.current();
              }
            }
          }
        } catch (err) {
          console.error('[FaceTracker] Detection error', err);
        }
      }, 1000);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isModelLoaded, videoRef, canvasRef]); // removed onSubmit from deps to prevent interval reset

  return {
    isModelLoaded,
    violations,
    maxViolations,
    isFaceDetected,
    isMultipleFaces,
    hasCameraError,
  };
}
