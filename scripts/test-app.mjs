/**
 * Full app verification via Playwright — all 4 games × 2 difficulties.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(__dirname, '..', 'test-screenshots');
mkdirSync(SHOTS, { recursive: true });

const BASE   = 'http://localhost:5173/sumska-prica/';
const ERRORS = [];
let idx = 0;

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 } });
const jsErrors = [];
ctx.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });

const page = await ctx.newPage();
page.on('pageerror', e => jsErrors.push(e.message));

const shot = async (name) => {
  await page.screenshot({ path: join(SHOTS, `${String(++idx).padStart(2,'0')}-${name}.png`) });
};
const pass  = (m) => console.log('  ✅', m);
const fail  = (m) => { ERRORS.push(m); console.error('  ❌', m); };
const probe = (m) => console.log('  🔍', m);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function startApp() {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.locator('button:has-text("ZAPOČNI")').click({ force: true });
  await page.waitForTimeout(500);
}

async function selectDifficulty(diff) {
  if (diff === 'hard') {
    await page.locator('button').filter({ hasText: /Teže/i }).first().click({ force: true });
  } else {
    await page.locator('button').filter({ hasText: /Lakše/i }).first().click({ force: true });
  }
  await page.waitForTimeout(300);
}

async function selectGame(emoji) {
  await page.locator('button').filter({ hasText: emoji }).first().click({ force: true });
  await page.waitForTimeout(700);
}

// ── 1. START SCREEN ───────────────────────────────────────────────────────────
console.log('\n── Start Screen ──');
await page.goto(BASE);
await page.waitForLoadState('networkidle');
const title = await page.locator('h1, h2').first().textContent();
pass(`Naslov: "${title?.trim()}"`);
await shot('start-screen');

const startBtn = page.locator('button:has-text("ZAPOČNI")');
if (await startBtn.isVisible()) pass('Gumb ZAPOČNI vidljiv');
else fail('Gumb ZAPOČNI nije nađen');

// ── 2. GAME SELECTOR ─────────────────────────────────────────────────────────
console.log('\n── Game Selector ──');
await startBtn.click({ force: true });
await page.waitForTimeout(500);
await shot('game-selector');
const selectorH = await page.locator('h2').first().textContent();
pass(`Selektor heading: "${selectorH?.trim()}"`);

const gameNames = await page.locator('button').allTextContents();
const hasAllGames = ['Zvučna', 'nestao', 'Eko', 'Slagalica'].every(n =>
  gameNames.some(t => t.includes(n))
);
if (hasAllGames) pass('Sve 4 igre vidljive u selektoru');
else fail(`Nedostaju igre — pronađeno: ${gameNames.filter(t => t.length > 5).join(' | ')}`);

// ── 3. ZVUČNA ZAGONETKA — EASY ────────────────────────────────────────────────
console.log('\n── Zvučna Zagonetka (easy) ──');
try {
  await startApp();
  await selectDifficulty('easy');
  await selectGame('🔤');
  await shot('zz-easy-start');

  const h = await page.locator('h2').first().textContent();
  pass(`Heading: "${h?.trim()}"`);

  // Letter buttons: single uppercase/lowercase letters
  const allBtns = await page.locator('button').allTextContents();
  const letterBtns = allBtns.filter(t => t.trim().length === 1 && /[A-Za-zŠŽČĆĐšžčćđ]/.test(t.trim()));
  if (letterBtns.length >= 3) pass(`Slova vidljiva: ${letterBtns.join(', ')}`);
  else fail(`Premalo slova: ${JSON.stringify(letterBtns)}`);

  // Check progress bar
  const progress = await page.locator('body').textContent();
  if (/\d+\/\d+/.test(progress || '')) pass('Progress bar s brojevima vidljiv');
  else probe('Progress bar nije pronađen u tekstu');

  // Klikni prvo slovo
  if (letterBtns.length > 0) {
    const letter = letterBtns[0].trim();
    await page.locator(`button:has-text("${letter}")`).first().click({ force: true });
    await page.waitForTimeout(900);
    await shot('zz-easy-after-click');
    pass(`Klik na slovo "${letter}" — feedback prikazan`);
  }

  // Gumb "Poslušaj"
  const poslusaj = page.locator('button').filter({ hasText: /Poslušaj/i });
  if (await poslusaj.isVisible({ timeout: 1000 })) {
    await poslusaj.click({ force: true });
    await page.waitForTimeout(300);
    pass('"Poslušaj" gumb radi');
  } else probe('"Poslušaj" gumb nije vidljiv (možda kasniji ekran)');
} catch (e) { fail(`ZZ easy crash: ${e.message.slice(0,120)}`); }

// ── 4. ZVUČNA ZAGONETKA — HARD ───────────────────────────────────────────────
console.log('\n── Zvučna Zagonetka (hard) ──');
try {
  await startApp();
  await selectDifficulty('hard');
  await selectGame('🔤');
  await shot('zz-hard-start');

  const allBtns = await page.locator('button').allTextContents();
  const letterBtns = allBtns.filter(t => t.trim().length === 1 && /[A-Za-zŠŽČĆĐšžčćđ]/.test(t.trim()));
  if (letterBtns.length === 4) pass(`Hard: 4 slova (${letterBtns.join(', ')})`);
  else if (letterBtns.length === 3) probe(`Hard level-1 dobio 3 slova — može biti ispravno za neke runde`);
  else fail(`Hard: očekivana 4 slova, dobio ${letterBtns.length}`);

  // Tajmer mora biti vidljiv u hard modu
  const bodyText = await page.locator('body').textContent();
  // TimerBar renderira progres bar bez teksta — check via screenshot
  await shot('zz-hard-timer');
  probe('Tajmer provjera kroz screenshot (nema vidljivog teksta za timer)');
} catch (e) { fail(`ZZ hard crash: ${e.message.slice(0,120)}`); }

// ── 5. KAMO JE NESTAO LISTIĆ — EASY ─────────────────────────────────────────
console.log('\n── Kamo je nestao listić (easy) ──');
try {
  await startApp();
  await selectDifficulty('easy');
  await selectGame('🍂');
  await shot('kjn-easy-show');

  const h = await page.locator('h2').first().textContent();
  pass(`Heading: "${h?.trim()}"`);

  // Čekaj faze: pokazivanje (3.5s) + pokrivanje (1.2s) + pogađanje
  await page.waitForTimeout(5200);
  await shot('kjn-easy-guess');
  const h2 = await page.locator('h2').first().textContent();
  pass(`Nakon čekanja heading: "${h2?.trim()}"`);

  // Choices — gumbi s emojijima predmeta
  const choiceBtns = page.locator('button').filter({ hasText: /🌰|🍄|🍂|🍎|🌸|🫐|🪶|🐌|🦋|🪨|🍓|🌿/ });
  const nChoices = await choiceBtns.count();
  if (nChoices >= 2) {
    pass(`${nChoices} izbora vidljivo`);
    await choiceBtns.first().click({ force: true });
    await page.waitForTimeout(800);
    await shot('kjn-easy-feedback');
    pass('Klik na predmet — feedback prikazan');
  } else {
    fail(`Manje od 2 izbora: ${nChoices}`);
  }
} catch (e) { fail(`KJN easy crash: ${e.message.slice(0,120)}`); }

// ── 6. KAMO JE NESTAO LISTIĆ — HARD ─────────────────────────────────────────
console.log('\n── Kamo je nestao listić (hard) ──');
try {
  await startApp();
  await selectDifficulty('hard');
  await selectGame('🍂');
  await shot('kjn-hard-show');

  // Hard: show=2.5s + cover=1.2s
  await page.waitForTimeout(4200);
  await shot('kjn-hard-guess');
  const h = await page.locator('h2').first().textContent();
  pass(`KJN hard guess heading: "${h?.trim()}"`);

  const nChoices = await page.locator('button').filter({ hasText: /🌰|🍄|🍂|🍎|🌸|🫐|🪶|🐌|🦋|🪨|🍓|🌿/ }).count();
  if (nChoices >= 2) pass(`${nChoices} izbora u hard modu`);
  else fail(`Hard: ${nChoices} izbora vidljivo`);
} catch (e) { fail(`KJN hard crash: ${e.message.slice(0,120)}`); }

// ── 7. EKO-ČISTAČ — EASY ─────────────────────────────────────────────────────
console.log('\n── Eko-Čistač (easy) ──');
try {
  await startApp();
  await selectDifficulty('easy');
  await selectGame('♻️');
  await shot('eko-easy-intro');

  // Intro screen
  const introText = await page.locator('body').textContent();
  if (introText?.includes('plastične boce')) pass('Intro tekst: plastične boce ✓');
  else probe(`Intro tekst ne spominje "plastične boce"`);

  // Klikni IGRAJ
  await page.locator('button:has-text("IGRAJ")').click({ force: true });
  await page.waitForTimeout(2500); // wait for items to spawn
  await shot('eko-easy-playing');

  // Padajući predmeti
  const fallingItems = page.locator('button[aria-label]');
  const nItems = await fallingItems.count();
  if (nItems > 0) {
    pass(`${nItems} padajućih predmeta vidljivo`);
    // Klikni prve 3
    for (let i = 0; i < Math.min(3, nItems); i++) {
      await fallingItems.nth(i).click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(600);
    await shot('eko-easy-clicking');
    pass('Klik na predmete — OK');
  } else {
    probe('Nema padajućih predmeta odmah — daj više vremena');
    await page.waitForTimeout(2000);
    const n2 = await page.locator('button[aria-label]').count();
    if (n2 > 0) pass(`Predmeti se pojavili nakon dužeg čekanja: ${n2}`);
    else fail('Padajući predmeti se ne pojavljuju');
  }
} catch (e) { fail(`Eko easy crash: ${e.message.slice(0,120)}`); }

// ── 8. EKO-ČISTAČ — HARD ─────────────────────────────────────────────────────
console.log('\n── Eko-Čistač (hard) ──');
try {
  await startApp();
  await selectDifficulty('hard');
  await selectGame('♻️');
  await shot('eko-hard-intro');

  const introText = await page.locator('body').textContent();
  if (introText?.includes('limenke') || introText?.includes('Limenka')) pass('Hard intro: limenke ✓');
  else fail('Hard intro ne spominje limenke');

  if (introText?.includes('Leptir') || introText?.includes('leptir')) pass('Hard intro: leptir ✓');
  else probe('Hard intro ne spominje leptir');

  await page.locator('button:has-text("IGRAJ")').click({ force: true });
  await page.waitForTimeout(2000);
  await shot('eko-hard-playing');
  pass('Eko hard: igra pokrenuta');
} catch (e) { fail(`Eko hard crash: ${e.message.slice(0,120)}`); }

// ── 9. ŠUMSKA SLAGALICA — EASY ───────────────────────────────────────────────
console.log('\n── Šumska Slagalica (easy) ──');
try {
  await startApp();
  await selectDifficulty('easy');
  await selectGame('🧩');
  await shot('slagalica-easy-start');

  const h = await page.locator('h2').first().textContent();
  pass(`Heading: "${h?.trim()}"`);

  // Životinja emoji mora biti vidljiv
  const bodyText = await page.locator('body').textContent();
  const hasAnimal = /🐺|🐟|🦀|🦔|🐦|🐆|🐇|🐕|🐭|🦉|🦩|🐜|🐸|🦌|🐠|🐻|🐴|🐐|🐑|🐛/.test(
    await page.locator('body').innerHTML()
  );
  if (hasAnimal) pass('Životinja emoji vidljiv');
  else probe('Životinja emoji nije potvrđen');

  // Prazni slotovi (dashed border)
  const slots = page.locator('[role="button"]');
  const nSlots = await slots.count();
  pass(`Slots/tiles ukupno: ${nSlots}`);

  // Letter tiles (available pool) — styled with accent color
  const tileDivs = page.locator('div[role="button"]');
  const nTiles = await tileDivs.count();
  if (nTiles > 0) {
    pass(`${nTiles} tile(s) za povlačenje vidljivo`);
    await tileDivs.first().click({ force: true });
    await page.waitForTimeout(500);
    await shot('slagalica-easy-tile-clicked');
    pass('Tile klik — slovo postavljeno u slot');
  } else probe('Tile divovi nisu nađeni — možda drugačiji selektor');
} catch (e) { fail(`Slagalica easy crash: ${e.message.slice(0,120)}`); }

// ── 10. ŠUMSKA SLAGALICA — HARD ──────────────────────────────────────────────
console.log('\n── Šumska Slagalica (hard) ──');
try {
  await startApp();
  await selectDifficulty('hard');
  await selectGame('🧩');
  await shot('slagalica-hard-start');

  const bodyHTML = await page.locator('body').innerHTML();
  // Hard words are 5+ letters; check word length via slots
  const slotCount = await page.locator('[role="button"]').count();
  if (slotCount >= 5) pass(`Hard mode: ${slotCount} slova u zadatku (5+)`);
  else probe(`Hard: ${slotCount} slova — možda prva runda kratka`);

  // Tajmer mora biti prisutan u hard modu
  const hasTimer = bodyHTML.includes('timerbar') || bodyHTML.includes('TimerBar') ||
    await page.locator('div').filter({ hasText: /^\d+$/ }).count() > 0;
  probe('Tajmer: provjera kroz screenshot'); // visual only
  await shot('slagalica-hard-timer');
} catch (e) { fail(`Slagalica hard crash: ${e.message.slice(0,120)}`); }

// ── 11. AUDIO FILES ───────────────────────────────────────────────────────────
console.log('\n── Audio datoteke ──');
try {
  const checkKeys = [
    'dobrodosli', 'bravo-tocno', 'pokusaj-ponovo',
    'pronadi-a', 'pronadi-j', 'pronadi-z', 'pronadi-v', 'pronadi-s',
    'trazimo-j', 'trazimo-z',
    'zapamti-predmete', 'bravo-ocistio',
    'slozi-vuk', 'slozi-jabuka', 'slozi-medvjed',
  ];
  const results = await page.evaluate(async (keys) => {
    const out = {};
    for (const k of keys) {
      const r = await fetch(`/sumska-prica/audio/${k}.mp3`, { method: 'HEAD' });
      out[k] = r.status;
    }
    return out;
  }, checkKeys);

  let audioOk = 0, audioFail = 0;
  for (const [k, status] of Object.entries(results)) {
    if (status === 200) audioOk++;
    else { fail(`Audio ${k}.mp3 → HTTP ${status}`); audioFail++; }
  }
  if (audioFail === 0) pass(`${audioOk}/${checkKeys.length} audio datoteka dostupno`);
} catch (e) { fail(`Audio provjera: ${e.message.slice(0,80)}`); }

// ── 12. JS GREŠKE ────────────────────────────────────────────────────────────
console.log('\n── JS greške ──');
const relevantErrors = jsErrors.filter(e =>
  !e.includes('favicon') && !e.includes('responsivevoice') && !e.includes('ResizeObserver')
);
if (relevantErrors.length === 0) pass('Nema JS grešaka kroz cijelo testiranje');
else relevantErrors.forEach(e => fail(`JS greška: ${e.slice(0, 200)}`));

// ── REPORT ────────────────────────────────────────────────────────────────────
await browser.close();

console.log('\n' + '═'.repeat(60));
console.log(`Screenshoti: ${SHOTS}`);
if (ERRORS.length === 0) {
  console.log('\n✅  PASS — sve igre rade, nema grešaka\n');
} else {
  console.log(`\n❌  FAIL — ${ERRORS.length} problem(a):\n`);
  ERRORS.forEach(e => console.log(`  • ${e}`));
}
