import { useEffect, useRef, useState, useCallback } from 'react';
import { cancel as cancelSpeech } from './speak';

/**
 * Pure function to build a clean transcript by combining baseText, finalText, and interimText.
 * Drops empty/whitespace-only parts and joins with single spaces.
 */
export function buildTranscript(baseText = '', finalText = '', interimText = '') {
  const parts = [baseText, finalText, interimText]
    .map((s) => (s || '').trim())
    .filter(Boolean);
  return parts.join(' ');
}

/**
 * useSpeechToText
 * Speech-to-text hook wrapping the Web Speech API (SpeechRecognition).
 * Language configured to 'en-IN', continuous mode with auto-restart on silence.
 * Distinguishes baseText, finalText, and interim draft results to prevent word duplication.
 */
export function useSpeechToText({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  // Text buffers
  const baseTextRef = useRef('');
  const finalTextRef = useRef('');
  const interimTextRef = useRef('');

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  onTranscriptChangeRef.current = onTranscriptChange;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const reset = useCallback(() => {
    baseTextRef.current = '';
    finalTextRef.current = '';
    interimTextRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  const stop = useCallback(({ updateText = true } = {}) => {
    shouldListenRef.current = false;
    setIsListening(false);
    interimTextRef.current = '';

    if (updateText) {
      const finalCombined = buildTranscript(baseTextRef.current, finalTextRef.current, '');
      setTranscript(finalCombined);
      if (onTranscriptChangeRef.current) {
        onTranscriptChangeRef.current(finalCombined);
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const start = useCallback((initialBaseText = '') => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Rule: cancel active read-aloud speech when user starts speaking
    cancelSpeech();

    setError(null);
    shouldListenRef.current = true;

    // Clarification 1: Reset finalText for a brand-new user session;
    // previous words already exist in baseText.
    baseTextRef.current = (initialBaseText || '').trim();
    finalTextRef.current = '';
    interimTextRef.current = '';

    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err) {
      if (err.name !== 'InvalidStateError') {
        setError(err.message || 'Failed to start speech recognition.');
        setIsListening(false);
      } else {
        setIsListening(true);
      }
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let newlyFinal = '';
      let newInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          const chunk = item[0].transcript.trim();
          if (chunk) {
            newlyFinal = newlyFinal ? `${newlyFinal} ${chunk}` : chunk;
          }
        } else {
          newInterim += item[0].transcript;
        }
      }

      if (newlyFinal) {
        finalTextRef.current = finalTextRef.current
          ? `${finalTextRef.current} ${newlyFinal}`
          : newlyFinal;
      }

      // Interim text is replaced fresh on every event, never appended
      interimTextRef.current = newInterim.trim();

      const combined = buildTranscript(
        baseTextRef.current,
        finalTextRef.current,
        interimTextRef.current
      );

      setTranscript(combined);
      if (onTranscriptChangeRef.current) {
        onTranscriptChangeRef.current(combined);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user has not explicitly stopped listening
      if (shouldListenRef.current) {
        // Clarification 1: keep baseText & finalText across auto-restarts, reset interim only
        interimTextRef.current = '';
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [isSupported]);

  return {
    isSupported,
    isListening,
    transcript,
    start,
    stop,
    reset,
    error,
  };
}
