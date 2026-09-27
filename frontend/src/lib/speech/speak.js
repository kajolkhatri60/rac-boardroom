/**
 * Speech synthesis utility.
 * Reads text aloud using window.speechSynthesis, preferring Indian English (en-IN).
 */

let activeUtterance = null;

export function speak(text, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech
  cancel();

  if (!text || !text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text.trim());

  // Try to find an Indian English voice, or fallback to any English voice
  const voices = window.speechSynthesis.getVoices() || [];
  const inVoice = voices.find(
    (v) => v.lang === 'en-IN' || v.lang.toLowerCase().replace('-', '_') === 'en_in'
  );
  const enVoice = voices.find((v) => v.lang.startsWith('en'));

  if (inVoice) {
    utterance.voice = inVoice;
    utterance.lang = inVoice.lang;
  } else if (enVoice) {
    utterance.voice = enVoice;
    utterance.lang = enVoice.lang;
  } else {
    utterance.lang = 'en-IN';
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function cancel() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }
  return window.speechSynthesis.speaking;
}
