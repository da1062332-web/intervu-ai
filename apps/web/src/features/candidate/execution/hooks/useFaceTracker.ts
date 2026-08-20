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

  // Accurate millisecond timestamp markers for ultra-responsive trigger & violation tracking
  const multiFaceStartTimeRef = useRef(0);
  const cleanSingleFaceStartTimeRef = useRef(0);
  const noFaceStartTimeRef = useRef(0);

  const inNoFaceViolationRef = useRef(false);
  const inMultiFaceViolationRef = useRef(false);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // ─── Phase 1: Start camera immediately (no need to wait for model) ────────
  useEffect(() => {
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
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('intervu-cleanup-runtime', handleCleanup);
      }
      stopStream();
    };
  }, []);

  // ─── Phase 2: Load models (prioritize fast TinyFaceDetector for real-time video) ───
  useEffect(() => {
    let cancelled = false;
    import('@vladmandic/face-api').then(async (faceapi) => {
      if (cancelled) return;
      try {
        // Load lightweight TinyFaceDetector (super-fast, <20ms inference) & SSD MobileNet
        await Promise.allSettled([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        ]);
        if (!cancelled) {
          console.log('[FaceTracker] Models loaded (TinyFaceDetector & SSD MobileNet V1)');
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

  // ─── Phase 3: Ultra-responsive detection loop (~250ms cadence) ────────────
  useEffect(() => {
    if (!isModelLoaded) return;

    let isRunning = true;
    let isProcessing = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    import('@vladmandic/face-api').then((faceapi) => {
      if (!isRunning) return;

      const gracePeriodEndTime = Date.now() + 8000; // 8s initial camera warmup

      // Prioritize TinyFaceDetector for sub-30ms real-time multi-face detection
      const isTinyReady = faceapi.nets.tinyFaceDetector.isLoaded;
      const options = isTinyReady
        ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.22 })
        : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 });

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

            // Sync canvas resolution
            if (canvas.width !== vw) canvas.width = vw;
            if (canvas.height !== vh) canvas.height = vh;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, vw, vh);

              const detections = await faceapi.detectAllFaces(video, options);
              const now = Date.now();

              // Scale coordinates from model input space to video native size
              const imgW = detections[0]?.imageDims?.width || vw;
              const imgH = detections[0]?.imageDims?.height || vh;
              const scaleX = vw / imgW;
              const scaleY = vh / imgH;

              if (detections.length > 1) {
                // ⚠️ Multiple faces detected!
                noFaceStartTimeRef.current = 0;
                cleanSingleFaceStartTimeRef.current = 0;

                if (multiFaceStartTimeRef.current === 0) {
                  multiFaceStartTimeRef.current = now;
                }

                // Trigger visual warning state IMMEDIATELY (sub-300ms)
                setIsMultipleFaces(true);

                // Draw orange bounding boxes and labels on all detected faces
                detections.forEach((det, idx) => {
                  const { x, y, width, height } = det.box;
                  const bx = x * scaleX;
                  const by = y * scaleY;
                  const bw = width * scaleX;
                  const bh = height * scaleY;

                  ctx.strokeStyle = '#f97316';
                  ctx.lineWidth = 2.5;
                  ctx.strokeRect(bx, by, bw, bh);

                  ctx.fillStyle = '#f97316';
                  ctx.font = 'bold 12px sans-serif';
                  ctx.fillText(`Face ${idx + 1}`, bx, Math.max(14, by - 4));
                });

                // Count formal violation after 1.5 seconds of sustained multi-face presence
                const multiFaceDuration = now - multiFaceStartTimeRef.current;
                if (multiFaceDuration >= 1500 && !inMultiFaceViolationRef.current) {
                  inMultiFaceViolationRef.current = true;

                  const next = violationsRef.current + 1;
                  violationsRef.current = next;
                  setViolations(next);
                  console.log(
                    `[FaceTracker] Violation #${next} — multiple faces (${detections.length} faces)`,
                  );

                  if (next >= maxViolations) {
                    isSubmittedRef.current = true;
                    isRunning = false;
                    onSubmitRef.current();
                    return;
                  }
                }
              } else if (detections.length === 1) {
                // ✅ Exactly 1 face detected
                noFaceStartTimeRef.current = 0;

                if (cleanSingleFaceStartTimeRef.current === 0) {
                  cleanSingleFaceStartTimeRef.current = now;
                }

                // Clear multi-face warning after 1.0 second of clean single-face
                const cleanDuration = now - cleanSingleFaceStartTimeRef.current;
                if (cleanDuration >= 1000) {
                  multiFaceStartTimeRef.current = 0;
                  if (inMultiFaceViolationRef.current || isMultipleFaces) {
                    inMultiFaceViolationRef.current = false;
                    setIsMultipleFaces(false);
                  }
                }

                if (inNoFaceViolationRef.current || !isFaceDetected) {
                  inNoFaceViolationRef.current = false;
                  setIsFaceDetected(true);
                }

                // Draw bounding box
                const isLatchedWarning =
                  cleanDuration < 1000 && multiFaceStartTimeRef.current > 0;
                const { x, y, width, height } = detections[0].box;
                const bx = x * scaleX;
                const by = y * scaleY;
                const bw = width * scaleX;
                const bh = height * scaleY;

                ctx.strokeStyle = isLatchedWarning ? '#f97316' : '#22c55e';
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, bw, bh);

                if (isLatchedWarning) {
                  ctx.fillStyle = '#f97316';
                  ctx.font = 'bold 11px sans-serif';
                  ctx.fillText('Face 1 (Warning Active)', bx, Math.max(12, by - 4));
                }
              } else {
                // ❌ No face detected
                cleanSingleFaceStartTimeRef.current = 0;
                multiFaceStartTimeRef.current = 0;

                if (now >= gracePeriodEndTime) {
                  if (noFaceStartTimeRef.current === 0) {
                    noFaceStartTimeRef.current = now;
                  }

                  const noFaceDuration = now - noFaceStartTimeRef.current;
                  if (noFaceDuration >= 3000 && !inNoFaceViolationRef.current) {
                    inNoFaceViolationRef.current = true;
                    setIsFaceDetected(false);

                    const next = violationsRef.current + 1;
                    violationsRef.current = next;
                    setViolations(next);
                    console.log(`[FaceTracker] Violation #${next} — no face`);

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
            console.error('[FaceTracker] Detection error', err);
          } finally {
            isProcessing = false;
          }
        }

        if (isRunning && !isSubmittedRef.current) {
          // Schedule next detection in 250ms (responsive 4 FPS cadence)
          timeoutId = setTimeout(detectFrame, 250);
        }
      };

      // Start initial detection frame
      timeoutId = setTimeout(detectFrame, 100);
    });

    return () => {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isModelLoaded, videoRef, canvasRef]);

  return {
    isModelLoaded,
    violations,
    maxViolations,
    isFaceDetected,
    isMultipleFaces,
    hasCameraError,
  };
}

