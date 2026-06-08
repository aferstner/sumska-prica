/**
 * Generates Croatian TTS audio files using Azure Cognitive Services.
 * Voice: hr-HR-GabrijelaNeural (high-quality Croatian female neural voice)
 *
 * Setup (besplatno):
 *  1. Idite na https://portal.azure.com
 *  2. Kreirajte "Speech" resurs (F0 free tier — 500,000 znakova/mj besplatno)
 *  3. Kopirajte KEY 1 i Region
 *  4. Pokrenite skriptu:
 *       AZURE_KEY=vaš_ključ AZURE_REGION=vaša_regija node scripts/generate-audio.mjs
 *     ili na Windowsima:
 *       $env:AZURE_KEY="vaš_ključ"; $env:AZURE_REGION="vaša_regija"; node scripts/generate-audio.mjs
 *
 * Uobičajene regije: westeurope, northeurope, eastus, centralus
 *
 * Usage: node scripts/generate-audio.mjs [--force]
 * Output: public/audio/*.mp3  (~193 files)
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'audio');
const FORCE = process.argv.includes('--force');

const AZURE_KEY    = process.env.AZURE_KEY;
const AZURE_REGION = process.env.AZURE_REGION;

if (!AZURE_KEY || !AZURE_REGION) {
  console.error(`
Greška: nedostaju Azure kredencijali.

Pokrenite s:
  $env:AZURE_KEY="vaš_ključ"; $env:AZURE_REGION="vaša_regija"; node scripts/generate-audio.mjs

Setup (besplatno):
  1. https://portal.azure.com → kreirajte Speech resurs (F0 tier)
  2. Kopirajte KEY 1 i Region (npr. westeurope)
`);
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Isti podaci kao u audioMap.js ─────────────────────────────────────────────

const LETTER_HINT = {
  A: 'auto',    O: 'oko',
  M: 'mama',    K: 'kuća',
  S: 'sunce',   L: 'lopta',
  T: 'tata',    N: 'nos',
  R: 'riba',    E: 'evo',
  I: 'igra',    U: 'uho',
  V: 'voda',    P: 'pas',
  G: 'gora',    H: 'hlače',
  C: 'cesta',   Z: 'zima',
  J: 'jabuka',  D: 'drvo',
  F: 'foto',
  b: 'brod',    d: 'drvo',
  p: 'pas',     n: 'nos',
  m: 'more',    u: 'uho',
};

const ZZ_TARGETS_UPPER = ['A','K','T','M','S','O','R','E','I','V','P','G','H','C','Z','J','D','L'];
const ZZ_TARGETS_LOWER = ['b','d','p','n','m','u'];

const SS_WORDS = [
  'Vuk','Som','Rak','Jež','Kos','Ris','Zec','Pas','Miš',
  'Sova','Zeko','Roda','Mrav','Žaba','Srna','Riba','Orao','Medo','Konj','Koza','Ovca','Buba',
  'Jelen','Patka','Pčela','Kunić','Vrana','Guska','Ronda',
  'Lisica','Leptir','Šišmiš','Lasica','Jazavac','Medvjed','Fazanka','Dabar',
];

const SS_HINT_LETTERS = ['A','B','C','Č','Ć','D','E','F','G','I','J','K','L','M','N','O','P','R','S','Š','T','U','V','Z','Ž'];

const KJN_ITEMS = [
  { id: 'zir',      name: 'Žir'      },
  { id: 'gljiva',   name: 'Gljiva'   },
  { id: 'list',     name: 'List'     },
  { id: 'jabuka',   name: 'Jabuka'   },
  { id: 'cvijet',   name: 'Cvijet'   },
  { id: 'bobica',   name: 'Bobica'   },
  { id: 'pero',     name: 'Pero'     },
  { id: 'puz',      name: 'Puž'      },
  { id: 'leptir',   name: 'Leptir'   },
  { id: 'kamen',    name: 'Kamen'    },
  { id: 'jagoda',   name: 'Jagoda'   },
  { id: 'grancica', name: 'Grančica' },
];

const ECO_WRONG_EASY = ['List', 'Bubamara'];
const ECO_WRONG_HARD = ['List', 'Bubamara', 'Leptir', 'Ptica'];

function slug(str) {
  return str
    .toLowerCase()
    .replace(/č/g, 'ch').replace(/š/g, 'sh').replace(/ž/g, 'zh')
    .replace(/ć/g, 'cj').replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const AUDIOS = [];

AUDIOS.push({ key: 'dobrodosli',            text: 'Dobrodošli u Šumsku Priču! Pritisnite gumb za početak.' });
AUDIOS.push({ key: 'odaberi-igru',          text: 'Odaberi igru koju želiš igrati!' });
AUDIOS.push({ key: 'pohvala-bravo',         text: 'Bravo! Odlično odrađeno!' });
AUDIOS.push({ key: 'pohvala-sjajno',        text: 'Sjajno! Ti si zvijezda šume!' });
AUDIOS.push({ key: 'pohvala-fantasticno',   text: 'Fantastično! Nastavite tako!' });
AUDIOS.push({ key: 'pohvala-super',         text: 'Super posao! Šuma je ponosna!' });
AUDIOS.push({ key: 'bravo-tocno',           text: 'Bravo! Točno!' });
AUDIOS.push({ key: 'pokusaj-ponovo',        text: 'Pokušaj ponovo!' });
AUDIOS.push({ key: 'vrijeme-isteklo-dalje', text: 'Vrijeme je isteklo! Idemo dalje.' });

for (const letter of ZZ_TARGETS_UPPER) {
  const hint = LETTER_HINT[letter];
  AUDIOS.push({ key: `pronadi-${slug(letter)}`,       text: `Stisni na prvo slovo u riječi ${hint}!` });
  AUDIOS.push({ key: `trazimo-${slug(letter)}`,       text: `Pokušaj ponovo! Traži prvo slovo u ${hint}!` });
}
for (const letter of ZZ_TARGETS_LOWER) {
  const hint = LETTER_HINT[letter];
  AUDIOS.push({ key: `pronadi-lower-${slug(letter)}`, text: `Stisni na prvo slovo u riječi ${hint}!` });
  AUDIOS.push({ key: `trazimo-lower-${slug(letter)}`, text: `Pokušaj ponovo! Traži prvo slovo u ${hint}!` });
}

AUDIOS.push({ key: 'zapamti-predmete',    text: 'Zapamti predmete!' });
AUDIOS.push({ key: 'koji-predmet',        text: 'Koji predmet je nestao?' });
AUDIOS.push({ key: 'to-nije-taj',         text: 'To nije taj. Pokušaj ponovo!' });

for (const item of KJN_ITEMS) {
  AUDIOS.push({ key: `nestao-${item.id}`,       text: `Nestao je ${item.name}! Idemo dalje.` });
  AUDIOS.push({ key: `tocno-nestao-${item.id}`, text: `Točno! Nestao je ${item.name}!` });
}

AUDIOS.push({ key: 'bravo-ocistio',    text: 'Bravo! Očistio si šumu!' });
AUDIOS.push({ key: 'klikni-boce-easy', text: 'Klikni samo plastične boce! Pazi da ne klikneš listove ili bubamare.' });
AUDIOS.push({ key: 'klikni-boce-hard', text: 'Klikni plastične boce i limenke! Ne diraj ostalo!' });

for (const name of ECO_WRONG_EASY) {
  AUDIOS.push({ key: `to-je-${slug(name)}-easy`, text: `To je ${name}. Klikni samo plastične boce!` });
}
for (const name of ECO_WRONG_HARD) {
  AUDIOS.push({ key: `to-je-${slug(name)}-hard`, text: `To je ${name}. Klikni samo boce i limenke!` });
}

AUDIOS.push({ key: 'vrijeme-sljedeca-rijec', text: 'Vrijeme je isteklo! Idemo na sljedeću riječ.' });

for (const display of SS_WORDS) {
  const k = slug(display);
  AUDIOS.push({ key: `slozi-${k}`,       text: `Složi riječ ${display}!` });
  AUDIOS.push({ key: `bravo-rijec-${k}`, text: `${display}! Bravo!` });
}

for (const letter of SS_HINT_LETTERS) {
  AUDIOS.push({ key: `hint-slovo-${slug(letter)}`, text: `Hint: slovo ${letter}!` });
}

// ── Azure TTS ─────────────────────────────────────────────────────────────────

const TTS_URL = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const VOICE   = 'hr-HR-GabrijelaNeural';

function buildSSML(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<speak version='1.0' xml:lang='hr-HR'>
  <voice name='${VOICE}'>
    <prosody rate='-10%'>${escaped}</prosody>
  </voice>
</speak>`;
}

async function downloadAudio(text, outputPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        },
        body: buildSSML(text),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err.slice(0, 120)}`);
      }
      const buf = await res.arrayBuffer();
      writeFileSync(outputPath, Buffer.from(buf));
      return true;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const total = AUDIOS.length;
let skipped = 0, succeeded = 0, failed = 0;
const failures = [];

console.log(`\nGeneriranje ${total} audio datoteka (Azure ${VOICE})\n`);

for (let i = 0; i < AUDIOS.length; i++) {
  const { key, text } = AUDIOS[i];
  const outPath = join(OUTPUT_DIR, `${key}.mp3`);
  const label   = `[${String(i + 1).padStart(3)}/${total}] ${key}`;

  if (!FORCE && existsSync(outPath)) {
    process.stdout.write(`  SKIP  ${label}\n`);
    skipped++;
    continue;
  }

  try {
    await downloadAudio(text, outPath);
    process.stdout.write(`  OK    ${label}\n`);
    succeeded++;
  } catch (err) {
    process.stdout.write(`  FAIL  ${label} — ${err.message}\n`);
    failures.push({ key, error: err.message });
    failed++;
  }

  // Azure TTS nema strog rate limit, ali budimo pristojni
  await new Promise(r => setTimeout(r, 150));
}

console.log(`\nGotovo: ${succeeded} preuzeto, ${skipped} preskočeno, ${failed} neuspješno.\n`);
if (failures.length) {
  console.log('Neuspješni:');
  failures.forEach(f => console.log(`  ${f.key}: ${f.error}`));
}
