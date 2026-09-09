'use client';

import { useEffect, useState, useRef } from 'react';

interface UseFaceTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onSubmit: () => void;
  disabled?: boolean;
}

export function useFaceTracker({
  videoRef,
  canvasRef,
  onSubmit,
  disabled = false,
}: UseFaceTrackerProps) {
  const [isModelLoaded, setIsModelLoaded] = useState(disabled);
  const [violations, setViolations] = useState(0);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isMultipleFaces, setIsMultipleFaces] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const maxViolations = 25;

  const violationsRef = useRef(0);
  const isSubmittedRef = useRef(false);
  const lastViolationTimeRef = useRef(0);

  // Exact millisecond timestamp markers for 3s (no-face) and 2s (multi-face) triggers
  const noFaceStartTimeRef = useRef(0);
  const multiFaceStartTimeRef = useRef(0);
  const cleanSingleFaceStartTimeRef = useRef(0);

  const inNoFaceViolationRef = useRef(false);
  const inMultiFaceViolationRef = useRef(false);

  // Rolling detection buffer
  const historyBufferRef = useRef<number[]>([]);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // ─── Phase 1: Start camera immediately ────────────────────────────────────
  useEffect(() => {
    if (disabled) return;
    let stream: MediaStream | null = null;
    let mounted = true;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      console.warn('[FaceTracker] Media devices or getUserMedia not supported in this environment');
      setHasCameraError(true);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      })
      .then((s) => {
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
      .catch((err: unknown) => {
        if (!mounted) return;
        const errorName = (err as Error)?.name || '';
        const errorMessage = (err as Error)?.message || String(err);
        if (
          errorName === 'NotFoundError' ||
          errorName === 'DevicesNotFoundError' ||
          errorName === 'NotAllowedError' ||
          errorName === 'PermissionDeniedError' ||
          errorName === 'OverconstrainedError'
        ) {
          console.warn(`[FaceTracker] Camera unavailable (${errorName}): ${errorMessage}`);
        } else {
          console.warn('[FaceTracker] Camera error:', errorMessage);
        }
        setHasCameraError(true);
      });

    const handleCleanup = () => {
      console.log('[FaceTracker] Cleaning up runtime media tracks');
      stopStream();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('SkillitriX-cleanup-runtime', handleCleanup);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('SkillitriX-cleanup-runtime', handleCleanup);
      }
      stopStream();
    };
  }, [videoRef]);

  // ─── Phase 2: Load models (SSD MobileNet V1 & TinyFaceDetector) ───────────
  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    import('@vladmandic/face-api').then(async (faceapi) => {
      if (cancelled) return;
      try {
        await Promise.allSettled([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        ]);
        if (!cancelled) {
          console.log('[FaceTracker] Face detection models loaded');
          setIsModelLoaded(true);
        }
      } catch (err: unknown) {
        console.warn('[FaceTracker] Model load error:', err);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [disabled]);

  // ─── Phase 3: Ultra-responsive detection loop (~200ms cadence) ────────────
  useEffect(() => {
    if (!isModelLoaded || disabled) return;

    let isRunning = true;
    let isProcessing = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    import('@vladmandic/face-api').then((faceapi) => {
      if (!isRunning) return;

      const gracePeriodEndTime = Date.now() + 3000; // 3s initial camera warmup
      const VIOLATION_COOLDOWN_MS = 6000; // 6s cooldown between repeated violation increments

      // Prefer SSD MobileNet for maximum multi-face accuracy across angles/distances,
      // fallback to high-resolution TinyFaceDetector (416 input size).
      const isSsdReady = faceapi.nets.ssdMobilenetv1.isLoaded;
      const isTinyReady = faceapi.nets.tinyFaceDetector.isLoaded;
      const options = isSsdReady
        ? new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 })
        : isTinyReady
          ? new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
          : null;

      if (!options) {
        console.warn('[FaceTracker] No face detector model is ready');
        return;
      }

      const detectFrame = async () => {
        if (!isRunning || isSubmittedRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          !isProcessing &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused
        ) {
          isProcessing = true;
          try {
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            // Sync canvas dimensions to video
            if (canvas.width !== vw) canvas.width = vw;
            if (canvas.height !== vh) canvas.height = vh;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, vw, vh);

              const rawDetections = await faceapi.detectAllFaces(video, options);
              const detections = faceapi.resizeResults(rawDetections, { width: vw, height: vh });
              const now = Date.now();
              const count = detections.length;

              // Append to rolling history (keep last 6 frames = ~1.2s)
              historyBufferRef.current.push(count);
              if (historyBufferRef.current.length > 6) {
                historyBufferRef.current.shift();
              }

              // ─────────────────────────────────────────────────────────────
              // SCENARIO 1: Multiple Faces Detected (> 1 face)
              // ─────────────────────────────────────────────────────────────
              if (count > 1) {
                // Reset no-face timer
                noFaceStartTimeRef.current = 0;
                inNoFaceViolationRef.current = false;
                cleanSingleFaceStartTimeRef.current = 0;
                setIsFaceDetected(true);

                // Start multiple faces counter if not already started
                if (multiFaceStartTimeRef.current === 0) {
                  multiFaceStartTimeRef.current = now;
                }

                const multiFaceDuration = now - multiFaceStartTimeRef.current;

                // Draw orange bounding boxes on all detected faces immediately
                detections.forEach((det, idx) => {
                  const { x, y, width, height } = det.box;
                  ctx.strokeStyle = '#f97316';
                  ctx.lineWidth = 2.5;
                  ctx.strokeRect(x, y, width, height);

                  // Label badge
                  ctx.fillStyle = '#ea580c';
                  const label = `Face ${idx + 1}`;
                  ctx.font = 'bold 11px sans-serif';
                  const textWidth = ctx.measureText(label).width;
                  const labelY = Math.max(16, y - 4);
                  ctx.fillRect(x, labelY - 12, textWidth + 6, 14);

                  ctx.fillStyle = '#ffffff';
                  ctx.fillText(label, x + 3, labelY - 2);
                });

                // Trigger warning and violation after 2 continuous seconds of multiple faces
                if (multiFaceDuration >= 2000) {
                  setIsMultipleFaces(true);

                  const canCountViolation =
                    now - lastViolationTimeRef.current >= VIOLATION_COOLDOWN_MS;

                  if (now >= gracePeriodEndTime && !inMultiFaceViolationRef.current && canCountViolation) {
                    inMultiFaceViolationRef.current = true;
                    lastViolationTimeRef.current = now;

                    const next = violationsRef.current + 1;
                    violationsRef.current = next;
                    setViolations(next);
                    console.log(
                      `[FaceTracker] Violation #${next} — multiple faces (${count} detected for >= 2s)`,
                    );

                    if (next >= maxViolations) {
                      isSubmittedRef.current = true;
                      isRunning = false;
                      onSubmitRef.current();
                      return;
                    }
                  }
                }
              }
              // ─────────────────────────────────────────────────────────────
              // SCENARIO 2: Exactly 1 Face Detected (Normal Candidate)
              // ─────────────────────────────────────────────────────────────
              else if (count === 1) {
                // Reset no-face timer immediately
                noFaceStartTimeRef.current = 0;
                inNoFaceViolationRef.current = false;
                setIsFaceDetected(true);

                if (cleanSingleFaceStartTimeRef.current === 0) {
                  cleanSingleFaceStartTimeRef.current = now;
                }

                // Clear multiple faces warning after 1.2s of clean single-face
                const cleanDuration = now - cleanSingleFaceStartTimeRef.current;
                const recentAllSingleOrClean = historyBufferRef.current.every((c) => c <= 1);

                if (cleanDuration >= 1200 && recentAllSingleOrClean) {
                  multiFaceStartTimeRef.current = 0;
                  inMultiFaceViolationRef.current = false;
                  setIsMultipleFaces(false);
                }

                // Draw green bounding box on single face
                const isLatchedWarning = cleanDuration < 1200 && multiFaceStartTimeRef.current > 0;
                const { x, y, width, height } = detections[0].box;

                ctx.strokeStyle = isLatchedWarning ? '#f97316' : '#22c55e';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);

                if (isLatchedWarning) {
                  ctx.fillStyle = '#f97316';
                  ctx.font = 'bold 11px sans-serif';
                  ctx.fillText('Face 1 (Clearing Warning...)', x, Math.max(14, y - 4));
                }
              }
              // ─────────────────────────────────────────────────────────────
              // SCENARIO 3: Face Goes Out of Frame (0 Faces Detected)
              // ─────────────────────────────────────────────────────────────
              else {
                cleanSingleFaceStartTimeRef.current = 0;
                multiFaceStartTimeRef.current = 0;
                inMultiFaceViolationRef.current = false;
                setIsMultipleFaces(false);

                // Start no-face counter if not already started
                if (noFaceStartTimeRef.current === 0) {
                  noFaceStartTimeRef.current = now;
                }

                const noFaceDuration = now - noFaceStartTimeRef.current;

                // Trigger warning and violation after 3 continuous seconds out of frame
                if (noFaceDuration >= 3000) {
                  setIsFaceDetected(false);

                  const canCountViolation =
                    now - lastViolationTimeRef.current >= VIOLATION_COOLDOWN_MS;

                  if (now >= gracePeriodEndTime && !inNoFaceViolationRef.current && canCountViolation) {
                    inNoFaceViolationRef.current = true;
                    lastViolationTimeRef.current = now;

                    const next = violationsRef.current + 1;
                    violationsRef.current = next;
                    setViolations(next);
                    console.log(`[FaceTracker] Violation #${next} — face not in frame for >= 3s`);

                    if (next >= maxViolations) {
                      isSubmittedRef.current = true;
                      isRunning = false;
                      onSubmitRef.current();
                      return;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.warn('[FaceTracker] Detection warning:', err);
          } finally {
            isProcessing = false;
          }
        }

        if (isRunning && !isSubmittedRef.current) {
          timeoutId = setTimeout(detectFrame, 200);
        }
      };

      // Start initial detection frame
      timeoutId = setTimeout(detectFrame, 150);
    });

    return () => {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isModelLoaded, videoRef, canvasRef, disabled]);

  return {
    isModelLoaded,
    violations,
    maxViolations,
    isFaceDetected,
    isMultipleFaces,
    hasCameraError,
  };
}
