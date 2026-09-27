import { useEffect, useRef, useState } from 'react';

/**
 * useMicLevel
 * Measures real-time microphone volume from an existing MediaStream.
 * Returns volume (0-100) and whether the microphone is actively picking up sound.
 */
export function useMicLevel(stream) {
  const [volume, setVolume] = useState(0);
  const [hasDetectedAudio, setHasDetectedAudio] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!stream) {
      setVolume(0);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || audioTrack.readyState !== 'live') {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    let ctx = null;
    try {
      ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Scale 0-255 to 0-100
        const scaled = Math.min(100, Math.round((average / 128) * 100));
        setVolume(scaled);

        if (scaled > 3) {
          setHasDetectedAudio(true);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // AudioContext init error (e.g. autoplay policy)
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {
          // ignore
        }
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
        audioContextRef.current = null;
      }
    };
  }, [stream]);

  const hasAudioTrack = Boolean(stream && stream.getAudioTracks().some((t) => t.readyState === 'live'));
  const isMicWorking = hasAudioTrack && (hasDetectedAudio || volume > 0);

  return { volume, isMicWorking, hasAudioTrack };
}
