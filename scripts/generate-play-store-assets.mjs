import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = path.resolve('public/play-store');
fs.mkdirSync(outDir, { recursive: true });

// Copy 512x512 app icon
if (fs.existsSync('public/pwa-512x512.png')) {
  fs.copyFileSync('public/pwa-512x512.png', path.join(outDir, 'Hem-Appikon-512x512.png'));
}

async function renderSvgToPng(svgContent, pngFilename, width, height) {
  const outPng = path.join(outDir, pngFilename);
  const safeSvg = svgContent.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  await sharp(Buffer.from(safeSvg, 'utf8'), { density: 144 })
    .resize(width, height)
    .flatten({ background: '#183D2C' })
    .png({ compressionLevel: 9 })
    .toFile(outPng);
  console.log(`Generated ${pngFilename} (${width}x${height})`);
}

// ============================================================================
// 1. FUNKTIONSBILD (FEATURE GRAPHIC) — 1024 x 500 px
// ============================================================================
const featureGraphicSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#122F22" />
      <stop offset="55%" stop-color="#183D2C" />
      <stop offset="100%" stop-color="#21513B" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="500" fill="url(#bgGrad)" />

  <!-- Subtle decorative circles -->
  <circle cx="920" cy="80" r="210" fill="#275E45" opacity="0.45" />
  <circle cx="640" cy="460" r="180" fill="#0E261B" opacity="0.5" />

  <!-- Left Column: App Icon, Title & Value Proposition -->
  <g transform="translate(56, 62)">
    <!-- App Icon Badge -->
    <rect x="0" y="0" width="76" height="76" rx="20" fill="#F6FBF7" />
    <rect x="6" y="6" width="64" height="64" rx="16" fill="#183D2C" />
    <path d="M38 18 L16 36 H23 V54 H33 V42 H43 V54 H53 V36 H60 Z" fill="#A6F2C6" />

    <text x="94" y="36" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#A6F2C6" letter-spacing="1.5">FAMILJENS VARDAGSNAV</text>
    <text x="94" y="68" font-family="Liberation Sans" font-weight="bold" font-size="38" fill="#FFFFFF">Hem</text>

    <text x="0" y="136" font-family="Liberation Sans" font-weight="bold" font-size="40" fill="#FFFFFF">Allt för familjen</text>
    <text x="0" y="184" font-family="Liberation Sans" font-weight="bold" font-size="40" fill="#A6F2C6">på ett enda ställe.</text>

    <text x="0" y="232" font-family="Liberation Sans" font-size="18" fill="#D5ECE0">Kalender med veckonummer · Smart inköpslista</text>
    <text x="0" y="260" font-family="Liberation Sans" font-size="18" fill="#D5ECE0">Att göra · Recept · Månadsbudget · Bilder &amp; Album</text>

    <!-- Feature Pills -->
    <rect x="0" y="296" width="190" height="44" rx="22" fill="#265941" stroke="#A6F2C6" stroke-width="1.5" />
    <text x="95" y="324" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#FFFFFF">Synkas i realtid</text>

    <rect x="204" y="296" width="220" height="44" rx="22" fill="#A6F2C6" />
    <text x="314" y="324" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#141E18">Dela valfria sidor</text>
  </g>

  <!-- Right Column: Floating App UI Preview Cards -->
  <!-- Card 1: Calendar Preview -->
  <g transform="translate(530, 38)">
    <rect x="0" y="0" width="440" height="195" rx="24" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="2" />
    <text x="24" y="36" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Kalender · Vecka 42</text>
    <text x="416" y="36" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="13" fill="#21513B">Oktober 2026</text>

    <!-- Event 1 -->
    <rect x="20" y="52" width="400" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="30" y="61" width="64" height="38" rx="10" fill="#0066FF" />
    <text x="62" y="85" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="13" fill="#FFFFFF">17:30</text>
    <text x="108" y="77" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#141E18">Fotbollsträning &amp; skjuts</text>
    <text x="108" y="96" font-family="Liberation Sans" font-size="12" fill="#54685C">17:30–18:30 · Familj · Slottsskogen</text>

    <!-- Event 2 -->
    <rect x="20" y="118" width="400" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="30" y="127" width="64" height="38" rx="10" fill="#059669" />
    <text x="62" y="151" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="13" fill="#FFFFFF">Heldag</text>
    <text x="108" y="143" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#141E18">Höstutflykt med familjen</text>
    <text x="108" y="162" font-family="Liberation Sans" font-size="12" fill="#54685C">Heldag · Utan påminnelse</text>
  </g>

  <!-- Card 2: Smart Shopping List & Per-Page Sharing -->
  <g transform="translate(530, 252)">
    <rect x="0" y="0" width="212" height="210" rx="24" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="2" />
    <text x="20" y="34" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#141E18">Inköpslista</text>
    <text x="20" y="54" font-family="Liberation Sans" font-weight="bold" font-size="11" fill="#059669">FRUKT &amp; GRÖNT</text>

    <rect x="18" y="64" width="176" height="36" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <circle cx="34" cy="82" r="7" fill="#183D2C" />
    <text x="48" y="87" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Avokado (3 st)</text>

    <rect x="18" y="108" width="176" height="36" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <circle cx="34" cy="126" r="7" fill="#FFFFFF" stroke="#183D2C" stroke-width="2" />
    <text x="48" y="131" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Havremjölk (2 st)</text>

    <rect x="18" y="152" width="176" height="36" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <circle cx="34" cy="170" r="7" fill="#FFFFFF" stroke="#183D2C" stroke-width="2" />
    <text x="48" y="175" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Levainbröd (1 förp)</text>

    <!-- Card 3: Bilder & Delning -->
    <rect x="228" y="0" width="212" height="210" rx="24" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="2" />
    <text x="248" y="34" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#141E18">Delning per sida</text>
    <text x="248" y="54" font-family="Liberation Sans" font-size="11" fill="#54685C">Välj exakt vad du delar</text>

    <rect x="246" y="66" width="176" height="38" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="258" y="90" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Kalender</text>
    <rect x="376" y="75" width="36" height="20" rx="10" fill="#183D2C" />
    <circle cx="402" cy="85" r="7" fill="#FFFFFF" />

    <rect x="246" y="112" width="176" height="38" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="258" y="136" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Inköpslista</text>
    <rect x="376" y="121" width="36" height="20" rx="10" fill="#183D2C" />
    <circle cx="402" cy="131" r="7" fill="#FFFFFF" />

    <rect x="246" y="158" width="176" height="38" rx="10" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="258" y="182" font-family="Liberation Sans" font-weight="bold" font-size="13" fill="#141E18">Bilder &amp; Album</text>
    <rect x="376" y="167" width="36" height="20" rx="10" fill="#183D2C" />
    <circle cx="402" cy="177" r="7" fill="#FFFFFF" />
  </g>
</svg>`;

await renderSvgToPng(featureGraphicSvg, 'Hem-Funktionsbild-1024x500.png', 1024, 500);

// ============================================================================
// Helper to wrap Mobile Screenshot (1080 x 1920)
// ============================================================================
function createPhoneScreenshotSvg({ badge, headline, subline, appHeaderRight, bodyContent }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topHero" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#143325" />
      <stop offset="100%" stop-color="#183D2C" />
    </linearGradient>
  </defs>

  <!-- Marketing Backdrop -->
  <rect width="1080" height="1920" fill="url(#topHero)" />

  <!-- Top Marketing Title -->
  <text x="540" y="95" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#A6F2C6" letter-spacing="2">${badge}</text>
  <text x="540" y="155" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="52" fill="#FFFFFF">${headline}</text>
  <text x="540" y="205" text-anchor="middle" font-family="Liberation Sans" font-size="26" fill="#D2EAE0">${subline}</text>

  <!-- App Container Frame -->
  <rect x="48" y="250" width="984" height="1620" rx="48" fill="#F6FBF7" stroke="#8CE6B4" stroke-width="3" />

  <!-- App Top Bar inside Frame -->
  <rect x="50" y="252" width="980" height="106" rx="46" fill="#F6FBF7" />
  <rect x="50" y="356" width="980" height="2" fill="#D8E6DD" />

  <!-- Brand Logo Left -->
  <rect x="90" y="278" width="54" height="54" rx="14" fill="#183D2C" />
  <path d="M117 289 L99 304 H105 V320 H113 V310 H121 V320 H129 V304 H135 Z" fill="#A6F2C6" />
  <text x="160" y="317" font-family="Liberation Sans" font-weight="bold" font-size="34" fill="#183D2C">Hem</text>

  <!-- Profile / Notification Pill Right -->
  <rect x="750" y="278" width="240" height="54" rx="27" fill="#FFFFFF" stroke="#CDE0D4" stroke-width="2" />
  <circle cx="782" cy="305" r="19" fill="#183D2C" />
  <text x="782" y="312" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#FFFFFF">F</text>
  <text x="814" y="301" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Filip</text>
  <text x="814" y="322" font-family="Liberation Sans" font-weight="bold" font-size="14" fill="#21513B">${appHeaderRight}</text>

  <!-- Screen Body Content -->
  <g transform="translate(84, 390)">
    ${bodyContent}
  </g>
</svg>`;
}

// ============================================================================
// SCREENSHOT 1: STARTSIDA (1080 x 1920)
// ============================================================================
const screen1Svg = createPhoneScreenshotSvg({
  badge: 'HELA VARDAGEN SAMORDNAD',
  headline: 'Välkommen till din dag',
  subline: 'Agenda, Göteborgsväder, uppgifter och familjens favoriter',
  appHeaderRight: 'Delar (2)',
  bodyContent: `
    <!-- Hero Banner Card -->
    <rect x="0" y="0" width="912" height="280" rx="34" fill="#183D2C" />
    <text x="38" y="52" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#A6F2C6">Måndag 19 oktober 2026 · Göteborg, Sverige</text>
    <text x="38" y="108" font-family="Liberation Sans" font-weight="bold" font-size="42" fill="#FFFFFF">Välkommen till din dag</text>
    <text x="38" y="150" font-family="Liberation Sans" font-size="21" fill="#CDE8D8">Dagens agenda, uppgifter och väderprognos.</text>
    <text x="38" y="238" font-family="Liberation Mono" font-weight="bold" font-size="52" fill="#FFFFFF">09:42</text>

    <!-- Weather Box inside Hero -->
    <rect x="560" y="34" width="318" height="212" rx="26" fill="#21513B" stroke="#8CE6B4" stroke-width="1.5" />
    <text x="590" y="76" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#A6F2C6">GÖTEBORG NU</text>
    <text x="590" y="142" font-family="Liberation Mono" font-weight="bold" font-size="60" fill="#FFFFFF">14°C</text>
    <text x="590" y="180" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#FFFFFF">Lätt molnighet</text>
    <text x="590" y="214" font-family="Liberation Sans" font-size="17" fill="#CDE8D8">Högst 16° · Lägst 9° · Vind 4 m/s</text>

    <!-- Upcoming Calendar Events Card -->
    <rect x="0" y="310" width="912" height="510" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="366" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#141E18">Kommande kalenderhändelser</text>
    <text x="36" y="398" font-family="Liberation Sans" font-size="19" fill="#54685C">Synkas direkt mellan familjens enheter</text>

    <!-- Event Row 1 -->
    <rect x="32" y="426" width="848" height="106" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="52" y="447" width="92" height="64" rx="16" fill="#0066FF" />
    <text x="98" y="487" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">16:30</text>
    <text x="168" y="472" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Förskolehämtning &amp; mellanmål</text>
    <text x="168" y="505" font-family="Liberation Mono" font-size="18" fill="#54685C">Idag · 16:30–17:30 · Familj</text>

    <!-- Event Row 2 -->
    <rect x="32" y="550" width="848" height="106" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="52" y="571" width="92" height="64" rx="16" fill="#059669" />
    <text x="98" y="611" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">18:00</text>
    <text x="168" y="596" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Träningspass i Slottsskogen</text>
    <text x="168" y="629" font-family="Liberation Mono" font-size="18" fill="#54685C">Idag · 18:00–19:00 · Träning &amp; Hälsa</text>

    <!-- Event Row 3 -->
    <rect x="32" y="674" width="848" height="106" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="52" y="695" width="92" height="64" rx="16" fill="#EA580C" />
    <text x="98" y="735" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="20" fill="#FFFFFF">Heldag</text>
    <text x="168" y="720" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Familjemiddag &amp; helgutflykt</text>
    <text x="168" y="753" font-family="Liberation Mono" font-size="18" fill="#54685C">Lördag · Heldag · Familj</text>

    <!-- Prioritized Tasks Card -->
    <rect x="0" y="850" width="912" height="560" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="906" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#141E18">Prioriterade uppgifter idag</text>
    <text x="36" y="938" font-family="Liberation Sans" font-size="19" fill="#54685C">Sorterade efter prioritet med valfri påminnelse</text>

    <!-- Task 1 -->
    <rect x="32" y="968" width="848" height="96" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="56" y="994" width="44" height="44" rx="12" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="124" y="1012" font-family="Liberation Sans" font-weight="bold" font-size="23" fill="#141E18">Beställa vinterdäck &amp; boka skifte</text>
    <text x="124" y="1042" font-family="Liberation Mono" font-size="17" fill="#9E2A2B">Hög prio · Hemmet · Påminnelse 14:00</text>

    <!-- Task 2 -->
    <rect x="32" y="1082" width="848" height="96" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="56" y="1108" width="44" height="44" rx="12" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="124" y="1126" font-family="Liberation Sans" font-weight="bold" font-size="23" fill="#141E18">Packa utflyktsryggsäck till imorgon</text>
    <text x="124" y="1156" font-family="Liberation Mono" font-size="17" fill="#54685C">Medel · Familj</text>

    <!-- Task 3 -->
    <rect x="32" y="1196" width="848" height="96" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="56" y="1222" width="44" height="44" rx="12" fill="#183D2C" />
    <path d="M68 1244 L75 1251 L89 1236" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <text x="124" y="1240" font-family="Liberation Sans" font-weight="bold" font-size="23" fill="#54685C">Betala månadsfaktura för bredband</text>
    <text x="124" y="1270" font-family="Liberation Mono" font-size="17" fill="#54685C">Klart · Ekonomi</text>
  `,
});

await renderSvgToPng(screen1Svg, 'Hem-Mobil-1-Startsida-1080x1920.png', 1080, 1920);

// ============================================================================
// SCREENSHOT 2: KALENDER MED VECKONUMMER & FÄRGADE PUNKTER (1080 x 1920)
// ============================================================================
let calendarGridRows = '';
const weeksData = [
  { w: 40, days: ['', '', '', 1, 2, 3, 4], dots: { 2: ['#0066FF'], 4: ['#059669', '#EA580C'] } },
  { w: 41, days: [5, 6, 7, 8, 9, 10, 11], dots: { 6: ['#7C3AED'], 9: ['#0066FF'], 11: ['#059669'] } },
  { w: 42, days: [12, 13, 14, 15, 16, 17, 18], dots: { 14: ['#0066FF', '#059669'], 16: ['#E11D48'], 18: ['#EA580C'] } },
  { w: 43, days: [19, 20, 21, 22, 23, 24, 25], dots: { 19: ['#0066FF', '#059669', '#EA580C'], 22: ['#7C3AED'], 24: ['#059669'] }, selected: 19 },
  { w: 44, days: [26, 27, 28, 29, 30, 31, ''], dots: { 28: ['#0066FF'], 30: ['#EA580C', '#059669'] } },
];

weeksData.forEach((row, rIdx) => {
  const y = 240 + rIdx * 98;
  // Week number cell
  calendarGridRows += `
    <rect x="28" y="${y}" width="96" height="84" rx="18" fill="#EBF4EE" stroke="#D4E4DA" stroke-width="1.5" />
    <text x="76" y="${y + 34}" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="14" fill="#4E6357">v.</text>
    <text x="76" y="${y + 62}" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#183D2C">${row.w}</text>
  `;
  row.days.forEach((d, cIdx) => {
    const x = 136 + cIdx * 106;
    if (!d) {
      calendarGridRows += `<rect x="${x}" y="${y}" width="96" height="84" rx="18" fill="#F8FCF9" />`;
      return;
    }
    const isSel = row.selected === d;
    const bg = isSel ? '#183D2C' : '#F8FCF9';
    const txt = isSel ? '#FFFFFF' : '#141E18';
    calendarGridRows += `
      <rect x="${x}" y="${y}" width="96" height="84" rx="18" fill="${bg}" stroke="${isSel ? '#183D2C' : '#E2EEE7'}" stroke-width="1.5" />
      <text x="${x + 48}" y="${y + 38}" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="${txt}">${d}</text>
    `;
    const dots = row.dots[d] || [];
    dots.forEach((color, dIdx) => {
      const startX = x + 48 - ((dots.length - 1) * 16) / 2 + dIdx * 16;
      calendarGridRows += `<circle cx="${startX}" cy="${y + 64}" r="6" fill="${color}" stroke="${isSel ? '#FFFFFF' : 'none'}" stroke-width="1.5" />`;
    });
  });
});

const screen2Svg = createPhoneScreenshotSvg({
  badge: 'SVENSK FAMILJEKALENDER',
  headline: 'Veckonummer & tydlig överblick',
  subline: 'Svep för att byta månad · Håll inne på datum för ny händelse',
  appHeaderRight: 'Kalender delas',
  bodyContent: `
    <!-- Month Card -->
    <rect x="0" y="0" width="912" height="760" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="58" font-family="Liberation Sans" font-weight="bold" font-size="32" fill="#141E18">Oktober 2026</text>
    <text x="34" y="90" font-family="Liberation Sans" font-size="18" fill="#54685C">Håll inne på ett datum för att lägga till händelse · Svep i sidled</text>

    <!-- View Mode Toggle -->
    <rect x="610" y="28" width="270" height="54" rx="18" fill="#EBF3EE" />
    <rect x="616" y="34" width="130" height="42" rx="14" fill="#183D2C" />
    <text x="681" y="61" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#FFFFFF">Månadsvy</text>
    <text x="812" y="61" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#38493F">Veckovy</text>

    <!-- Category Legend -->
    <circle cx="44" cy="136" r="8" fill="#0066FF" />
    <text x="60" y="142" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#141E18">Arbete</text>
    <circle cx="154" cy="136" r="8" fill="#059669" />
    <text x="170" y="142" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#141E18">Familj &amp; Hem</text>
    <circle cx="314" cy="136" r="8" fill="#EA580C" />
    <text x="330" y="142" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#141E18">Träning</text>
    <circle cx="430" cy="136" r="8" fill="#7C3AED" />
    <text x="446" y="142" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#141E18">Fritid &amp; Vänner</text>

    <!-- Weekday Headers -->
    <text x="76" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#183D2C">Vecka</text>
    <text x="184" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Mån</text>
    <text x="290" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Tis</text>
    <text x="396" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Ons</text>
    <text x="502" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Tor</text>
    <text x="608" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Fre</text>
    <text x="714" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Lör</text>
    <text x="820" y="212" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#54685C">Sön</text>

    ${calendarGridRows}

    <!-- Selected Day Events Card -->
    <rect x="0" y="790" width="912" height="620" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="842" font-family="Liberation Mono" font-weight="bold" font-size="18" fill="#21513B">Valt datum · 2026-10-19 · Vecka 43</text>
    <text x="36" y="882" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#141E18">Händelser (3)</text>

    <rect x="700" y="832" width="176" height="52" rx="18" fill="#183D2C" />
    <text x="788" y="865" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#FFFFFF">+ Lägg till</text>

    <!-- Day Event 1 (Heldag) -->
    <rect x="32" y="914" width="848" height="136" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="54" y="942" width="106" height="64" rx="16" fill="#059669" />
    <text x="107" y="982" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="20" fill="#FFFFFF">Heldag</text>
    <text x="184" y="968" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Studiedag på skolan</text>
    <text x="184" y="1002" font-family="Liberation Mono" font-size="18" fill="#54685C">Heldag · Familj &amp; Hem · Ingen påminnelse</text>

    <!-- Day Event 2 (1 tim standardtid) -->
    <rect x="32" y="1070" width="848" height="136" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="54" y="1098" width="106" height="64" rx="16" fill="#0066FF" />
    <text x="107" y="1138" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">10:00</text>
    <text x="184" y="1124" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Projektmöte &amp; planering</text>
    <text x="184" y="1158" font-family="Liberation Mono" font-size="18" fill="#54685C">10:00–11:00 (1 tim) · Arbete · Kontoret</text>

    <!-- Day Event 3 -->
    <rect x="32" y="1226" width="848" height="136" rx="22" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="54" y="1254" width="106" height="64" rx="16" fill="#EA580C" />
    <text x="107" y="1294" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">18:00</text>
    <text x="184" y="1280" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Padelmatch med vänner</text>
    <text x="184" y="1314" font-family="Liberation Mono" font-size="18" fill="#54685C">18:00–19:00 · Träning · Notis 30 min före</text>
  `,
});

await renderSvgToPng(screen2Svg, 'Hem-Mobil-2-Kalender-1080x1920.png', 1080, 1920);

// ============================================================================
// SCREENSHOT 3: SMART INKÖPSLISTA (1080 x 1920)
// ============================================================================
const screen3Svg = createPhoneScreenshotSvg({
  badge: 'SMART SVENSK INKÖPSLISTA',
  headline: 'Sorteras automatiskt efter butik',
  subline: 'Lägg till varor från telefonen — syns direkt på surfplattan & hos familjen',
  appHeaderRight: 'Inköp delas',
  bodyContent: `
    <!-- Quick Add Bar -->
    <rect x="0" y="0" width="912" height="168" rx="30" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="48" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Lägg till vara (sorteras automatiskt i rätt avdelning)</text>
    <rect x="34" y="68" width="640" height="72" rx="20" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="2" />
    <text x="60" y="112" font-family="Liberation Sans" font-size="22" fill="#54685C">t.ex. Ekologisk mjölk, Avokado, Olivolja...</text>
    <rect x="692" y="68" width="186" height="72" rx="20" fill="#183D2C" />
    <text x="785" y="112" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FFFFFF">+ Lägg till</text>

    <!-- Category 1: Frukt & Grönt -->
    <rect x="0" y="196" width="912" height="390" rx="30" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <rect x="34" y="224" width="240" height="40" rx="12" fill="#E4F3EA" />
    <text x="54" y="251" font-family="Liberation Sans" font-weight="bold" font-size="19" fill="#183D2C">FRUKT &amp; GRÖNT (3)</text>

    <rect x="34" y="282" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="304" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="333" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Avokado mogen</text>
    <text x="840" y="333" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">3 st</text>

    <rect x="34" y="380" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="402" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="431" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Svenska äpplen Ingrid Marie</text>
    <text x="840" y="431" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">6 st</text>

    <rect x="34" y="478" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="500" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="529" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Färsk basilika &amp; körsbärstomater</text>
    <text x="840" y="529" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">2 förp</text>

    <!-- Category 2: Mejeri, Ost & Ägg -->
    <rect x="0" y="614" width="912" height="390" rx="30" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <rect x="34" y="642" width="270" height="40" rx="12" fill="#DBEAFE" />
    <text x="54" y="669" font-family="Liberation Sans" font-weight="bold" font-size="19" fill="#1E3A8A">MEJERI, OST &amp; ÄGG (3)</text>

    <rect x="34" y="700" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="722" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="751" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Mellanmjölk ekologisk</text>
    <text x="840" y="751" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">2 liter</text>

    <rect x="34" y="798" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="820" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="849" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Västerbottensost vällagrad</text>
    <text x="840" y="849" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">1 st</text>

    <rect x="34" y="896" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="918" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="947" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Frigående ägg 12-pack</text>
    <text x="840" y="947" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">1 förp</text>

    <!-- Category 3: Bröd & Bageri -->
    <rect x="0" y="1032" width="912" height="378" rx="30" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <rect x="34" y="1060" width="250" height="40" rx="12" fill="#FEF3C7" />
    <text x="54" y="1087" font-family="Liberation Sans" font-weight="bold" font-size="19" fill="#78350F">BRÖD &amp; BAGERI (2)</text>

    <rect x="34" y="1118" width="844" height="84" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="56" y="1140" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#183D2C" stroke-width="3" />
    <text x="120" y="1169" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Surdegsbröd Levain</text>
    <text x="840" y="1169" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#21513B">1 st</text>

    <rect x="34" y="1216" width="844" height="84" rx="20" fill="#EBF3EE" stroke="#DCEAE1" />
    <rect x="56" y="1238" width="40" height="40" rx="10" fill="#183D2C" />
    <path d="M66 1258 L73 1265 L86 1251" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="120" y="1267" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#54685C">Knäckebröd Leksands</text>
    <text x="840" y="1267" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#54685C">Klart</text>
  `,
});

await renderSvgToPng(screen3Svg, 'Hem-Mobil-3-Inkop-1080x1920.png', 1080, 1920);

// ============================================================================
// SCREENSHOT 4: BILDER & ALBUM + DELNING PER SIDA (1080 x 1920)
// ============================================================================
const screen4Svg = createPhoneScreenshotSvg({
  badge: 'BILDER & FLEXIBEL DELNING',
  headline: 'Dela album & styr varje sida',
  subline: 'Kommentera, reagera med emojis och välj exakt vad du delar med vem',
  appHeaderRight: 'Bilder delas',
  bodyContent: `
    <!-- Album Filter Bar -->
    <rect x="0" y="0" width="912" height="700" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="56" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#141E18">Bilder &amp; Familjealbum</text>
    <rect x="650" y="24" width="228" height="52" rx="18" fill="#183D2C" />
    <text x="764" y="57" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#FFFFFF">+ Ladda upp bild</text>

    <!-- Album Tabs -->
    <rect x="36" y="84" width="160" height="44" rx="14" fill="#183D2C" />
    <text x="116" y="112" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#FFFFFF">Alla bilder (12)</text>
    <rect x="210" y="84" width="210" height="44" rx="14" fill="#EBF3EE" />
    <text x="315" y="112" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#183D2C">Västkusten (5)</text>
    <rect x="434" y="84" width="190" height="44" rx="14" fill="#EBF3EE" />
    <text x="529" y="112" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#183D2C">Familj &amp; Hem (7)</text>

    <!-- Photo Card 1 -->
    <rect x="36" y="150" width="408" height="516" rx="24" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="36" y="150" width="408" height="270" rx="24" fill="#1D5B79" />
    <circle cx="110" cy="210" r="28" fill="#FDE68A" />
    <path d="M36 360 Q150 300 260 355 T444 340 L444 420 L36 420 Z" fill="#183D2C" />
    <text x="56" y="458" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Solnedgång vid Saltholmen</text>
    <text x="56" y="488" font-family="Liberation Sans" font-size="16" fill="#54685C">Uppladdad av Filip · Album: Västkusten</text>
    <rect x="56" y="508" width="174" height="36" rx="18" fill="#E4F3EA" />
    <path d="M78 523 C78 519 73 517 70 521 C67 517 62 519 62 523 C62 528 70 533 70 533 C70 533 78 528 78 523 Z" fill="#E11D48" />
    <text x="86" y="531" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#183D2C">6 reaktioner · 2 svar</text>
    <text x="56" y="580" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#183D2C">Maja:</text>
    <text x="108" y="580" font-family="Liberation Sans" font-size="16" fill="#38493F">Så fin kväll vid havet!</text>
    <text x="56" y="636" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#21513B">Tryck för helskärm &amp; nedladdning →</text>

    <!-- Photo Card 2 -->
    <rect x="468" y="150" width="408" height="516" rx="24" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <rect x="468" y="150" width="408" height="270" rx="24" fill="#21513B" />
    <circle cx="672" cy="275" r="64" fill="#A6F2C6" opacity="0.25" />
    <path d="M580 350 L672 230 L764 350 Z" fill="#A6F2C6" />
    <text x="488" y="458" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Nygräddade kanelbullar hemma</text>
    <text x="488" y="488" font-family="Liberation Sans" font-size="16" fill="#54685C">Uppladdad av Maja · Album: Familj &amp; Hem</text>
    <rect x="488" y="508" width="174" height="36" rx="18" fill="#E4F3EA" />
    <path d="M510 523 C510 519 505 517 502 521 C499 517 494 519 494 523 C494 528 502 533 502 533 C502 533 510 528 510 523 Z" fill="#E11D48" />
    <text x="518" y="531" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#183D2C">5 reaktioner · 3 svar</text>
    <text x="488" y="580" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#183D2C">Filip:</text>
    <text x="536" y="580" font-family="Liberation Sans" font-size="16" fill="#38493F">Bästa fikat i år!</text>
    <text x="488" y="636" font-family="Liberation Sans" font-weight="bold" font-size="15" fill="#21513B">Tryck för helskärm &amp; nedladdning →</text>

    <!-- Per-Page Sharing Control Card -->
    <rect x="0" y="730" width="912" height="680" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="786" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#141E18">Delningsinställningar per person &amp; sida</text>
    <text x="36" y="818" font-family="Liberation Sans" font-size="18" fill="#54685C">Slå på eller av exakt vilka sidor du vill dela med varje familjemedlem eller vän</text>

    <!-- Person 1: Maja (Familj - Delar allt) -->
    <rect x="34" y="846" width="844" height="250" rx="24" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="1.5" />
    <circle cx="80" cy="896" r="28" fill="#059669" />
    <text x="80" y="905" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FFFFFF">M</text>
    <text x="124" y="892" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Maja Carlberg (Partner)</text>
    <text x="124" y="918" font-family="Liberation Sans" font-size="16" fill="#21513B">Delar 7 av 7 sidor i realtid</text>

    <!-- Switches Row for Maja -->
    <rect x="54" y="944" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="74" y="979" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Kalender</text>
    <rect x="242" y="958" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="280" cy="972" r="10" fill="#FFFFFF" />

    <rect x="328" y="944" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="348" y="979" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Inköpslista</text>
    <rect x="516" y="958" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="554" cy="972" r="10" fill="#FFFFFF" />

    <rect x="602" y="944" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="622" y="979" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Bilder &amp; Album</text>
    <rect x="790" y="958" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="828" cy="972" r="10" fill="#FFFFFF" />

    <rect x="54" y="1014" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="74" y="1049" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Att göra</text>
    <rect x="242" y="1028" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="280" cy="1042" r="10" fill="#FFFFFF" />

    <rect x="328" y="1014" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="348" y="1049" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Månadsbudget</text>
    <rect x="516" y="1028" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="554" cy="1042" r="10" fill="#FFFFFF" />

    <rect x="602" y="1014" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="622" y="1049" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#141E18">Recept &amp; Noter</text>
    <rect x="790" y="1028" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="828" cy="1042" r="10" fill="#FFFFFF" />

    <!-- Person 2: Mormor / Vän (Delar endast Bilder) -->
    <rect x="34" y="1120" width="844" height="256" rx="24" fill="#F6FBF7" stroke="#CDE0D4" stroke-width="1.5" />
    <circle cx="80" cy="1170" r="28" fill="#7C3AED" />
    <text x="80" y="1179" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FFFFFF">K</text>
    <text x="124" y="1166" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Karin (Mormor)</text>
    <text x="124" y="1192" font-family="Liberation Sans" font-size="16" fill="#54685C">Delar endast Bilder &amp; Album — övriga sidor är privata</text>

    <rect x="54" y="1220" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="74" y="1255" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#54685C">Kalender (Privat)</text>
    <rect x="242" y="1234" width="52" height="28" rx="14" fill="#CBDAD1" /><circle cx="256" cy="1248" r="10" fill="#FFFFFF" />

    <rect x="328" y="1220" width="256" height="56" rx="14" fill="#FFFFFF" stroke="#DCEAE1" />
    <text x="348" y="1255" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#54685C">Inköp (Privat)</text>
    <rect x="516" y="1234" width="52" height="28" rx="14" fill="#CBDAD1" /><circle cx="530" cy="1248" r="10" fill="#FFFFFF" />

    <rect x="602" y="1220" width="256" height="56" rx="14" fill="#E4F3EA" stroke="#183D2C" stroke-width="1.5" />
    <text x="622" y="1255" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#183D2C">Bilder &amp; Album</text>
    <rect x="790" y="1234" width="52" height="28" rx="14" fill="#183D2C" /><circle cx="828" cy="1248" r="10" fill="#FFFFFF" />
  `,
});

await renderSvgToPng(screen4Svg, 'Hem-Mobil-4-Bilder-Delning-1080x1920.png', 1080, 1920);

// ============================================================================
// SCREENSHOT 5: MÅNADSBUDGET & RECEPT (1080 x 1920)
// ============================================================================
const screen5Svg = createPhoneScreenshotSvg({
  badge: 'EKONOMI & MATPLANERING',
  headline: 'Månadsbudget & familjerecept',
  subline: 'Full koll på hushållsekonomin och skicka receptingredienser direkt till inköp',
  appHeaderRight: 'Delar (2)',
  bodyContent: `
    <!-- Budget Summary Card -->
    <rect x="0" y="0" width="912" height="690" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="56" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#141E18">Månadsbudget · Oktober 2026</text>
    <text x="36" y="88" font-family="Liberation Sans" font-size="18" fill="#54685C">Inbyggd miniräknare och återkommande poster</text>

    <!-- 3 Summary Boxes -->
    <rect x="34" y="116" width="268" height="132" rx="22" fill="#E4F3EA" />
    <text x="56" y="156" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#21513B">INKOMSTER</text>
    <text x="56" y="212" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#183D2C">64 500 kr</text>

    <rect x="322" y="116" width="268" height="132" rx="22" fill="#FFE4E6" />
    <text x="344" y="156" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#881337">UTGIFTER</text>
    <text x="344" y="212" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#9E2A2B">38 200 kr</text>

    <rect x="610" y="116" width="268" height="132" rx="22" fill="#183D2C" />
    <text x="632" y="156" font-family="Liberation Sans" font-weight="bold" font-size="17" fill="#A6F2C6">KVAR ATT LEVA PÅ</text>
    <text x="632" y="212" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#FFFFFF">+26 300 kr</text>

    <!-- Budget Rows -->
    <rect x="34" y="276" width="844" height="84" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="326" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Boende &amp; Bolån</text>
    <text x="480" y="326" font-family="Liberation Sans" font-size="18" fill="#54685C">Den 28:e varje månad</text>
    <text x="846" y="326" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#9E2A2B">-14 800 kr</text>

    <rect x="34" y="374" width="844" height="84" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="424" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Mat &amp; Dagligvaror</text>
    <text x="480" y="424" font-family="Liberation Sans" font-size="18" fill="#54685C">Hushållskonto</text>
    <text x="846" y="424" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#9E2A2B">-7 500 kr</text>

    <rect x="34" y="472" width="844" height="84" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="522" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Sparande &amp; Buffert</text>
    <text x="480" y="522" font-family="Liberation Sans" font-size="18" fill="#54685C">Automatisk överföring</text>
    <text x="846" y="522" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#059669">8 000 kr</text>

    <rect x="34" y="570" width="844" height="84" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="620" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Förskola &amp; Fritidsaktiviteter</text>
    <text x="480" y="620" font-family="Liberation Sans" font-size="18" fill="#54685C">Familj</text>
    <text x="846" y="620" text-anchor="end" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#9E2A2B">-1 650 kr</text>

    <!-- Recipes Card -->
    <rect x="0" y="720" width="912" height="690" rx="34" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="36" y="776" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#141E18">Receptsamling &amp; Matplanering</text>
    <text x="36" y="808" font-family="Liberation Sans" font-size="18" fill="#54685C">Importera från länk, fota kokbok eller skapa egna favoritrecept</text>

    <rect x="34" y="838" width="844" height="250" rx="24" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <text x="64" y="890" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#141E18">Krämig citronpasta med sparris &amp; parmesan</text>
    <text x="64" y="924" font-family="Liberation Mono" font-size="18" fill="#21513B">25 min · 4 portioner · Betyg 5/5</text>
    <text x="64" y="966" font-family="Liberation Sans" font-size="19" fill="#38493F">Snabb vardagsfavorit med färsk citron, vitlök, grädde och rostade pinjenötter.</text>
    <rect x="64" y="1000" width="380" height="58" rx="16" fill="#183D2C" />
    <text x="254" y="1036" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#FFFFFF">+ Skicka 6 varor till inköpslistan</text>

    <rect x="34" y="1112" width="844" height="250" rx="24" fill="#F6FBF7" stroke="#DCEAE1" stroke-width="1.5" />
    <text x="64" y="1164" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#141E18">Göteborgsk fiskgryta med saffran &amp; aioli</text>
    <text x="64" y="1198" font-family="Liberation Mono" font-size="18" fill="#21513B">35 min · 4 portioner · Betyg 5/5</text>
    <text x="64" y="1240" font-family="Liberation Sans" font-size="19" fill="#38493F">Mustig fisk- och skaldjursgryta med torskrygg, lax, fänkål och handskalade räkor.</text>
    <rect x="64" y="1274" width="380" height="58" rx="16" fill="#183D2C" />
    <text x="254" y="1310" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#FFFFFF">+ Skicka 8 varor till inköpslistan</text>
  `,
});

await renderSvgToPng(screen5Svg, 'Hem-Mobil-5-Budget-Recept-1080x1920.png', 1080, 1920);

// ============================================================================
// TABLET SCREENSHOT 1 (1920 x 1080) — 7" & 10" Surfplatta
// ============================================================================
const tablet1Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1920" height="1080" fill="#183D2C" />

  <!-- Top Header Banner -->
  <text x="960" y="64" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="36" fill="#FFFFFF">Hem — Synkroniserad mellan telefon &amp; surfplatta i realtid</text>

  <!-- Tablet App Window -->
  <rect x="60" y="96" width="1800" height="930" rx="36" fill="#F6FBF7" stroke="#8CE6B4" stroke-width="3" />

  <!-- Top Navigation inside App -->
  <rect x="62" y="98" width="1796" height="84" rx="34" fill="#F6FBF7" />
  <rect x="62" y="182" width="1796" height="2" fill="#D8E6DD" />
  <rect x="98" y="116" width="48" height="48" rx="12" fill="#183D2C" />
  <path d="M122 126 L106 139 H111 V154 H118 V145 H126 V154 H133 V139 H138 Z" fill="#A6F2C6" />
  <text x="162" y="150" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#183D2C">Hem</text>

  <rect x="1560" y="116" width="260" height="48" rx="24" fill="#FFFFFF" stroke="#CDE0D4" stroke-width="2" />
  <text x="1690" y="146" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#183D2C">Filip · Surfplatta (Delar)</text>

  <!-- Left Column: Hero + Calendar -->
  <g transform="translate(98, 212)">
    <rect x="0" y="0" width="1020" height="230" rx="28" fill="#183D2C" />
    <text x="36" y="50" font-family="Liberation Sans" font-weight="bold" font-size="18" fill="#A6F2C6">Måndag 19 oktober 2026 · Göteborg</text>
    <text x="36" y="102" font-family="Liberation Sans" font-weight="bold" font-size="40" fill="#FFFFFF">Välkommen till din dag</text>
    <text x="36" y="146" font-family="Liberation Sans" font-size="20" fill="#CDE8D8">Överblick för hela familjen på surfplattan i köket eller vardagsrummet.</text>
    <text x="36" y="202" font-family="Liberation Mono" font-weight="bold" font-size="36" fill="#A6F2C6">14°C · Lätt molnighet i Göteborg</text>

    <!-- Calendar & Tasks Split -->
    <rect x="0" y="254" width="500" height="540" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="30" y="304" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Kommande händelser</text>

    <rect x="26" y="330" width="448" height="96" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="42" y="348" width="76" height="60" rx="14" fill="#0066FF" />
    <text x="80" y="385" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="18" fill="#FFFFFF">16:30</text>
    <text x="136" y="372" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">Förskolehämtning</text>
    <text x="136" y="400" font-family="Liberation Mono" font-size="15" fill="#54685C">Idag · 16:30–17:30 · Familj</text>

    <rect x="26" y="442" width="448" height="96" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="42" y="460" width="76" height="60" rx="14" fill="#059669" />
    <text x="80" y="497" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="18" fill="#FFFFFF">18:00</text>
    <text x="136" y="484" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">Fotbollsträning</text>
    <text x="136" y="512" font-family="Liberation Mono" font-size="15" fill="#54685C">Idag · 18:00–19:00 · Slottsskogen</text>

    <rect x="26" y="554" width="448" height="96" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <rect x="42" y="572" width="76" height="60" rx="14" fill="#EA580C" />
    <text x="80" y="609" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="17" fill="#FFFFFF">Heldag</text>
    <text x="136" y="596" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">Utflykt till Marstrand</text>
    <text x="136" y="624" font-family="Liberation Mono" font-size="15" fill="#54685C">Lördag · Heldag · Familj</text>

    <!-- Tasks Column -->
    <rect x="520" y="254" width="500" height="540" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="550" y="304" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#141E18">Prioriterade uppgifter</text>

    <rect x="546" y="330" width="448" height="86" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="574" y="370" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">• Boka däckskifte</text>
    <text x="574" y="398" font-family="Liberation Mono" font-size="15" fill="#9E2A2B">Hög prio · Påminnelse 14:00</text>

    <rect x="546" y="430" width="448" height="86" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="574" y="470" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">• Handla inför fredagsmys</text>
    <text x="574" y="498" font-family="Liberation Mono" font-size="15" fill="#21513B">Medel · Familj</text>

    <rect x="546" y="530" width="448" height="86" rx="18" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="574" y="570" font-family="Liberation Sans" font-weight="bold" font-size="20" fill="#141E18">• Ladda upp bilder från helgen</text>
    <text x="574" y="598" font-family="Liberation Mono" font-size="15" fill="#54685C">Bilder &amp; Album</text>
  </g>

  <!-- Right Column: Shopping & Photos -->
  <g transform="translate(1144, 212)">
    <rect x="0" y="0" width="678" height="794" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="52" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#141E18">Delad Inköpslista &amp; Familjealbum</text>
    <text x="34" y="84" font-family="Liberation Sans" font-size="18" fill="#54685C">Enhetsbaserade notiser mellan telefon och surfplatta</text>

    <rect x="34" y="112" width="610" height="74" rx="16" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="157" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Avokado mogen (3 st) · Frukt &amp; Grönt</text>

    <rect x="34" y="200" width="610" height="74" rx="16" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="245" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Ekologisk mellanmjölk (2 l) · Mejeri</text>

    <rect x="34" y="288" width="610" height="74" rx="16" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="333" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Surdegsbröd Levain (1 st) · Bageri</text>

    <rect x="34" y="392" width="610" height="368" rx="24" fill="#183D2C" />
    <text x="64" y="446" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#A6F2C6">Bilder &amp; Album · Delning per sida</text>
    <text x="64" y="492" font-family="Liberation Sans" font-size="20" fill="#FFFFFF">• Ladda upp bilder, skapa album &amp; kommentera med emojis</text>
    <text x="64" y="534" font-family="Liberation Sans" font-size="20" fill="#FFFFFF">• Öppna i helskärm &amp; ladda ner i originalkvalitet</text>
    <text x="64" y="576" font-family="Liberation Sans" font-size="20" fill="#FFFFFF">• Välj med switchar vilka sidor varje person får se</text>
    <text x="64" y="618" font-family="Liberation Sans" font-size="20" fill="#FFFFFF">• Privata sidor har hänglås och sparas bara för dig</text>
  </g>
</svg>`;

await renderSvgToPng(tablet1Svg, 'Hem-Surfplatta-1-Oversikt-1920x1080.png', 1920, 1080);

// Create a सेकंड tablet screenshot (1920 x 1080) so Play Console's "minst 2 bilder för surfplatta (7 & 10 tum)" requirement is 100% met!
const tablet2Svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1920" height="1080" fill="#183D2C" />

  <text x="960" y="64" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="36" fill="#FFFFFF">Kalender med veckonummer, Månadsbudget &amp; Flexibel delning per sida</text>

  <rect x="60" y="96" width="1800" height="930" rx="36" fill="#F6FBF7" stroke="#8CE6B4" stroke-width="3" />
  <rect x="62" y="98" width="1796" height="84" rx="34" fill="#F6FBF7" />
  <rect x="62" y="182" width="1796" height="2" fill="#D8E6DD" />
  <rect x="98" y="116" width="48" height="48" rx="12" fill="#183D2C" />
  <path d="M122 126 L106 139 H111 V154 H118 V145 H126 V154 H133 V139 H138 Z" fill="#A6F2C6" />
  <text x="162" y="150" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#183D2C">Hem · Kalender &amp; Delning</text>

  <!-- Left Half: Calendar Grid -->
  <g transform="translate(98, 206)">
    <rect x="0" y="0" width="860" height="780" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="54" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#141E18">Oktober 2026 · Veckonummer &amp; Färgpunkter</text>
    <text x="34" y="86" font-family="Liberation Sans" font-size="18" fill="#54685C">Svep för att byta månad · Håll inne på datum för att skapa händelse</text>
    <g transform="translate(0, -60) scale(0.94)">
      ${calendarGridRows}
    </g>
  </g>

  <!-- Right Half: Per-Page Sharing & Budget -->
  <g transform="translate(988, 206)">
    <rect x="0" y="0" width="834" height="376" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="52" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#141E18">Dela valfria sidor med familj &amp; vänner</text>
    <text x="34" y="84" font-family="Liberation Sans" font-size="18" fill="#54685C">Välj med switchar vad varje person i din krets ser</text>

    <rect x="34" y="110" width="766" height="112" rx="20" fill="#F6FBF7" stroke="#CDE0D4" />
    <circle cx="82" cy="166" r="28" fill="#059669" />
    <text x="82" y="175" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FFFFFF">M</text>
    <text x="128" y="158" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Maja Carlberg (Partner)</text>
    <text x="128" y="188" font-family="Liberation Sans" font-size="17" fill="#21513B">Delar Kalender, Inköp, Bilder, Att göra, Recept &amp; Budget</text>

    <rect x="34" y="238" width="766" height="112" rx="20" fill="#F6FBF7" stroke="#CDE0D4" />
    <circle cx="82" cy="294" r="28" fill="#7C3AED" />
    <text x="82" y="303" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FFFFFF">K</text>
    <text x="128" y="286" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#141E18">Karin (Mormor)</text>
    <text x="128" y="316" font-family="Liberation Sans" font-size="17" fill="#54685C">Delar endast Bilder &amp; Album — övriga sidor är privata</text>

    <rect x="0" y="400" width="834" height="380" rx="28" fill="#FFFFFF" stroke="#D8E6DD" stroke-width="2" />
    <text x="34" y="452" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#141E18">Månadsbudget · Oktober 2026</text>
    <rect x="34" y="482" width="240" height="116" rx="20" fill="#E4F3EA" />
    <text x="54" y="518" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#21513B">INKOMSTER</text>
    <text x="54" y="572" font-family="Liberation Mono" font-weight="bold" font-size="30" fill="#183D2C">64 500 kr</text>

    <rect x="296" y="482" width="240" height="116" rx="20" fill="#FFE4E6" />
    <text x="316" y="518" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#881337">UTGIFTER</text>
    <text x="316" y="572" font-family="Liberation Mono" font-weight="bold" font-size="30" fill="#9E2A2B">38 200 kr</text>

    <rect x="558" y="482" width="242" height="116" rx="20" fill="#183D2C" />
    <text x="578" y="518" font-family="Liberation Sans" font-weight="bold" font-size="16" fill="#A6F2C6">KVAR ATT LEVA PÅ</text>
    <text x="578" y="572" font-family="Liberation Mono" font-weight="bold" font-size="30" fill="#FFFFFF">+26 300 kr</text>

    <rect x="34" y="622" width="766" height="126" rx="20" fill="#F6FBF7" stroke="#DCEAE1" />
    <text x="60" y="670" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#141E18">Full kontroll på boende, mat, sparande &amp; fasta utgifter</text>
    <text x="60" y="706" font-family="Liberation Sans" font-size="18" fill="#54685C">Kopiera fasta poster till nästa månad med ett tryck och räkna direkt med miniräknaren.</text>
  </g>
</svg>`;

await renderSvgToPng(tablet2Svg, 'Hem-Surfplatta-2-Kalender-Budget-1920x1080.png', 1920, 1080);

// ============================================================================
// WEAR OS SCREENSHOTS (1080 x 1080 — 1:1 Square, 24-bit RGB, Circular-Safe UI)
// ============================================================================

async function renderWearSvgToPng(svgContent, pngFilename) {
  const outPng = path.join(outDir, pngFilename);
  const safeSvg = svgContent.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  await sharp(Buffer.from(safeSvg, 'utf8'), { density: 144 })
    .resize(1080, 1080)
    .flatten({ background: '#08110C' })
    .png({ compressionLevel: 9 })
    .toFile(outPng);
  console.log(`Generated ${pngFilename} (1080x1080)`);
}

// Wear OS 1: Inköpslista (M3 Expressive Watch App)
const wear1ShoppingSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wearBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#11261B" />
      <stop offset="100%" stop-color="#08110C" />
    </radialGradient>
  </defs>

  <!-- Full-bleed dark watch background (no hardware bezel, circular-safe content inside r=490) -->
  <rect width="1080" height="1080" fill="url(#wearBg)" />

  <!-- Top curved time & brand header -->
  <text x="540" y="102" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#B7D7C5">09:42</text>
  <text x="540" y="148" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#A6F2C6" letter-spacing="2">HEM · INKÖPSLISTA</text>

  <!-- M3 Expressive Segmented Navigation Pills -->
  <g transform="translate(150, 174)">
    <rect x="0" y="0" width="248" height="74" rx="37" fill="#A6F2C6" />
    <text x="124" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#082014">Inköp (4)</text>

    <rect x="264" y="0" width="248" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="388" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Kalender</text>

    <rect x="528" y="0" width="252" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="654" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Att göra</text>
  </g>

  <!-- Quick Add Action Pill (+ Ny vara) -->
  <g transform="translate(240, 272)">
    <rect x="0" y="0" width="600" height="84" rx="42" fill="#183D2C" stroke="#8CE6B4" stroke-width="2.5" />
    <circle cx="52" cy="42" r="24" fill="#A6F2C6" />
    <text x="52" y="52" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="32" fill="#082014">+</text>
    <text x="326" y="52" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#FFFFFF">Lägg till ny vara</text>
  </g>

  <!-- Item 1 -->
  <g transform="translate(130, 380)">
    <rect x="0" y="0" width="820" height="132" rx="66" fill="#152C20" stroke="#28533D" stroke-width="2.5" />
    <circle cx="72" cy="66" r="28" fill="#0D1E15" stroke="#A6F2C6" stroke-width="4" />
    <text x="128" y="58" font-family="Liberation Sans" font-weight="bold" font-size="31" fill="#FFFFFF">Avokado mogen</text>
    <text x="128" y="96" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#8CE6B4">Frukt &amp; Grönt · 3 st</text>
    <rect x="668" y="38" width="116" height="56" rx="28" fill="#1E4633" />
    <text x="726" y="74" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="24" fill="#A6F2C6">3 st</text>
  </g>

  <!-- Item 2 -->
  <g transform="translate(130, 530)">
    <rect x="0" y="0" width="820" height="132" rx="66" fill="#152C20" stroke="#28533D" stroke-width="2.5" />
    <circle cx="72" cy="66" r="28" fill="#0D1E15" stroke="#A6F2C6" stroke-width="4" />
    <text x="128" y="58" font-family="Liberation Sans" font-weight="bold" font-size="31" fill="#FFFFFF">Ekologisk mellanmjölk</text>
    <text x="128" y="96" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#93C5FD">Mejeri, Ost &amp; Ägg · 2 liter</text>
    <rect x="668" y="38" width="116" height="56" rx="28" fill="#1E4633" />
    <text x="726" y="74" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="24" fill="#A6F2C6">2 l</text>
  </g>

  <!-- Item 3 -->
  <g transform="translate(155, 680)">
    <rect x="0" y="0" width="770" height="128" rx="64" fill="#152C20" stroke="#28533D" stroke-width="2.5" />
    <circle cx="70" cy="64" r="28" fill="#0D1E15" stroke="#A6F2C6" stroke-width="4" />
    <text x="124" y="56" font-family="Liberation Sans" font-weight="bold" font-size="30" fill="#FFFFFF">Surdegsbröd Levain</text>
    <text x="124" y="94" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#FDE68A">Bröd &amp; Bageri · 1 förp</text>
    <rect x="626" y="36" width="110" height="56" rx="28" fill="#1E4633" />
    <text x="681" y="72" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="23" fill="#A6F2C6">1 st</text>
  </g>

  <!-- Item 4 (Checked / Klart) -->
  <g transform="translate(230, 826)">
    <rect x="0" y="0" width="620" height="106" rx="53" fill="#0F2017" stroke="#1E3F2E" stroke-width="2" />
    <circle cx="60" cy="53" r="24" fill="#A6F2C6" />
    <path d="M49 53 L57 61 L72 45" fill="none" stroke="#082014" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="106" y="62" font-family="Liberation Sans" font-weight="bold" font-size="27" fill="#7FA691">Bryggkaffe Mellanrost (Klart)</text>
  </g>
</svg>`;

await renderWearSvgToPng(wear1ShoppingSvg, 'Hem-WearOS-1-Inkop-1080x1080.png');

// Wear OS 2: Kalender (M3 Expressive Watch App — Datum & tid överst, kategorifärger)
const wear2CalendarSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wearBg2" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#11261B" />
      <stop offset="100%" stop-color="#08110C" />
    </radialGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#wearBg2)" />

  <text x="540" y="102" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#B7D7C5">09:42</text>
  <text x="540" y="148" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#A6F2C6" letter-spacing="2">HEM · KALENDER (14 DAGAR)</text>

  <!-- M3 Expressive Segmented Navigation Pills -->
  <g transform="translate(150, 174)">
    <rect x="0" y="0" width="248" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="124" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Inköp</text>

    <rect x="264" y="0" width="248" height="74" rx="37" fill="#A6F2C6" />
    <text x="388" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#082014">Kalender</text>

    <rect x="528" y="0" width="252" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="654" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Att göra</text>
  </g>

  <!-- Event 1: Blue Category (Arbete / Jobb) - Date & Time on top, Event title below -->
  <g transform="translate(130, 278)">
    <rect x="0" y="0" width="820" height="176" rx="58" fill="#102742" stroke="#3B82F6" stroke-width="3" />
    <rect x="36" y="26" width="384" height="46" rx="23" fill="#2563EB" />
    <text x="228" y="56" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">IDAG 19 OKT · 08:00–16:30</text>
    <text x="774" y="58" text-anchor="end" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#93C5FD">ARBETE</text>
    <text x="42" y="122" font-family="Liberation Sans" font-weight="bold" font-size="36" fill="#FFFFFF">Jobb &amp; Projektmöte</text>
    <text x="42" y="154" font-family="Liberation Sans" font-size="22" fill="#BFDBFE">Kontoret · Synkad med familjen</text>
  </g>

  <!-- Event 2: Emerald Category (Familj) -->
  <g transform="translate(130, 476)">
    <rect x="0" y="0" width="820" height="176" rx="58" fill="#112E22" stroke="#10B981" stroke-width="3" />
    <rect x="36" y="26" width="384" height="46" rx="23" fill="#059669" />
    <text x="228" y="56" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">IDAG 19 OKT · 17:30–18:30</text>
    <text x="774" y="58" text-anchor="end" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#6EE7B7">FAMILJ</text>
    <text x="42" y="122" font-family="Liberation Sans" font-weight="bold" font-size="36" fill="#FFFFFF">Förskolehämtning &amp; fotboll</text>
    <text x="42" y="154" font-family="Liberation Sans" font-size="22" fill="#A7F3D0">Slottsskogen · Maja &amp; Filip</text>
  </g>

  <!-- Event 3: Orange Category (Heldag / Fritid) -->
  <g transform="translate(160, 674)">
    <rect x="0" y="0" width="760" height="176" rx="58" fill="#331B0E" stroke="#F97316" stroke-width="3" />
    <rect x="36" y="26" width="328" height="46" rx="23" fill="#EA580C" />
    <text x="200" y="56" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#FFFFFF">LÖR 24 OKT · HELDAG</text>
    <text x="716" y="58" text-anchor="end" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#FDBA74">HELDAG</text>
    <text x="42" y="122" font-family="Liberation Sans" font-weight="bold" font-size="34" fill="#FFFFFF">Höstutflykt med familjen</text>
    <text x="42" y="154" font-family="Liberation Sans" font-size="22" fill="#FED7AA">Marstrand · Heldagshändelse</text>
  </g>

  <!-- Bottom Pill Indicator -->
  <rect x="350" y="882" width="380" height="64" rx="32" fill="#162F22" stroke="#28533D" stroke-width="2" />
  <text x="540" y="923" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#A6F2C6">Visar 2 veckor framåt</text>
</svg>`;

await renderWearSvgToPng(wear2CalendarSvg, 'Hem-WearOS-2-Kalender-1080x1080.png');

// Wear OS 3: Att göra (M3 Expressive Watch App)
const wear3TodoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wearBg3" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#11261B" />
      <stop offset="100%" stop-color="#08110C" />
    </radialGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#wearBg3)" />

  <text x="540" y="102" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="34" fill="#B7D7C5">09:42</text>
  <text x="540" y="148" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="22" fill="#A6F2C6" letter-spacing="2">HEM · ATT GÖRA</text>

  <!-- M3 Expressive Segmented Navigation Pills -->
  <g transform="translate(150, 174)">
    <rect x="0" y="0" width="248" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="124" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Inköp</text>

    <rect x="264" y="0" width="248" height="74" rx="37" fill="#162F22" stroke="#28533D" stroke-width="2" />
    <text x="388" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="25" fill="#D5ECE0">Kalender</text>

    <rect x="528" y="0" width="252" height="74" rx="37" fill="#A6F2C6" />
    <text x="654" y="46" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="26" fill="#082014">Att göra (3)</text>
  </g>

  <!-- Quick Add Task Pill -->
  <g transform="translate(240, 272)">
    <rect x="0" y="0" width="600" height="84" rx="42" fill="#183D2C" stroke="#8CE6B4" stroke-width="2.5" />
    <circle cx="52" cy="42" r="24" fill="#A6F2C6" />
    <text x="52" y="52" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="32" fill="#082014">+</text>
    <text x="326" y="52" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="28" fill="#FFFFFF">Ny uppgift på klockan</text>
  </g>

  <!-- Task 1: High Priority -->
  <g transform="translate(130, 380)">
    <rect x="0" y="0" width="820" height="140" rx="70" fill="#152C20" stroke="#F87171" stroke-width="2.5" />
    <rect x="44" y="42" width="56" height="56" rx="18" fill="#0D1E15" stroke="#A6F2C6" stroke-width="4" />
    <text x="126" y="62" font-family="Liberation Sans" font-weight="bold" font-size="31" fill="#FFFFFF">Boka däckskifte &amp; vinterdäck</text>
    <rect x="126" y="78" width="150" height="38" rx="19" fill="#7F1D1D" />
    <text x="201" y="104" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="19" fill="#FECACA">HÖG PRIO</text>
    <text x="294" y="104" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#B7D7C5">Idag · Påminnelse 14:00</text>
  </g>

  <!-- Task 2: Medium Priority -->
  <g transform="translate(130, 540)">
    <rect x="0" y="0" width="820" height="140" rx="70" fill="#152C20" stroke="#28533D" stroke-width="2.5" />
    <rect x="44" y="42" width="56" height="56" rx="18" fill="#0D1E15" stroke="#A6F2C6" stroke-width="4" />
    <text x="126" y="62" font-family="Liberation Sans" font-weight="bold" font-size="31" fill="#FFFFFF">Packa utflyktsryggsäck</text>
    <rect x="126" y="78" width="140" height="38" rx="19" fill="#1E4633" />
    <text x="196" y="104" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="19" fill="#A6F2C6">FAMILJ</text>
    <text x="284" y="104" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#B7D7C5">Imorgon · Medelprio</text>
  </g>

  <!-- Task 3: Completed -->
  <g transform="translate(170, 700)">
    <rect x="0" y="0" width="740" height="130" rx="65" fill="#0F2017" stroke="#1E3F2E" stroke-width="2" />
    <rect x="42" y="39" width="52" height="52" rx="16" fill="#A6F2C6" />
    <path d="M55 65 L64 74 L81 55" fill="none" stroke="#082014" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="120" y="62" font-family="Liberation Sans" font-weight="bold" font-size="29" fill="#89B09B">Betala månadsfaktura bredband</text>
    <text x="120" y="98" font-family="Liberation Mono" font-weight="bold" font-size="21" fill="#5D8771">KLART · EKONOMI</text>
  </g>

  <text x="540" y="905" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="23" fill="#8CE6B4">Tryck på en ruta för att bocka av direkt</text>
</svg>`;

await renderWearSvgToPng(wear3TodoSvg, 'Hem-WearOS-3-AttGora-1080x1080.png');

// Wear OS 4: Wear OS Tile / Snabbpanel (M3 Expressive Tile)
const wear4TileSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wearBg4" cx="50%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#143022" />
      <stop offset="100%" stop-color="#08110C" />
    </radialGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#wearBg4)" />

  <!-- Top Tile Header -->
  <rect x="330" y="88" width="420" height="58" rx="29" fill="#162F22" stroke="#28533D" stroke-width="2" />
  <text x="540" y="126" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="24" fill="#A6F2C6" letter-spacing="1.5">WEAR OS-PANEL · HEM</text>

  <text x="540" y="210" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="42" fill="#FFFFFF">Inköp &amp; Dagens agenda</text>
  <text x="540" y="254" text-anchor="middle" font-family="Liberation Sans" font-size="24" fill="#B7D7C5">Svep åt sidan på urtavlan för snabbåtkomst</text>

  <!-- 2x2 Expressive Pill Grid -->
  <g transform="translate(116, 294)">
    <!-- Chip 1 -->
    <rect x="0" y="0" width="410" height="170" rx="56" fill="#183D2C" stroke="#8CE6B4" stroke-width="2.5" />
    <text x="44" y="64" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#A6F2C6">INKÖP · FRUKT &amp; GRÖNT</text>
    <text x="44" y="112" font-family="Liberation Sans" font-weight="bold" font-size="33" fill="#FFFFFF">Avokado (3 st)</text>
    <text x="44" y="146" font-family="Liberation Mono" font-size="21" fill="#CDE8D8">Tryck för att bocka av</text>

    <!-- Chip 2 -->
    <rect x="438" y="0" width="410" height="170" rx="56" fill="#183D2C" stroke="#8CE6B4" stroke-width="2.5" />
    <text x="482" y="64" font-family="Liberation Sans" font-weight="bold" font-size="21" fill="#A6F2C6">INKÖP · MEJERI</text>
    <text x="482" y="112" font-family="Liberation Sans" font-weight="bold" font-size="33" fill="#FFFFFF">Mellanmjölk (2 l)</text>
    <text x="482" y="146" font-family="Liberation Mono" font-size="21" fill="#CDE8D8">Tryck för att bocka av</text>

    <!-- Chip 3 (Calendar Event) -->
    <rect x="0" y="196" width="410" height="170" rx="56" fill="#102742" stroke="#3B82F6" stroke-width="2.5" />
    <text x="44" y="260" font-family="Liberation Mono" font-weight="bold" font-size="21" fill="#93C5FD">IDAG · 16:30–17:30</text>
    <text x="44" y="308" font-family="Liberation Sans" font-weight="bold" font-size="33" fill="#FFFFFF">Förskolehämtning</text>
    <text x="44" y="342" font-family="Liberation Sans" font-size="21" fill="#BFDBFE">Kalender · Familj</text>

    <!-- Chip 4 (Task) -->
    <rect x="438" y="196" width="410" height="170" rx="56" fill="#152C20" stroke="#28533D" stroke-width="2.5" />
    <text x="482" y="260" font-family="Liberation Mono" font-weight="bold" font-size="21" fill="#FCA5A5">ATT GÖRA · HÖG PRIO</text>
    <text x="482" y="308" font-family="Liberation Sans" font-weight="bold" font-size="33" fill="#FFFFFF">Boka däckskifte</text>
    <text x="482" y="342" font-family="Liberation Sans" font-size="21" fill="#B7D7C5">Påminnelse 14:00</text>
  </g>

  <!-- Bottom Expressive Primary Action Pill -->
  <g transform="translate(210, 716)">
    <rect x="0" y="0" width="660" height="114" rx="57" fill="#A6F2C6" />
    <text x="330" y="69" text-anchor="middle" font-family="Liberation Sans" font-weight="bold" font-size="34" fill="#082014">Öppna Hem på klockan →</text>
  </g>

  <text x="540" y="902" text-anchor="middle" font-family="Liberation Mono" font-weight="bold" font-size="22" fill="#8CE6B4">3 separata Wear OS-paneler ingår</text>
</svg>`;

await renderWearSvgToPng(wear4TileSvg, 'Hem-WearOS-4-Tile-Panel-1080x1080.png');

// Generate HTML gallery page in public/play-store/index.html
const galleryHtml = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Play Console — Bilder &amp; Funktionsbild för Hem</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F6FBF7;
      color: #141E18;
      padding: 32px 18px 64px;
    }
    .container { max-width: 1120px; margin: 0 auto; }
    .hero {
      background: #183D2C;
      color: #FFFFFF;
      padding: 28px 32px;
      border-radius: 24px;
      margin-bottom: 28px;
    }
    .hero h1 { margin: 0 0 8px; font-size: 28px; }
    .hero p { margin: 0; color: #D4EBE0; font-size: 15px; line-height: 1.5; }
    .section {
      background: #FFFFFF;
      border: 1px solid #CDE0D4;
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 6px 20px rgba(20, 30, 24, 0.04);
    }
    .section h2 { margin: 0 0 6px; font-size: 20px; color: #183D2C; }
    .section .spec { margin: 0 0 18px; font-size: 13px; color: #54685C; font-weight: 600; }
    .grid-phones {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .grid-watches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 16px;
    }
    .grid-tablets {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 18px;
    }
    .card {
      background: #F6FBF7;
      border: 1px solid #DCEAE1;
      border-radius: 16px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .card img {
      width: 100%;
      height: auto;
      border-radius: 10px;
      border: 1px solid #CDE0D4;
      display: block;
    }
    .card-title { font-size: 13px; font-weight: 700; color: #141E18; }
    .btn {
      display: inline-block;
      text-align: center;
      background: #183D2C;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: 12px;
    }
    .btn:hover { background: #0F291E; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>Google Play Console — Färdiga butiksbilder för Hem</h1>
      <p>Alla bilder nedan har exakt de pixelmått och det 24-bitars PNG-format (utan genomskinlighet) som Google Play Console kräver. Klicka på <strong>Ladda ner PNG</strong> under respektive bild för att spara den och ladda upp i Play Console.</p>
    </div>

    <div class="section">
      <h2>1. Skärmbilder för Wear OS / Klocka (4 st · 1080 × 1080 px, 1:1)</h2>
      <p class="spec">Krav i Play Console för Wear OS: Minst 2 bilder · 1:1 kvadratiskt format (minst 384 × 384 px, här 1080 × 1080 px) · 24-bit PNG utan genomskinlighet och utan klockram</p>
      <div class="grid-watches">
        <div class="card">
          <img src="Hem-WearOS-1-Inkop-1080x1080.png" alt="Wear OS Inköpslista" />
          <div class="card-title">1. Klocka — Inköpslista (1080×1080)</div>
          <a class="btn" href="Hem-WearOS-1-Inkop-1080x1080.png" download="Hem-WearOS-1-Inkop-1080x1080.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-WearOS-2-Kalender-1080x1080.png" alt="Wear OS Kalender" />
          <div class="card-title">2. Klocka — Kalender &amp; färger (1080×1080)</div>
          <a class="btn" href="Hem-WearOS-2-Kalender-1080x1080.png" download="Hem-WearOS-2-Kalender-1080x1080.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-WearOS-3-AttGora-1080x1080.png" alt="Wear OS Att göra" />
          <div class="card-title">3. Klocka — Att göra-lista (1080×1080)</div>
          <a class="btn" href="Hem-WearOS-3-AttGora-1080x1080.png" download="Hem-WearOS-3-AttGora-1080x1080.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-WearOS-4-Tile-Panel-1080x1080.png" alt="Wear OS Tile Panel" />
          <div class="card-title">4. Klocka — Wear OS-panel / Tile (1080×1080)</div>
          <a class="btn" href="Hem-WearOS-4-Tile-Panel-1080x1080.png" download="Hem-WearOS-4-Tile-Panel-1080x1080.png">Ladda ner PNG</a>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>2. Funktionsbild (Feature Graphic)</h2>
      <p class="spec">Krav i Play Console: 1024 × 500 px · 24-bit PNG (ingen alfa)</p>
      <div class="card" style="max-width: 680px;">
        <img src="Hem-Funktionsbild-1024x500.png" alt="Funktionsbild 1024x500" />
        <div class="card-title">Hem-Funktionsbild-1024x500.png (1024 × 500 px)</div>
        <a class="btn" href="Hem-Funktionsbild-1024x500.png" download="Hem-Funktionsbild-1024x500.png">Ladda ner Funktionsbild (1024×500 PNG)</a>
      </div>
    </div>

    <div class="section">
      <h2>3. Skärmbilder för Telefon (5 st med exempeldata)</h2>
      <p class="spec">Krav i Play Console: Minst 2–8 bilder · 1080 × 1920 px (9:16 stående) · PNG</p>
      <div class="grid-phones">
        <div class="card">
          <img src="Hem-Mobil-1-Startsida-1080x1920.png" alt="Startsida" />
          <div class="card-title">1. Startsida, agenda &amp; väder</div>
          <a class="btn" href="Hem-Mobil-1-Startsida-1080x1920.png" download="Hem-Mobil-1-Startsida-1080x1920.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-Mobil-2-Kalender-1080x1920.png" alt="Kalender" />
          <div class="card-title">2. Kalender &amp; veckonummer</div>
          <a class="btn" href="Hem-Mobil-2-Kalender-1080x1920.png" download="Hem-Mobil-2-Kalender-1080x1920.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-Mobil-3-Inkop-1080x1920.png" alt="Inköpslista" />
          <div class="card-title">3. Smart inköpslista</div>
          <a class="btn" href="Hem-Mobil-3-Inkop-1080x1920.png" download="Hem-Mobil-3-Inkop-1080x1920.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-Mobil-4-Bilder-Delning-1080x1920.png" alt="Bilder och delning" />
          <div class="card-title">4. Bilder, album &amp; delning</div>
          <a class="btn" href="Hem-Mobil-4-Bilder-Delning-1080x1920.png" download="Hem-Mobil-4-Bilder-Delning-1080x1920.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-Mobil-5-Budget-Recept-1080x1920.png" alt="Budget och recept" />
          <div class="card-title">5. Månadsbudget &amp; recept</div>
          <a class="btn" href="Hem-Mobil-5-Budget-Recept-1080x1920.png" download="Hem-Mobil-5-Budget-Recept-1080x1920.png">Ladda ner PNG</a>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>4. Skärmbilder för Surfplatta 7 tum &amp; 10 tum (2 st)</h2>
      <p class="spec">Krav i Play Console: 1920 × 1080 px (16:9 liggande) · Kan laddas upp under både 7-tums och 10-tums surfplatta</p>
      <div class="grid-tablets">
        <div class="card">
          <img src="Hem-Surfplatta-1-Oversikt-1920x1080.png" alt="Surfplatta 1" />
          <div class="card-title">1. Surfplatta — Översikt, inköp &amp; bilder (1920×1080)</div>
          <a class="btn" href="Hem-Surfplatta-1-Oversikt-1920x1080.png" download="Hem-Surfplatta-1-Oversikt-1920x1080.png">Ladda ner PNG</a>
        </div>
        <div class="card">
          <img src="Hem-Surfplatta-2-Kalender-Budget-1920x1080.png" alt="Surfplatta 2" />
          <div class="card-title">2. Surfplatta — Kalender, delning &amp; budget (1920×1080)</div>
          <a class="btn" href="Hem-Surfplatta-2-Kalender-Budget-1920x1080.png" download="Hem-Surfplatta-2-Kalender-Budget-1920x1080.png">Ladda ner PNG</a>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>5. Högupplöst Appikon (512 × 512 px)</h2>
      <p class="spec">Krav i Play Console: 512 × 512 px · 32-bit PNG</p>
      <div class="card" style="max-width: 240px;">
        <img src="Hem-Appikon-512x512.png" alt="Appikon 512x512" />
        <div class="card-title">Hem-Appikon-512x512.png</div>
        <a class="btn" href="Hem-Appikon-512x512.png" download="Hem-Appikon-512x512.png">Ladda ner Appikon</a>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), galleryHtml, 'utf8');
console.log('All Play Store assets generated successfully!');


