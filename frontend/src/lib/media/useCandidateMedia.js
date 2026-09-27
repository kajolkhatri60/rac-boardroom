import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useCandidateMedia
 * Acquires a shared user media stream (video 640x480 + audio) ONCE.
 * Tracks are shared across lobby preview, self-view, proctoring, and future WebRTC.
 * Automatically stops all tracks on unmount.
 */
export function useCandidateMedia() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef(null);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startMedia = useCallback(async () => {
    if (streamRef.current && streamRef.current.active) {
      return streamRef.current;
    }

    setIsLoading(true);
    setError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      const err = 'Your browser does not support camera and microphone access.';
      setError(err);
      setIsLoading(false);
      return null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsLoading(false);
      return mediaStream;
    } catch (err) {
      setIsLoading(false);
      let message = 'Unable to access camera or microphone.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera or microphone permission was denied. Please allow access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera or microphone found on your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera or microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Camera does not support requested video resolution.';
      }

      setError(message);
      return null;
    }
  }, []);

  useEffect(() => {
    startMedia();

    return () => {
      stopMedia();
    };
  }, [startMedia, stopMedia]);

  const hasVideo = Boolean(stream && stream.getVideoTracks().some((t) => t.readyState === 'live'));
  const hasAudio = Boolean(stream && stream.getAudioTracks().some((t) => t.readyState === 'live'));

  return {
    stream,
    error,
    isLoading,
    hasVideo,
    hasAudio,
    startMedia,
    stopMedia,
  };
}
