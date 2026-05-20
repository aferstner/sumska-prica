const KEY = 'sumska-prica-v1';

function defaults() {
  return {
    totalStars: 0,
    gamesPlayed: { 1: 0, 2: 0, 3: 0, 4: 0 },
    bestSession: 0,
    lastPlayed: null,
  };
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // storage full or unavailable
  }
}

export function recordSession(starsEarned, gamesPlayedIds) {
  const stats = loadStats();
  stats.totalStars += starsEarned;
  if (starsEarned > stats.bestSession) stats.bestSession = starsEarned;
  gamesPlayedIds.forEach((id) => {
    stats.gamesPlayed[id] = (stats.gamesPlayed[id] || 0) + 1;
  });
  stats.lastPlayed = new Date().toISOString();
  saveStats(stats);
  return stats;
}
