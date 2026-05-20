export const BADGES = [
  {
    id: 'game1',
    icon: '🔤',
    title: 'Lovac na slova',
    desc: 'Završio Zvučnu Zagonetku',
  },
  {
    id: 'game2',
    icon: '🔍',
    title: 'Šumski detektiv',
    desc: 'Završio Kamo je nestao listić?',
  },
  {
    id: 'game3',
    icon: '♻️',
    title: 'Eko-heroj',
    desc: 'Završio Eko-Čistač',
  },
  {
    id: 'game4',
    icon: '🧩',
    title: 'Složilac riječi',
    desc: 'Završio Šumsku Slagalicu',
  },
  {
    id: 'all4',
    icon: '🏆',
    title: 'Majstor šume',
    desc: 'Odigrao sve 4 igre u jednoj sesiji',
  },
  {
    id: 'stars5',
    icon: '⭐',
    title: 'Skupljač zvjezdica',
    desc: 'Skupio 5 zvjezdica',
  },
  {
    id: 'stars10',
    icon: '🌟',
    title: 'Zvijezda šume',
    desc: 'Skupio 10 zvjezdica',
  },
  {
    id: 'stars20',
    icon: '💫',
    title: 'Superzvijezda',
    desc: 'Skupio 20 zvjezdica',
  },
];

/**
 * Returns an array of badge IDs earned given the current session state.
 * @param {Set<number>} gamesCompleted  — set of completed game IDs (1-4)
 * @param {number}      stars           — stars earned this session
 */
export function computeBadges(gamesCompleted, stars) {
  const earned = [];
  if (gamesCompleted.has(1)) earned.push('game1');
  if (gamesCompleted.has(2)) earned.push('game2');
  if (gamesCompleted.has(3)) earned.push('game3');
  if (gamesCompleted.has(4)) earned.push('game4');
  if (gamesCompleted.size >= 4) earned.push('all4');
  if (stars >= 5)  earned.push('stars5');
  if (stars >= 10) earned.push('stars10');
  if (stars >= 20) earned.push('stars20');
  return earned;
}

/** Returns the full badge objects for a list of IDs. */
export function getBadgeObjects(ids) {
  return ids.map((id) => BADGES.find((b) => b.id === id)).filter(Boolean);
}
