/**
 * Web Speech Synthesis (TTS) Helper Service
 * Prioritizes high-fidelity Natural / Neural / Human-sounding voices,
 * conversational pacing, and micro-pauses for friendly interview delivery.
 */

export function isTTSSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Ranks voices based on natural human quality, neural synthesis, and pleasant interview tone.
 */
export function getBestNaturalVoice(langPreference = 'en-US') {
  if (!isTTSSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Preferred high-quality natural voices in order of human-like warmth
  const preferredNames = [
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Microsoft Neerja Online (Natural) - English (India)',
    'Microsoft Prabhat Online (Natural) - English (India)',
    'Google US English',
    'Google UK English Female',
    'Google UK English Male',
    'Samantha',
    'Karen',
    'Daniel',
    'Moira',
    'Microsoft Zira Desktop - English (United States)',
    'Microsoft Zira'
  ];

  // 1. Check exact preferred voice list
  for (const name of preferredNames) {
    const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }

  // 2. Check for any voice tagged with "natural", "neural", or "online"
  const naturalVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith('en') && 
    (v.name.toLowerCase().includes('natural') || 
     v.name.toLowerCase().includes('neural') || 
     v.name.toLowerCase().includes('online') ||
     v.name.toLowerCase().includes('enhanced'))
  );
  if (naturalVoice) return naturalVoice;

  // 3. Check for any English voice from preferred lang prefix (e.g. en-IN or en-US)
  const prefPrefix = langPreference.slice(0, 5).toLowerCase();
  const langMatch = voices.find(v => v.lang.toLowerCase() === prefPrefix && !v.name.toLowerCase().includes('david desktop'));
  if (langMatch) return langMatch;

  // 4. Any English voice that is NOT the robotic legacy David
  const anyNonRobotic = voices.find(v => v.lang.toLowerCase().startsWith('en') && !v.name.toLowerCase().includes('david'));
  if (anyNonRobotic) return anyNonRobotic;

  // Fallback to first available English voice
  return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
}

export function getAvailableVoices(langCode = 'en-US') {
  if (!isTTSSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode ? langCode.slice(0, 2) : 'en';
  const langVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
  return langVoices.length > 0 ? langVoices : voices;
}

export const getAvailableEnglishVoices = getAvailableVoices;

/**
 * Natural voice speaking function with human conversational cadence.
 */
export function speakText({ 
  text, 
  voice, 
  langCode = 'en-US', 
  rate = 0.96, // Friendly, natural conversational pacing (never rushed or robotic)
  pitch = 1.02, // Warm, pleasant conversational pitch
  onStart, 
  onEnd, 
  onError 
}) {
  if (!isTTSSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech before starting a new utterance
  window.speechSynthesis.cancel();

  // Clean formatting tokens like markdown quotes or bullet prefixes so speech sounds like a person talking
  const spokenText = text
    .replace(/\*\*/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = langCode || 'en-US';

  // Select human-friendly voice
  if (voice) {
    utterance.voice = voice;
  } else {
    const naturalVoice = getBestNaturalVoice(langCode);
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = (e) => {
    console.warn('SpeechSynthesis notice:', e);
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
