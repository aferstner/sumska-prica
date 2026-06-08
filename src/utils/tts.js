import { AUDIO_MAP } from './audioMap.js';

// ── Pre-recorded audio playback ───────────────────────────────────────────────

let currentAudio = null;

function playFile(key, onEnd) {
  const src = `${import.meta.env.BASE_URL}audio/${key}.mp3`;
  const audio = new Audio(src);
  currentAudio = audio;

  audio.onended = () => {
    if (currentAudio !== audio) return; // superseded by a later speak()
    currentAudio = null;
    if (onEnd) onEnd();
  };

  const onFileFail = () => {
    if (currentAudio !== audio) return; // superseded — don't start fallback
    currentAudio = null;
    speakWithBrowser(AUDIO_MAP_REVERSE[key] ?? key, onEnd);
  };
  audio.onerror = onFileFail;
  audio.play().catch(onFileFail);
}

// Reverse map for fallback error messages (key → text)
const AUDIO_MAP_REVERSE = Object.fromEntries(
  Object.entries(AUDIO_MAP).map(([text, key]) => [key, text])
);

// ── Browser TTS fallback (used when no pre-recorded file exists) ──────────────

let hrVoice = null;

const PREFERRED_VOICE_NAMES = [
  'Microsoft Petra Online (Natural) - Croatian (Croatia)',
  'Microsoft Petra - Croatian (Croatia)',
  'Google Croatian',
  'Petra',
];

function loadVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_VOICE_NAMES) {
    const found = voices.find((v) => v.name === name || v.name.includes(name));
    if (found) { hrVoice = found; return; }
  }
  hrVoice =
    voices.find((v) => v.lang === 'hr-HR') ||
    voices.find((v) => v.lang.startsWith('hr')) ||
    null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakWithBrowser(text, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hr-HR';
  utterance.rate = 0.75;
  utterance.pitch = 1.0;
  if (hrVoice) utterance.voice = hrVoice;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => { if (onEnd) onEnd(); };
  window.speechSynthesis.speak(utterance);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function speak(text, onEnd = null) {
  // Always stop both sources before starting anything new
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const key = AUDIO_MAP[text];
  if (key) {
    playFile(key, onEnd);
  } else {
    speakWithBrowser(text, onEnd);
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
