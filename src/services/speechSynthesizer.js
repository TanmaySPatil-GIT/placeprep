/**
 * Web Speech Synthesis (TTS) Helper Service
 * Manages natural voice selection, queueing, and event listeners for AI Interviewer.
 */

export function isTTSSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getAvailableVoices(langCode = 'en-US') {
  if (!isTTSSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode ? langCode.slice(0, 2) : 'en';
  const langVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix.toLowerCase()));

  if (langVoices.length > 0) return langVoices;
  return voices;
}

export const getAvailableEnglishVoices = getAvailableVoices;

export function speakText({ text, voice, langCode = 'en-US', rate = 1.0, pitch = 1.0, onStart, onEnd, onError }) {
  if (!isTTSSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech before starting a new utterance
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = langCode || 'en-US';

  if (voice) {
    utterance.voice = voice;
  } else {
    const available = getAvailableVoices(langCode);
    if (available.length > 0) {
      utterance.voice = available[0];
    }
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    if (onError) onError(e);
    if (onEnd) onEnd();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to execute speechSynthesis.speak:', err);
    if (onEnd) onEnd();
  }
}

export function stopSpeech() {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}
