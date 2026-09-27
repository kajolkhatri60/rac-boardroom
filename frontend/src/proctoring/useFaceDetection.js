import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

/**
 * useFaceDetection
 * Local MediaPipe face detector (~2x per second) running on candidate video stream.
 * In lobby: reports faceCount (for "One face visible" check).
 * After admit (isActive=true): tracks 4 proctoring event types:
 *   - face_missing (>3s)
 *   - multiple_faces (>2s)
 *   - tab_hidden
 *   - window_blur
 * Automatically dispatches proctor_event { type, started_at, duration_s } over WebSocket on event end.
 */
export function useFaceDetection({ videoRef, stream, isActive = false, onSendEvent }) {
  const [faceCount, setFaceCount] = useState(null);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [detectorError, setDetectorError] = useState(null);

  const detectorRef = useRef(null);
  const timerRef = useRef(null);

  // Proctoring event tracking refs
  const faceMissingStartRef = useRef(null);
  const multiFaceStartRef = useRef(null);
  const tabHiddenStartRef = useRef(null);
  const blurStartRef = useRef(null);
  const onSendEventRef = useRef(onSendEvent);
  onSendEventRef.current = onSendEvent;

  const emitEvent = useCallback((type, startTimestamp, durationSec) => {
    if (!onSendEventRef.current || durationSec <= 0) return;
    try {
      onSendEventRef.current({
        type,
        started_at: new Date(startTimestamp).toISOString(),
        duration_s: Math.round(durationSec * 10) / 10,
      });
    } catch {
      // ignore
    }
  }, []);

  // Initialize MediaPipe FaceDetector once with local wasm and models
  useEffect(() => {
    let cancelled = false;

    async function initDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
        if (cancelled) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/models/blaze_face_short_range.tflite',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        });

        if (cancelled) return;
        detectorRef.current = detector;
        setIsDetectorReady(true);
      } catch (err) {
        if (!cancelled) {
          setDetectorError(err.message || 'Failed to initialize face detector.');
        }
      }
    }

    initDetector();

    return () => {
      cancelled = true;
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch {
          // ignore
        }
        detectorRef.current = null;
      }
    };
  }, []);

  // Periodic face detection loop (~2x per second = 500ms)
  useEffect(() => {
    if (!isDetectorReady || !stream) {
      setFaceCount(null);
      return;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !detectorRef.current) return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      try {
        const nowMs = performance.now();
        const results = detectorRef.current.detectForVideo(video, nowMs);
        const count = results.detections ? results.detections.length : 0;
        setFaceCount(count);

        // Only track face proctoring events if admitted (isActive = true)
        if (isActive) {
          const now = Date.now();

          // 1. face_missing (>3s)
          if (count === 0) {
            if (faceMissingStartRef.current === null) {
              faceMissingStartRef.current = now;
            }
          } else {
            if (faceMissingStartRef.current !== null) {
              const duration = (now - faceMissingStartRef.current) / 1000;
              if (duration > 3.0) {
                emitEvent('face_missing', faceMissingStartRef.current, duration);
              }
              faceMissingStartRef.current = null;
            }
          }

          // 2. multiple_faces (>2s)
          if (count > 1) {
            if (multiFaceStartRef.current === null) {
              multiFaceStartRef.current = now;
            }
          } else {
            if (multiFaceStartRef.current !== null) {
              const duration = (now - multiFaceStartRef.current) / 1000;
              if (duration > 2.0) {
                emitEvent('multiple_faces', multiFaceStartRef.current, duration);
              }
              multiFaceStartRef.current = null;
            }
          }
        }
      } catch {
        // detection tick error
      }
    }, 500);

    timerRef.current = interval;

    return () => {
      clearInterval(interval);
      timerRef.current = null;
    };
  }, [isDetectorReady, stream, videoRef, isActive, emitEvent]);

  // Tab hidden and window blur listeners (after admit only)
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden) {
        if (tabHiddenStartRef.current === null) {
          tabHiddenStartRef.current = now;
        }
      } else {
        if (tabHiddenStartRef.current !== null) {
          const duration = (now - tabHiddenStartRef.current) / 1000;
          if (duration > 0) {
            emitEvent('tab_hidden', tabHiddenStartRef.current, duration);
          }
          tabHiddenStartRef.current = null;
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (!document.hidden && blurStartRef.current === null) {
        blurStartRef.current = now;
      }
    };

    const handleWindowFocus = () => {
      const now = Date.now();
      if (blurStartRef.current !== null) {
        const duration = (now - blurStartRef.current) / 1000;
        if (duration > 0) {
          emitEvent('window_blur', blurStartRef.current, duration);
        }
        blurStartRef.current = null;
      }
    };

    const flushOngoingEvents = () => {
      const now = Date.now();
      if (faceMissingStartRef.current !== null) {
        const duration = (now - faceMissingStartRef.current) / 1000;
        if (duration > 3.0) {
          emitEvent('face_missing', faceMissingStartRef.current, duration);
        }
        faceMissingStartRef.current = null;
      }
      if (multiFaceStartRef.current !== null) {
        const duration = (now - multiFaceStartRef.current) / 1000;
        if (duration > 2.0) {
          emitEvent('multiple_faces', multiFaceStartRef.current, duration);
        }
        multiFaceStartRef.current = null;
      }
      if (tabHiddenStartRef.current !== null) {
        const duration = (now - tabHiddenStartRef.current) / 1000;
        if (duration > 0) {
          emitEvent('tab_hidden', tabHiddenStartRef.current, duration);
        }
        tabHiddenStartRef.current = null;
      }
      if (blurStartRef.current !== null) {
        const duration = (now - blurStartRef.current) / 1000;
        if (duration > 0) {
          emitEvent('window_blur', blurStartRef.current, duration);
        }
        blurStartRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('beforeunload', flushOngoingEvents);
    window.addEventListener('pagehide', flushOngoingEvents);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('beforeunload', flushOngoingEvents);
      window.removeEventListener('pagehide', flushOngoingEvents);
      flushOngoingEvents();
    };
  }, [isActive, emitEvent]);

  return {
    faceCount,
    isDetectorReady,
    detectorError,
  };
}
