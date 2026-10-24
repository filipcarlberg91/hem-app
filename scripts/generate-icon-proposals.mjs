import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public/icon-proposals');
const artifactDir = path.resolve('.aistudio/artifacts/brain/573f32e2-2ecd-4fec-bdc0-b78a7d1d127b');
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

async function renderIcon(svgContent, filename) {
  const safeSvg = svgContent.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  const buf = await sharp(Buffer.from(safeSvg, 'utf8'), { density: 288 })
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, filename), buf);
  fs.writeFileSync(path.join(artifactDir, filename), buf);
  console.log(`Generated ${filename}`);
}

// ============================================================================
// FÖRSLAG 1: "Varmt Skogshem" (Material 3 Expressive — Skogsgrönt, Mint & Varmt Hjärta)
// ============================================================================
const icon1Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E4D38" />
      <stop offset="55%" stop-color="#153828" />
      <stop offset="100%" stop-color="#0C2218" />
    </linearGradient>
    <linearGradient id="house1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#BAFAD4" />
      <stop offset="100%" stop-color="#7CE0A9" />
    </linearGradient>
    <linearGradient id="heart1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB36B" />
      <stop offset="100%" stop-color="#F26430" />
    </linearGradient>
  </defs>

  <!-- Squircle App Icon Background -->
  <rect width="512" height="512" rx="116" fill="url(#bg1)" />
  <circle cx="256" cy="180" r="190" fill="#2A6B4D" opacity="0.32" />

  <!-- Soft M3 Expressive Halo -->
  <rect x="92" y="92" width="328" height="328" rx="92" fill="#1E4B36" stroke="#367A5B" stroke-width="3" opacity="0.65" />

  <!-- Chimney -->
  <rect x="318" y="132" width="36" height="68" rx="14" fill="#8CE6B4" />

  <!-- Rounded Expressive House Body -->
  <path d="M256 112 L116 232 C106 241 112 258 126 258 H148 V364 C148 386 166 404 188 404 H324 C346 404 364 386 364 364 V258 H386 C400 258 406 241 396 232 L256 112 Z" fill="url(#house1)" />

  <!-- Warm Heart Centerpiece inside the House -->
  <path d="M256 348 C256 348 196 306 196 264 C196 242 213 226 233 226 C245 226 252 233 256 240 C260 233 267 226 279 226 C299 226 316 242 316 264 C316 306 256 348 256 348 Z" fill="url(#heart1)" />
</svg>`;

// ============================================================================
// FÖRSLAG 2: "Nordisk Familjeknut" (Ljus Salvia, Kalender, Bock & Hustak)
// ============================================================================
const icon2Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F4FBF7" />
      <stop offset="100%" stop-color="#D4EDE0" />
    </linearGradient>
    <linearGradient id="roof2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E4D38" />
      <stop offset="100%" stop-color="#123022" />
    </linearGradient>
  </defs>

  <!-- Light Nordic Squircle Background -->
  <rect width="512" height="512" rx="116" fill="url(#bg2)" />
  <rect x="20" y="20" width="472" height="472" rx="100" fill="none" stroke="#B5DEC7" stroke-width="4" />

  <!-- Calendar / Home Card Base -->
  <rect x="128" y="210" width="256" height="202" rx="52" fill="#FFFFFF" stroke="#183D2C" stroke-width="16" />

  <!-- Calendar Binding Dots -->
  <circle cx="196" cy="258" r="12" fill="#183D2C" />
  <circle cx="256" cy="258" r="12" fill="#059669" />
  <circle cx="316" cy="258" r="12" fill="#EA580C" />

  <!-- Expressive Checkmark inside Home -->
  <rect x="174" y="294" width="164" height="76" rx="38" fill="#183D2C" />
  <path d="M226 332 L248 352 L290 312" fill="none" stroke="#A6F2C6" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Bold Overhanging Nordic Roof -->
  <path d="M92 238 L256 102 L420 238" fill="none" stroke="url(#roof2)" stroke-width="38" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

// ============================================================================
// FÖRSLAG 3: "Skandinavisk Kvällssol" (Terrakotta, Bärnsten & Djup Furugrön)
// ============================================================================
const icon3Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#133325" />
      <stop offset="100%" stop-color="#091C13" />
    </linearGradient>
    <linearGradient id="sun3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="cottage3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#C2410C" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bg3)" />

  <!-- Warm Golden Sun Halo Behind Roof -->
  <circle cx="336" cy="158" r="62" fill="url(#sun3)" opacity="0.92" />

  <!-- Rolling Mint/Sage Hills at Bottom -->
  <path d="M0 390 Q160 340 310 385 T512 370 L512 512 L0 512 Z" fill="#1E4E38" />
  <path d="M0 425 Q220 380 512 415 L512 512 L0 512 Z" fill="#2A6B4D" />

  <!-- Cozy Nordic Faluröd/Terracotta House -->
  <path d="M244 134 L112 248 H144 V386 C144 402 157 415 173 415 H315 C331 415 344 402 344 386 V248 H376 L244 134 Z" fill="url(#cottage3)" />

  <!-- White Roof Trim -->
  <path d="M108 248 L244 130 L380 248" fill="none" stroke="#FFFBEB" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Glowing Warm Arched Doorway & Window -->
  <rect x="212" y="298" width="64" height="117" rx="32" fill="#FEF3C7" />
  <circle cx="244" cy="232" r="24" fill="#FEF3C7" />
</svg>`;

// ============================================================================
// FÖRSLAG 4: "Monogram H" (Arkitektoniskt H med Hustak i Mint & Guld)
// ============================================================================
const icon4Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#183D2C" />
      <stop offset="100%" stop-color="#0B1F16" />
    </linearGradient>
    <linearGradient id="pillar4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#D7F5E4" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bg4)" />

  <!-- Subtle Geometric Frame -->
  <rect x="64" y="64" width="384" height="384" rx="88" fill="#133123" stroke="#265941" stroke-width="3" />

  <!-- Left & Right Pillars of "H" -->
  <rect x="134" y="188" width="64" height="214" rx="32" fill="url(#pillar4)" />
  <rect x="314" y="188" width="64" height="214" rx="32" fill="url(#pillar4)" />

  <!-- Crossbar of "H" -->
  <rect x="134" y="268" width="244" height="56" rx="28" fill="#A6F2C6" />

  <!-- Expressive Pitched Roof Crowning the "H" -->
  <path d="M116 212 L256 104 L396 212" fill="none" stroke="#A6F2C6" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Warm Gold Accent Dot under Roof Peak -->
  <circle cx="256" cy="184" r="20" fill="#FBBF24" />
</svg>`;

// ============================================================================
// FÖRSLAG 5: "Expressive Bento-Hem" (4 Färgkodade Vardagsmoduler som bildar ett Hem)
// ============================================================================
const icon5Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A4230" />
      <stop offset="100%" stop-color="#0D2319" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#bg5)" />

  <!-- Top Roof Triangle / Pill (Mint Green - Hemmet) -->
  <path d="M232 96 C246 84 266 84 280 96 L402 202 C418 216 408 242 386 242 H126 C104 242 94 216 110 202 L232 96 Z" fill="#A6F2C6" />
  <circle cx="256" cy="178" r="22" fill="#183D2C" />

  <!-- Bottom Left Bento Tile (Sky Blue - Kalender) -->
  <rect x="116" y="262" width="130" height="146" rx="40" fill="#93C5FD" />
  <rect x="148" y="298" width="66" height="16" rx="8" fill="#1E3A8A" />
  <circle cx="162" cy="344" r="10" fill="#1E3A8A" />
  <circle cx="198" cy="344" r="10" fill="#1E3A8A" />
  <circle cx="162" cy="374" r="10" fill="#1E3A8A" />

  <!-- Bottom Right Top Bento Pill (Warm Amber/Coral - Inköp & Mat) -->
  <rect x="266" y="262" width="130" height="66" rx="33" fill="#FDBA74" />
  <circle cx="304" cy="295" r="11" fill="#7C2D12" />
  <rect x="326" y="287" width="44" height="16" rx="8" fill="#7C2D12" />

  <!-- Bottom Right Lower Bento Pill (Cream White - Att göra Bock) -->
  <rect x="266" y="342" width="130" height="66" rx="33" fill="#F6FBF7" />
  <path d="M312 375 L326 389 L354 361" fill="none" stroke="#183D2C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

await renderIcon(icon1Svg, 'forslag_ikon_1.png');
await renderIcon(icon2Svg, 'forslag_ikon_2.png');
await renderIcon(icon3Svg, 'forslag_ikon_3.png');
await renderIcon(icon4Svg, 'forslag_ikon_4.png');
await renderIcon(icon5Svg, 'forslag_ikon_5.png');

console.log('All 5 app icon proposals generated successfully!');
