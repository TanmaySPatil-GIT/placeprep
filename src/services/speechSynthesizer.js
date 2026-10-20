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
 * Conversational Text Pre-processor
 * Strips raw markdown, expands tech abbreviations (e.g. O(N), SQL, API),
 * and structures punctuation spacing for warm, human-like speech delivery.
 */
export function cleanForConversationalSpeech(text = '') {
  if (!text) return '';

  return text
    // Strip markdown code fences, backticks, bold/italics
    .replace(/```[\s\S]*?```/g, ' [code omitted for brevity] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    // Remove markdown list numbers/bullets at start of lines
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Common developer terms phonetic translation
    .replace(/\bO\(1\)\b/gi, 'O of 1')
    .replace(/\bO\(n\^2\)\b/gi, 'O of N squared')
    .replace(/\bO\(n log n\)\b/gi, 'O of N log N')
    .replace(/\bO\(log n\)\b/gi, 'O of log N')
    .replace(/\bO\(n\)\b/gi, 'O of N')
    .replace(/\bSQL\b/g, 'Sequel')
    .replace(/\bNoSQL\b/g, 'No Sequel')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bAPIs\b/g, 'A P Is')
    .replace(/\bCI\/CD\b/gi, 'C I C D')
    .replace(/\be\.g\.,?\b/gi, 'for example,')
    .replace(/\bi\.e\.,?\b/gi, 'that is,')
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\bw\/\b/gi, 'with')
    .replace(/\b&\b/g, ' and ')
    // Normalize excess whitespace and line breaks
    .replace(/(\r\n|\n|\r)/gm, ' ')
    // Micro-pauses: ensure clean spacing after punctuation
    .replace(/([.?!])\s*/g, '$1 ')
    .replace(/([,;:])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

let activeSpeechKeepAlive = null;

function clearKeepAlive() {
  if (activeSpeechKeepAlive) {
    clearInterval(activeSpeechKeepAlive);
    activeSpeechKeepAlive = null;
  }
}

/**
 * Natural voice speaking function with human conversational cadence.
 */
export function speakText({ 
  text, 
  voice, 
  langCode = 'en-US', 
  rate = 0.98, // Friendly, natural conversational pacing (never rushed or robotic)
  pitch = 1.03, // Warm, pleasant conversational pitch
  onStart, 
  onEnd, 
  onError 
}) {
  if (!isTTSSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech & clear previous heartbeat
  clearKeepAlive();
  window.speechSynthesis.cancel();

  const spokenText = cleanForConversationalSpeech(text);
  if (!spokenText) {
    if (onEnd) onEnd();
    return;
  }

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

  const handleFinish = () => {
    clearKeepAlive();
    if (onEnd) onEnd();
  };

  const handleSpeechError = (e) => {
    clearKeepAlive();
    console.warn('SpeechSynthesis notice:', e);
    if (onError) onError(e);
    if (onEnd) onEnd();
  };

  utterance.onstart = () => {
    // Chromium speech synthesis keep-alive: prevents audio from freezing on utterances > 15s
    clearKeepAlive();
    activeSpeechKeepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearKeepAlive();
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);

    if (onStart) onStart();
  };

  utterance.onend = handleFinish;
  utterance.onerror = handleSpeechError;

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    clearKeepAlive();
    console.error('Failed to execute speechSynthesis.speak:', err);
    if (onEnd) onEnd();
  }
}

export function stopSpeech() {
  clearKeepAlive();
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}
