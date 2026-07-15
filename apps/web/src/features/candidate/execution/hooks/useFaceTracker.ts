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
  const maxViolations = 3;

  const violationsRef = useRef(0);
  const isSubmittedRef = useRef(false);
  const noFaceSecondsRef = useRef(0);
  const multiFaceSecondsRef = useRef(0);
  const inNoFaceViolationRef = useRef(false);
  const inMultiFaceViolationRef = useRef(false);

  // ─── Phase 1: Start camera immediately (no need to wait for model) ────────
  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          // force play
          video.play().catch(() => {});
        }
        setHasCameraError(false);
        console.log('[FaceTracker] Camera started');
      })
      .catch((err) => {
        console.error('[FaceTracker] Camera error', err);
        setHasCameraError(true);
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []); // run once on mount — independent of model state

  // ─── Phase 2: Load the model (dynamic import to avoid SSR issues) ─────────
  useEffect(() => {
    let cancelled = false;
    import('@vladmandic/face-api').then((faceapi) => {
      if (cancelled) return;
      faceapi.nets.tinyFaceDetector
        .loadFromUri('/models')
        .then(() => {
          if (!cancelled) {
            console.log('[FaceTracker] Model loaded');
            setIsModelLoaded(true);
          }
        })
        .catch((err: unknown) => console.error('[FaceTracker] Model load error', err));
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

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416, // Increased for much better multi-face and distance detection
        scoreThreshold: 0.4, // Adjusted for higher resolution to avoid false positives
      });

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
          console.log('[FaceTracker] Video not ready, skipping');
          return;
        }

        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          // Sync canvas pixel size to video native size
          if (canvas.width !== vw) canvas.width = vw;
          if (canvas.height !== vh) canvas.height = vh;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, vw, vh);

          const detections = await faceapiModule.detectAllFaces(video, options);
          console.log(`[FaceTracker] Detected: ${detections.length} face(s)`);

          // Scale from model input-space → video native-space
          const imgW = detections[0]?.imageDims?.width || vw;
          const imgH = detections[0]?.imageDims?.height || vh;
          const scaleX = vw / imgW;
          const scaleY = vh / imgH;

          if (detections.length === 1) {
            // ✅ Exactly one face — good
            noFaceSecondsRef.current = 0;
            multiFaceSecondsRef.current = 0;

            if (inNoFaceViolationRef.current) {
              inNoFaceViolationRef.current = false;
              setIsFaceDetected(true);
            }
            if (inMultiFaceViolationRef.current) {
              inMultiFaceViolationRef.current = false;
              setIsMultipleFaces(false);
            }

            // Green box when face detected
            const { x, y, width, height } = detections[0].box;
            ctx.strokeStyle = '#22cc22';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
          } else if (detections.length === 0) {
            // ❌ No face
            multiFaceSecondsRef.current = 0;
            noFaceSecondsRef.current += 1;
            console.log(`[FaceTracker] No face: ${noFaceSecondsRef.current}s`);

            if (noFaceSecondsRef.current >= 3 && !inNoFaceViolationRef.current) {
              inNoFaceViolationRef.current = true;
              setIsFaceDetected(false);

              const next = violationsRef.current + 1;
              violationsRef.current = next;
              setViolations(next);
              console.log(`[FaceTracker] Violation #${next} — no face`);

              if (next >= maxViolations) {
                isSubmittedRef.current = true;
                clearInterval(intervalId);
                onSubmit();
              }
            }
          } else {
            // ⚠️ Multiple faces
            noFaceSecondsRef.current = 0;
            multiFaceSecondsRef.current += 1;
            console.log(
              `[FaceTracker] Multiple faces: ${detections.length}, tick ${multiFaceSecondsRef.current}s`,
            );

            // Draw orange boxes on all faces
            detections.forEach((det) => {
              const { x, y, width, height } = det.box;
              ctx.strokeStyle = '#ff8800';
              ctx.lineWidth = 2;
              ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
            });

            if (multiFaceSecondsRef.current >= 3 && !inMultiFaceViolationRef.current) {
              inMultiFaceViolationRef.current = true;
              setIsMultipleFaces(true);

              const next = violationsRef.current + 1;
              violationsRef.current = next;
              setViolations(next);
              console.log(`[FaceTracker] Violation #${next} — multiple faces`);

              if (next >= maxViolations) {
                isSubmittedRef.current = true;
                clearInterval(intervalId);
                onSubmit();
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
  }, [isModelLoaded, videoRef, canvasRef, onSubmit]);

  return {
    isModelLoaded,
    violations,
    maxViolations,
    isFaceDetected,
    isMultipleFaces,
    hasCameraError,
  };
}
