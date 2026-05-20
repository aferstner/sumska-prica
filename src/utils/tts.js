let hrVoice = null;

function loadVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  hrVoice =
    voices.find((v) => v.lang === 'hr-HR') ||
    voices.find((v) => v.lang.startsWith('hr')) ||
    voices.find((v) => v.lang.startsWith('sr')) ||
    null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speak(text, onEnd = null) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hr-HR';
  utterance.rate = 0.82;
  utterance.pitch = 1.05;

  if (hrVoice) utterance.voice = hrVoice;
  if (onEnd) utterance.onend = onEnd;

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
