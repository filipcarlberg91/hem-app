import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = path.resolve('public/assets/hub_proposals');
fs.mkdirSync(outDir, { recursive: true });

// Proposal 1: Pixel Hub Split (Levande Fotoram/Video + M3 Expressive Widget-Grid)
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E1D16"/>
      <stop offset="55%" stop-color="#152B21"/>
      <stop offset="100%" stop-color="#0A140F"/>
    </linearGradient>
    <linearGradient id="photo1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E3F32"/>
      <stop offset="45%" stop-color="#2D5A47"/>
      <stop offset="100%" stop-color="#0F231B"/>
    </linearGradient>
    <linearGradient id="scrim1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#000000" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#07120D" stop-opacity="0.88"/>
    </linearGradient>
    <linearGradient id="amberFab" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>

  <rect width="1600" height="1000" fill="url(#bg1)"/>

  <!-- Top Proposal Title Bar -->
  <rect x="36" y="22" width="640" height="44" rx="22" fill="#A6F2C6" fill-opacity="0.16"/>
  <text x="60" y="50" font-family="sans-serif" font-size="19" font-weight="800" fill="#A6F2C6" letter-spacing="0.5">FÖRSLAG 1 · PIXEL HUB SPLIT (LEVANDE BILD/VIDEO + WIDGET-GRID)</text>

  <!-- LEFT 54%: Ambient Photo / Video Frame -->
  <g transform="translate(36, 82)">
    <rect width="830" height="882" rx="44" fill="url(#photo1)"/>
    <!-- Stylized nature / moving aurora waves inside ambient frame -->
    <circle cx="650" cy="220" r="190" fill="#5EEAD4" fill-opacity="0.14"/>
    <path d="M0 540 Q260 440 520 530 T830 480 L830 882 L0 882 Z" fill="#34D399" fill-opacity="0.18"/>
    <path d="M0 640 Q320 560 590 640 T830 600 L830 882 L0 882 Z" fill="#10B981" fill-opacity="0.16"/>
    <rect width="830" height="882" rx="44" fill="url(#scrim1)"/>

    <!-- Ambient Mode Indicator -->
    <rect x="34" y="32" width="270" height="42" rx="21" fill="#0B1913" fill-opacity="0.65"/>
    <circle cx="58" cy="53" r="6" fill="#34D399"/>
    <text x="76" y="59" font-family="sans-serif" font-size="16" font-weight="700" fill="#D1FAE5">Levande Foto / Rörlig Video</text>

    <!-- Google Home Button (Top Right of Ambient Panel) -->
    <rect x="596" y="30" width="200" height="54" rx="27" fill="#FDE68A"/>
    <text x="646" y="64" font-family="sans-serif" font-size="19" font-weight="800" fill="#422006">Google Home</text>
    <path d="M622 46 L632 37 L642 46 L642 60 L622 60 Z" fill="#92400E"/>

    <!-- Giant Pixel Hub Clock & Weather -->
    <text x="42" y="235" font-family="sans-serif" font-size="148" font-weight="900" fill="#ECFDF5" letter-spacing="-4">19:42</text>
    <text x="48" y="290" font-family="sans-serif" font-size="28" font-weight="700" fill="#A7F3D0">Onsdag 28 oktober · 18°C Klart i Göteborg</text>

    <!-- Embedded Google Home Mini Status Strip -->
    <g transform="translate(42, 496)">
      <rect width="746" height="78" rx="28" fill="#122920" fill-opacity="0.88" stroke="#34D399" stroke-opacity="0.25" stroke-width="1.5"/>
      <rect x="16" y="14" width="210" height="50" rx="25" fill="#FDE68A"/>
      <text x="42" y="45" font-family="sans-serif" font-size="17" font-weight="800" fill="#422006">🏠 Google Home (Inbäddad)</text>
      <rect x="242" y="14" width="235" height="50" rx="25" fill="#1E3F32"/>
      <rect x="242" y="14" width="180" height="50" rx="25" fill="#FACC15" fill-opacity="0.32"/>
      <text x="266" y="45" font-family="sans-serif" font-size="16" font-weight="700" fill="#FEF08A">💡 Vardagsrum · 80%</text>
      <rect x="492" y="14" width="238" height="50" rx="25" fill="#1E3F32"/>
      <rect x="492" y="14" width="120" height="50" rx="25" fill="#FACC15" fill-opacity="0.28"/>
      <text x="516" y="45" font-family="sans-serif" font-size="16" font-weight="700" fill="#FEF08A">💡 Kök · 50%</text>
    </g>

    <!-- NETWORK MEDIA & CAST CONTROLLER (No playlists, pure controls + Speaker Picker) -->
    <g transform="translate(42, 594)">
      <rect width="746" height="248" rx="38" fill="#112A20" stroke="#6EE7B7" stroke-opacity="0.35" stroke-width="2"/>
      <!-- Album Artwork -->
      <rect x="26" y="26" width="124" height="124" rx="28" fill="#065F46"/>
      <circle cx="88" cy="88" r="38" fill="#34D399" fill-opacity="0.3"/>
      <text x="72" y="100" font-family="sans-serif" font-size="38" fill="#A7F3D0">♫</text>

      <!-- Live Network Cast Badge -->
      <rect x="172" y="26" width="318" height="34" rx="17" fill="#064E3B"/>
      <circle cx="192" cy="43" r="5" fill="#1ED760"/>
      <text x="206" y="49" font-family="sans-serif" font-size="14" font-weight="800" fill="#A7F3D0">SPELAS I NÄTVERKET · SPOTIFY CONNECT</text>

      <!-- SPEAKER OUTPUT SWITCHER BUTTON (Like Spotify / Android 15) -->
      <rect x="504" y="22" width="218" height="44" rx="22" fill="#A7F3D0"/>
      <text x="528" y="50" font-family="sans-serif" font-size="15" font-weight="900" fill="#064E3B">🔊 Vardagsrum + Kök ▾</text>

      <!-- Track Title & Artist -->
      <text x="172" y="96" font-family="sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">Midnight City</text>
      <text x="172" y="128" font-family="sans-serif" font-size="19" font-weight="600" fill="#A7F3D0">M83 · Startad av Felicia i samma Wi-Fi</text>

      <!-- Wavy M3 Expressive Progress Bar + Controls -->
      <path d="M28 196 Q55 184 82 196 T136 196 T190 196 T244 196 T298 196" stroke="#34D399" stroke-width="6" fill="none" stroke-linecap="round"/>
      <line x1="302" y1="196" x2="460" y2="196" stroke="#1E3F32" stroke-width="6" stroke-linecap="round"/>
      <rect x="296" y="180" width="10" height="32" rx="5" fill="#ECFDF5"/>
      <text x="28" y="228" font-family="sans-serif" font-size="14" font-weight="700" fill="#6EE7B7">2:14</text>
      <text x="428" y="228" font-family="sans-serif" font-size="14" font-weight="700" fill="#6EE7B7">4:03</text>

      <!-- Play / Pause / Skip M3 Expressive Pills -->
      <rect x="494" y="168" width="66" height="56" rx="28" fill="#1E3F32"/>
      <text x="516" y="203" font-family="sans-serif" font-size="22" font-weight="900" fill="#ECFDF5">⏮</text>
      <rect x="572" y="162" width="82" height="68" rx="24" fill="#34D399"/>
      <text x="602" y="205" font-family="sans-serif" font-size="26" font-weight="900" fill="#064E3B">⏸</text>
      <rect x="666" y="168" width="56" height="56" rx="28" fill="#1E3F32"/>
      <text x="684" y="203" font-family="sans-serif" font-size="22" font-weight="900" fill="#ECFDF5">⏭</text>
    </g>
  </g>

  <!-- RIGHT 46%: Customizable Material 3 Expressive Page Widgets in Different Sizes -->
  <g transform="translate(894, 82)">
    <!-- Widget 1: STOR (2x2) Kalender Widget -->
    <rect x="0" y="0" width="670" height="310" rx="40" fill="#132A20" stroke="#34D399" stroke-opacity="0.22" stroke-width="1.5"/>
    <rect x="28" y="24" width="142" height="34" rx="17" fill="#A7F3D0"/>
    <text x="48" y="47" font-family="sans-serif" font-size="14" font-weight="900" fill="#064E3B">KALENDER · STOR</text>
    <text x="530" y="47" font-family="sans-serif" font-size="15" font-weight="700" fill="#6EE7B7">Storlek: 2×2 ▾</text>

    <rect x="28" y="74" width="614" height="64" rx="22" fill="#1E3F32"/>
    <rect x="44" y="90" width="84" height="32" rx="16" fill="#34D399"/>
    <text x="60" y="112" font-family="sans-serif" font-size="15" font-weight="900" fill="#064E3B">17:30</text>
    <text x="146" y="113" font-family="sans-serif" font-size="21" font-weight="800" fill="#ECFDF5">Fotbollsträning &amp; Middag</text>

    <rect x="28" y="150" width="614" height="64" rx="22" fill="#1E3F32"/>
    <rect x="44" y="166" width="84" height="32" rx="16" fill="#FDE68A"/>
    <text x="60" y="188" font-family="sans-serif" font-size="15" font-weight="900" fill="#422006">Imorgon</text>
    <text x="146" y="189" font-family="sans-serif" font-size="21" font-weight="800" fill="#ECFDF5">Utvecklingssamtal kl 09:00</text>

    <rect x="28" y="226" width="614" height="60" rx="22" fill="#183328"/>
    <text x="52" y="263" font-family="sans-serif" font-size="18" font-weight="700" fill="#A7F3D0">Fredag 18:00 · Fredagsmys &amp; filmkväll</text>

    <!-- Widget 2: MELLAN (2x1) Inköpslista Widget -->
    <g transform="translate(0, 330)">
      <rect width="670" height="246" rx="40" fill="#1A3529" stroke="#6EE7B7" stroke-opacity="0.22" stroke-width="1.5"/>
      <rect x="28" y="24" width="180" height="34" rx="17" fill="#FDE68A"/>
      <text x="46" y="47" font-family="sans-serif" font-size="14" font-weight="900" fill="#422006">INKÖPSLISTA · MELLAN</text>
      <text x="530" y="47" font-family="sans-serif" font-size="15" font-weight="700" fill="#A7F3D0">Storlek: 2×1 ▾</text>

      <rect x="28" y="74" width="298" height="68" rx="24" fill="#11261D"/>
      <circle cx="60" cy="108" r="13" stroke="#34D399" stroke-width="3" fill="none"/>
      <text x="88" y="115" font-family="sans-serif" font-size="20" font-weight="800" fill="#ECFDF5">Havremjölk 2 st</text>

      <rect x="344" y="74" width="298" height="68" rx="24" fill="#11261D"/>
      <circle cx="376" cy="108" r="13" stroke="#34D399" stroke-width="3" fill="none"/>
      <text x="404" y="115" font-family="sans-serif" font-size="20" font-weight="800" fill="#ECFDF5">Avokado &amp; Citron</text>

      <rect x="28" y="154" width="298" height="68" rx="24" fill="#11261D"/>
      <circle cx="60" cy="188" r="13" stroke="#34D399" stroke-width="3" fill="none"/>
      <text x="88" y="195" font-family="sans-serif" font-size="20" font-weight="800" fill="#ECFDF5">Färsk pasta</text>

      <rect x="344" y="154" width="298" height="68" rx="24" fill="#34D399"/>
      <text x="412" y="196" font-family="sans-serif" font-size="20" font-weight="900" fill="#064E3B">+ Lägg till vara</text>
    </g>

    <!-- Bottom Row: 2 SMALL (1x1) Widgets: Att göra + Budget -->
    <g transform="translate(0, 596)">
      <!-- Widget 3: LITEN (1x1) Att göra -->
      <rect width="324" height="286" rx="40" fill="#142C22" stroke="#34D399" stroke-opacity="0.2" stroke-width="1.5"/>
      <rect x="24" y="24" width="150" height="32" rx="16" fill="#6EE7B7"/>
      <text x="42" y="45" font-family="sans-serif" font-size="13" font-weight="900" fill="#064E3B">ATT GÖRA · LITEN</text>
      <rect x="24" y="74" width="276" height="56" rx="20" fill="#1E3F32"/>
      <text x="44" y="109" font-family="sans-serif" font-size="18" font-weight="800" fill="#ECFDF5">○ Boka besiktning</text>
      <rect x="24" y="140" width="276" height="56" rx="20" fill="#1E3F32"/>
      <text x="44" y="175" font-family="sans-serif" font-size="18" font-weight="800" fill="#ECFDF5">○ Vattna växter</text>
      <rect x="24" y="210" width="276" height="52" rx="26" fill="#A7F3D0"/>
      <text x="98" y="242" font-family="sans-serif" font-size="17" font-weight="900" fill="#064E3B">+ Ny uppgift</text>

      <!-- Widget 4: LITEN (1x1) Budget -->
      <g transform="translate(346, 0)">
        <rect width="324" height="286" rx="40" fill="#231F14" stroke="#FDE68A" stroke-opacity="0.28" stroke-width="1.5"/>
        <rect x="24" y="24" width="136" height="32" rx="16" fill="#FDE68A"/>
        <text x="42" y="45" font-family="sans-serif" font-size="13" font-weight="900" fill="#422006">BUDGET · LITEN</text>
        <text x="28" y="105" font-family="sans-serif" font-size="16" font-weight="700" fill="#FDE68A">Kvar denna månad</text>
        <text x="28" y="162" font-family="sans-serif" font-size="46" font-weight="900" fill="#FEF9C3">8 450 kr</text>
        <rect x="24" y="198" width="276" height="62" rx="31" fill="#FDE68A"/>
        <text x="72" y="236" font-family="sans-serif" font-size="18" font-weight="900" fill="#422006">+ Lägg till utgift</text>
      </g>
    </g>
  </g>
</svg>`;

// Proposal 2: Fullscreen Cinema & Floating Islands with Open Speaker Menu (Google TV Streamer 4K + Spotify)
const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#091929"/>
      <stop offset="50%" stop-color="#102C46"/>
      <stop offset="100%" stop-color="#06101B"/>
    </linearGradient>
    <radialGradient id="glow2" cx="0.3" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#091929" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1600" height="1000" fill="url(#bg2)"/>
  <rect width="1600" height="1000" fill="url(#glow2)"/>
  <!-- Fullscreen Moving Wallpaper Waves -->
  <path d="M0 680 Q400 540 820 660 T1600 580 L1600 1000 L0 1000 Z" fill="#0284C7" fill-opacity="0.16"/>
  <path d="M0 780 Q500 670 980 770 T1600 710 L1600 1000 L0 1000 Z" fill="#38BDF8" fill-opacity="0.12"/>

  <!-- Proposal Banner -->
  <rect x="36" y="22" width="760" height="44" rx="22" fill="#BAE6FD" fill-opacity="0.18"/>
  <text x="60" y="50" font-family="sans-serif" font-size="19" font-weight="800" fill="#BAE6FD">FÖRSLAG 2 · FULLSKÄRMS CINEMA + ÖPPEN HÖGTALARMENY (SPOTIFY &amp; GOOGLE TV)</text>

  <!-- Top-Left Giant Expressive Clock & Google Home Pill -->
  <g transform="translate(48, 92)">
    <text x="0" y="140" font-family="sans-serif" font-size="154" font-weight="900" fill="#F0F9FF" letter-spacing="-5">20:15</text>
    <text x="8" y="192" font-family="sans-serif" font-size="26" font-weight="700" fill="#7DD3FC">Onsdag 28 oktober · 18°C · Rörlig Bakgrund (Cinema)</text>

    <!-- Google Home Embedded Launch Pill -->
    <rect x="0" y="224" width="290" height="68" rx="34" fill="#FDBA74"/>
    <text x="36" y="266" font-family="sans-serif" font-size="22" font-weight="900" fill="#431407">🏠 Google Home-panel</text>
  </g>

  <!-- OPEN ANDROID 15 / SPOTIFY SPEAKER OUTPUT SWITCHER MENU -->
  <g transform="translate(48, 396)">
    <rect width="540" height="350" rx="40" fill="#0F2942" stroke="#7DD3FC" stroke-opacity="0.45" stroke-width="2"/>
    <text x="32" y="48" font-family="sans-serif" font-size="16" font-weight="900" fill="#7DD3FC" letter-spacing="1">VÄLJ HÖGTALARE I NÄTVERKET (CAST / SPOTIFY)</text>

    <!-- Speaker 1: Checked -->
    <rect x="24" y="68" width="492" height="68" rx="24" fill="#0284C7"/>
    <rect x="44" y="88" width="28" height="28" rx="8" fill="#E0F2FE"/>
    <text x="51" y="109" font-family="sans-serif" font-size="18" font-weight="900" fill="#0369A1">✓</text>
    <text x="88" y="98" font-family="sans-serif" font-size="19" font-weight="900" fill="#FFFFFF">Vardagsrumshögtalare (Aktiv)</text>
    <rect x="88" y="110" width="320" height="10" rx="5" fill="#bae6fd"/>

    <!-- Speaker 2: Google TV Streamer 4K Checked -->
    <rect x="24" y="148" width="492" height="68" rx="24" fill="#0369A1"/>
    <rect x="44" y="168" width="28" height="28" rx="8" fill="#E0F2FE"/>
    <text x="51" y="189" font-family="sans-serif" font-size="18" font-weight="900" fill="#0369A1">✓</text>
    <text x="88" y="178" font-family="sans-serif" font-size="19" font-weight="900" fill="#FFFFFF">📺 Google TV Streamer 4K</text>
    <rect x="88" y="190" width="260" height="10" rx="5" fill="#7DD3FC"/>

    <!-- Speaker 3: Unchecked -->
    <rect x="24" y="228" width="492" height="54" rx="22" fill="#163A59"/>
    <rect x="44" y="241" width="26" height="26" rx="8" stroke="#7DD3FC" stroke-width="2.5" fill="none"/>
    <text x="88" y="262" font-family="sans-serif" font-size="18" font-weight="700" fill="#E0F2FE">🔊 Kökshögtalare (Nest Audio)</text>

    <!-- Speaker 4: All speakers group -->
    <rect x="24" y="290" width="492" height="44" rx="20" fill="#163A59"/>
    <text x="88" y="318" font-family="sans-serif" font-size="16" font-weight="800" fill="#7DD3FC">🔗 Spela i hela hemmet (Alla högtalare)</text>
  </g>

  <!-- Floating Bottom Now Playing Bar (Triggered by Network Activity) -->
  <g transform="translate(48, 766)">
    <rect width="840" height="196" rx="44" fill="#0C2238" stroke="#38BDF8" stroke-opacity="0.4" stroke-width="2"/>
    <rect x="26" y="26" width="144" height="144" rx="32" fill="#0369A1"/>
    <text x="80" y="114" font-family="sans-serif" font-size="52" fill="#E0F2FE">▶</text>

    <rect x="194" y="28" width="350" height="34" rx="17" fill="#075985"/>
    <text x="214" y="50" font-family="sans-serif" font-size="14" font-weight="900" fill="#7DD3FC">NÄTVERKSUPPSPELNING · GOOGLE TV STREAMER 4K</text>

    <text x="194" y="96" font-family="sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">Blinding Lights</text>
    <text x="194" y="128" font-family="sans-serif" font-size="19" font-weight="600" fill="#BAE6FD">The Weeknd · Spotify Connect på samma nätverk</text>

    <path d="M194 158 Q230 146 266 158 T338 158 T410 158 T482 158" stroke="#38BDF8" stroke-width="6" fill="none" stroke-linecap="round"/>
    <line x1="486" y1="158" x2="580" y2="158" stroke="#1E3A5F" stroke-width="6" stroke-linecap="round"/>

    <!-- Media Controls + Speaker Button -->
    <rect x="608" y="42" width="206" height="44" rx="22" fill="#7DD3FC"/>
    <text x="630" y="70" font-family="sans-serif" font-size="15" font-weight="900" fill="#082F49">🔊 2 högtalare valda ▴</text>

    <rect x="608" y="102" width="60" height="64" rx="24" fill="#163A59"/>
    <text x="628" y="142" font-family="sans-serif" font-size="22" fill="#E0F2FE">⏮</text>
    <rect x="678" y="102" width="68" height="64" rx="22" fill="#38BDF8"/>
    <text x="702" y="142" font-family="sans-serif" font-size="24" font-weight="900" fill="#082F49">⏸</text>
    <rect x="756" y="102" width="58" height="64" rx="24" fill="#163A59"/>
    <text x="775" y="142" font-family="sans-serif" font-size="22" fill="#E0F2FE">⏭</text>
  </g>

  <!-- RIGHT SIDE: Floating Material 3 Expressive Widgets in S / M / L sizes -->
  <g transform="translate(916, 86)">
    <!-- Widget 1: Kalender (2x1 Mellan) -->
    <rect x="0" y="0" width="640" height="240" rx="42" fill="#0F2942" fill-opacity="0.9" stroke="#7DD3FC" stroke-opacity="0.3" stroke-width="1.5"/>
    <rect x="28" y="24" width="164" height="34" rx="17" fill="#7DD3FC"/>
    <text x="48" y="46" font-family="sans-serif" font-size="14" font-weight="900" fill="#082F49">KALENDER · 2×1</text>
    <rect x="28" y="74" width="584" height="64" rx="22" fill="#163A59"/>
    <text x="52" y="114" font-family="sans-serif" font-size="21" font-weight="800" fill="#F0F9FF">17:30 · Fotbollsträning &amp; Familjemiddag</text>
    <rect x="28" y="150" width="584" height="64" rx="22" fill="#163A59"/>
    <text x="52" y="190" font-family="sans-serif" font-size="21" font-weight="800" fill="#BAE6FD">Imorgon 09:00 · Utvecklingssamtal</text>

    <!-- Widget 2: Recept / Matsedel (2x1 Mellan) -->
    <g transform="translate(0, 260)">
      <rect width="640" height="210" rx="42" fill="#2A1B12" fill-opacity="0.92" stroke="#FDBA74" stroke-opacity="0.35" stroke-width="1.5"/>
      <rect x="28" y="24" width="150" height="34" rx="17" fill="#FDBA74"/>
      <text x="48" y="46" font-family="sans-serif" font-size="14" font-weight="900" fill="#431407">RECEPT · 2×1</text>
      <text x="28" y="102" font-family="sans-serif" font-size="28" font-weight="900" fill="#FFEDD5">Krämig Citronpasta med Lax</text>
      <text x="28" y="138" font-family="sans-serif" font-size="18" font-weight="600" fill="#FDBA74">25 min · 4 portioner · Alla ingredienser hemma</text>
      <rect x="28" y="154" width="210" height="40" rx="20" fill="#FDBA74"/>
      <text x="56" y="180" font-family="sans-serif" font-size="15" font-weight="900" fill="#431407">Öppna receptet →</text>
    </g>

    <!-- Widget 3 & 4: Inköpslista (1x2) + Anteckningar (1x2) -->
    <g transform="translate(0, 490)">
      <rect width="310" height="386" rx="42" fill="#0F2942" fill-opacity="0.92" stroke="#7DD3FC" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="24" y="24" width="174" height="34" rx="17" fill="#BAE6FD"/>
      <text x="42" y="46" font-family="sans-serif" font-size="13" font-weight="900" fill="#082F49">INKÖPSLISTA · 1×2</text>
      <rect x="24" y="76" width="262" height="58" rx="20" fill="#163A59"/>
      <text x="44" y="112" font-family="sans-serif" font-size="19" font-weight="800" fill="#F0F9FF">○ Havremjölk</text>
      <rect x="24" y="146" width="262" height="58" rx="20" fill="#163A59"/>
      <text x="44" y="182" font-family="sans-serif" font-size="19" font-weight="800" fill="#F0F9FF">○ Avokado</text>
      <rect x="24" y="216" width="262" height="58" rx="20" fill="#163A59"/>
      <text x="44" y="252" font-family="sans-serif" font-size="19" font-weight="800" fill="#F0F9FF">○ Citron &amp; Dill</text>
      <rect x="24" y="304" width="262" height="58" rx="29" fill="#38BDF8"/>
      <text x="86" y="340" font-family="sans-serif" font-size="18" font-weight="900" fill="#082F49">+ Lägg till</text>

      <g transform="translate(330, 0)">
        <rect width="310" height="386" rx="42" fill="#231D0B" fill-opacity="0.92" stroke="#FDE047" stroke-opacity="0.35" stroke-width="1.5"/>
        <rect x="24" y="24" width="190" height="34" rx="17" fill="#FEF08A"/>
        <text x="42" y="46" font-family="sans-serif" font-size="13" font-weight="900" fill="#422006">ANTECKNINGAR · 1×2</text>
        <text x="28" y="102" font-family="sans-serif" font-size="22" font-weight="900" fill="#FEF9C3">Wifi-kod Gäster</text>
        <text x="28" y="136" font-family="sans-serif" font-size="17" font-weight="600" fill="#FDE047">HemmaHosF2026!</text>
        <rect x="24" y="168" width="262" height="114" rx="24" fill="#362C11"/>
        <text x="42" y="204" font-family="sans-serif" font-size="18" font-weight="800" fill="#FEF9C3">Kom ihåg inför helgen:</text>
        <text x="42" y="236" font-family="sans-serif" font-size="16" font-weight="600" fill="#FDE047">Hämta paket på ICA</text>
        <rect x="24" y="304" width="262" height="58" rx="29" fill="#FEF08A"/>
        <text x="68" y="340" font-family="sans-serif" font-size="18" font-weight="900" fill="#422006">+ Anteckning</text>
      </g>
    </g>
  </g>
</svg>`;

// Proposal 3: Embedded Google Home Drawer + Network Cast Center + Page Widgets
const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#22120B"/>
      <stop offset="55%" stop-color="#311A10"/>
      <stop offset="100%" stop-color="#140A06"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg3)"/>

  <!-- Proposal Banner -->
  <rect x="36" y="22" width="790" height="44" rx="22" fill="#FDBA74" fill-opacity="0.18"/>
  <text x="60" y="50" font-family="sans-serif" font-size="19" font-weight="800" fill="#FDBA74">FÖRSLAG 3 · INBÄDDAD GOOGLE HOME-PANEL + CAST-CENTER + SID-WIDGETS</text>

  <!-- COLUMN 1 (Left): Embedded Google Home Control Panel -->
  <g transform="translate(36, 84)">
    <rect width="460" height="880" rx="44" fill="#2D1810" stroke="#FDBA74" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="28" y="28" width="220" height="42" rx="21" fill="#FDBA74"/>
    <text x="50" y="55" font-family="sans-serif" font-size="16" font-weight="900" fill="#431407">🏠 GOOGLE HOME (INBÄDDAD)</text>

    <text x="32" y="138" font-family="sans-serif" font-size="78" font-weight="900" fill="#FFEDD5">18:30</text>
    <text x="34" y="174" font-family="sans-serif" font-size="18" font-weight="700" fill="#FDBA74">Svep direkt på reglagen (Google Home-känsla)</text>

    <!-- Google Home Style Pill Touch Sliders -->
    <!-- Room 1 -->
    <g transform="translate(28, 206)">
      <rect width="404" height="104" rx="34" fill="#431407"/>
      <rect width="330" height="104" rx="34" fill="#FDBA74"/>
      <text x="32" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#431407">💡 Vardagsrum</text>
      <text x="32" y="78" font-family="sans-serif" font-size="16" font-weight="800" fill="#7C2D12">4 lampor på · Svep för ljusstyrka</text>
      <text x="326" y="62" font-family="sans-serif" font-size="24" font-weight="900" fill="#FFEDD5">82%</text>
    </g>

    <!-- Room 2 -->
    <g transform="translate(28, 326)">
      <rect width="404" height="104" rx="34" fill="#431407"/>
      <rect width="220" height="104" rx="34" fill="#FDE047"/>
      <text x="32" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#422006">💡 Kök &amp; Matplats</text>
      <text x="32" y="78" font-family="sans-serif" font-size="16" font-weight="800" fill="#713F12">3 lampor på · Varmvit</text>
      <text x="326" y="62" font-family="sans-serif" font-size="24" font-weight="900" fill="#FFEDD5">55%</text>
    </g>

    <!-- Room 3 -->
    <g transform="translate(28, 446)">
      <rect width="404" height="104" rx="34" fill="#431407"/>
      <rect width="120" height="104" rx="34" fill="#FB923C"/>
      <text x="32" y="48" font-family="sans-serif" font-size="22" font-weight="900" fill="#FFEDD5">💡 Hall &amp; Entré</text>
      <text x="32" y="78" font-family="sans-serif" font-size="16" font-weight="700" fill="#FDBA74">Dimrad kvällsbelysning</text>
      <text x="326" y="62" font-family="sans-serif" font-size="24" font-weight="900" fill="#FDBA74">30%</text>
    </g>

    <!-- Room 4: Google TV Streamer 4K Device Tile -->
    <g transform="translate(28, 566)">
      <rect width="404" height="104" rx="34" fill="#1E293B" stroke="#38BDF8" stroke-opacity="0.4" stroke-width="2"/>
      <text x="32" y="46" font-family="sans-serif" font-size="21" font-weight="900" fill="#E0F2FE">📺 Google TV Streamer 4K</text>
      <text x="32" y="76" font-family="sans-serif" font-size="16" font-weight="700" fill="#38BDF8">Spelar nu i Vardagsrum · Cast Aktiv</text>
    </g>

    <!-- Open Native Google Home App Button -->
    <rect x="28" y="776" width="404" height="74" rx="37" fill="#FDBA74"/>
    <text x="72" y="821" font-family="sans-serif" font-size="21" font-weight="900" fill="#431407">Öppna hela Google Home-appen ↗</text>
  </g>

  <!-- COLUMN 2 (Center): Live Picture Frame + Network Media & Speaker Selector -->
  <g transform="translate(518, 84)">
    <!-- Moving Photo/Video Window -->
    <rect width="520" height="430" rx="44" fill="#3E2015"/>
    <circle cx="390" cy="140" r="110" fill="#FB923C" fill-opacity="0.22"/>
    <path d="M0 290 Q180 220 340 290 T520 260 L520 430 L0 430 Z" fill="#EA580C" fill-opacity="0.25"/>
    <rect x="24" y="24" width="250" height="38" rx="19" fill="#1C0D06" fill-opacity="0.7"/>
    <text x="44" y="49" font-family="sans-serif" font-size="15" font-weight="800" fill="#FFEDD5">🖼️ Familjealbum · Rörlig vy</text>
    <text x="32" y="384" font-family="sans-serif" font-size="24" font-weight="800" fill="#FFEDD5">Sommar i Bohuslän · 2026</text>

    <!-- Network Media Card with Integrated Speaker Output Picker -->
    <g transform="translate(0, 450)">
      <rect width="520" height="430" rx="44" fill="#2A150D" stroke="#FDBA74" stroke-opacity="0.4" stroke-width="2"/>
      <rect x="28" y="26" width="320" height="34" rx="17" fill="#431407"/>
      <text x="48" y="49" font-family="sans-serif" font-size="14" font-weight="900" fill="#FDBA74">🟢 UPPTÄCKT PÅ SAMMA WI-FI-NÄTVERK</text>

      <text x="28" y="102" font-family="sans-serif" font-size="32" font-weight="900" fill="#FFFFFF"> Solen i Göteborg</text>
      <text x="28" y="136" font-family="sans-serif" font-size="19" font-weight="700" fill="#FDBA74">Håkan Hellström · Spelas via Spotify Connect</text>

      <!-- Wavy Progress + Pure Controls -->
      <path d="M28 178 Q65 166 102 178 T176 178 T250 178 T324 178" stroke="#FDBA74" stroke-width="6" fill="none"/>
      <line x1="328" y1="178" x2="488" y2="178" stroke="#431407" stroke-width="6"/>

      <rect x="28" y="204" width="136" height="64" rx="32" fill="#431407"/>
      <text x="82" y="245" font-family="sans-serif" font-size="24" fill="#FFEDD5">⏮</text>
      <rect x="180" y="200" width="160" height="72" rx="28" fill="#FDBA74"/>
      <text x="246" y="247" font-family="sans-serif" font-size="28" font-weight="900" fill="#431407">⏸</text>
      <rect x="356" y="204" width="136" height="64" rx="32" fill="#431407"/>
      <text x="410" y="245" font-family="sans-serif" font-size="24" fill="#FFEDD5">⏭</text>

      <!-- Speaker Selector Pills -->
      <text x="28" y="308" font-family="sans-serif" font-size="15" font-weight="900" fill="#FDBA74">VÄLJ VILKA HÖGTALARE SOM SPELAR:</text>
      <rect x="28" y="324" width="224" height="42" rx="21" fill="#FDBA74"/>
      <text x="48" y="351" font-family="sans-serif" font-size="15" font-weight="900" fill="#431407">✓ Vardagsrum (Sonos)</text>
      <rect x="264" y="324" width="228" height="42" rx="21" fill="#FDBA74"/>
      <text x="284" y="351" font-family="sans-serif" font-size="15" font-weight="900" fill="#431407">✓ Google TV Streamer</text>
      <rect x="28" y="374" width="224" height="40" rx="20" fill="#431407"/>
      <text x="48" y="400" font-family="sans-serif" font-size="15" font-weight="700" fill="#FFEDD5">○ Kökshögtalare</text>
      <rect x="264" y="374" width="228" height="40" rx="20" fill="#431407"/>
      <text x="284" y="400" font-family="sans-serif" font-size="15" font-weight="700" fill="#FFEDD5">○ Hela hemmet (Alla)</text>
    </g>
  </g>

  <!-- COLUMN 3 (Right): Resizable M3 Expressive Widgets for App Pages -->
  <g transform="translate(1060, 84)">
    <rect width="504" height="280" rx="44" fill="#2A150D" stroke="#FDBA74" stroke-opacity="0.28" stroke-width="1.5"/>
    <rect x="28" y="24" width="160" height="34" rx="17" fill="#FDBA74"/>
    <text x="48" y="46" font-family="sans-serif" font-size="14" font-weight="900" fill="#431407">KALENDER · STOR</text>
    <rect x="28" y="74" width="448" height="84" rx="26" fill="#431407"/>
    <text x="48" y="110" font-family="sans-serif" font-size="19" font-weight="900" fill="#FDBA74">IDAG 17:30</text>
    <text x="48" y="140" font-family="sans-serif" font-size="22" font-weight="800" fill="#FFEDD5">Fotbollsträning &amp; Middag</text>
    <rect x="28" y="172" width="448" height="84" rx="26" fill="#431407"/>
    <text x="48" y="208" font-family="sans-serif" font-size="19" font-weight="900" fill="#FDBA74">IMORGON 09:00</text>
    <text x="48" y="238" font-family="sans-serif" font-size="22" font-weight="800" fill="#FFEDD5">Utvecklingssamtal skolan</text>

    <g transform="translate(0, 300)">
      <rect width="504" height="280" rx="44" fill="#1F291E" stroke="#86EFAC" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="28" y="24" width="180" height="34" rx="17" fill="#86EFAC"/>
      <text x="48" y="46" font-family="sans-serif" font-size="14" font-weight="900" fill="#064E3B">INKÖPSLISTA · MELLAN</text>
      <rect x="28" y="74" width="448" height="56" rx="20" fill="#14532D"/>
      <text x="48" y="110" font-family="sans-serif" font-size="20" font-weight="800" fill="#DCFCE7">○ Havremjölk &amp; Kaffe</text>
      <rect x="28" y="142" width="448" height="56" rx="20" fill="#14532D"/>
      <text x="48" y="178" font-family="sans-serif" font-size="20" font-weight="800" fill="#DCFCE7">○ Färsk pasta &amp; Lax</text>
      <rect x="28" y="210" width="448" height="50" rx="25" fill="#86EFAC"/>
      <text x="176" y="242" font-family="sans-serif" font-size="18" font-weight="900" fill="#064E3B">+ Lägg till vara</text>
    </g>

    <g transform="translate(0, 600)">
      <rect width="242" height="280" rx="44" fill="#2A150D" stroke="#FDBA74" stroke-opacity="0.28" stroke-width="1.5"/>
      <rect x="24" y="24" width="144" height="32" rx="16" fill="#FDE047"/>
      <text x="42" y="45" font-family="sans-serif" font-size="13" font-weight="900" fill="#422006">ATT GÖRA · 1×1</text>
      <text x="28" y="106" font-family="sans-serif" font-size="19" font-weight="800" fill="#FFEDD5">○ Besiktning</text>
      <text x="28" y="148" font-family="sans-serif" font-size="19" font-weight="800" fill="#FFEDD5">○ Tvätta bilen</text>
      <rect x="24" y="204" width="194" height="52" rx="26" fill="#FDE047"/>
      <text x="64" y="236" font-family="sans-serif" font-size="17" font-weight="900" fill="#422006">+ Uppgift</text>

      <g transform="translate(262, 0)">
        <rect width="242" height="280" rx="44" fill="#1F1633" stroke="#C4B5FD" stroke-opacity="0.3" stroke-width="1.5"/>
        <rect x="24" y="24" width="130" height="32" rx="16" fill="#C4B5FD"/>
        <text x="42" y="45" font-family="sans-serif" font-size="13" font-weight="900" fill="#1E1B4B">BUDGET · 1×1</text>
        <text x="28" y="102" font-family="sans-serif" font-size="15" font-weight="700" fill="#C4B5FD">Kvar att använda</text>
        <text x="28" y="152" font-family="sans-serif" font-size="38" font-weight="900" fill="#EDE9FE">8 450 kr</text>
        <rect x="24" y="204" width="194" height="52" rx="26" fill="#C4B5FD"/>
        <text x="68" y="236" font-family="sans-serif" font-size="17" font-weight="900" fill="#1E1B4B">+ Utgift</text>
      </g>
    </g>
  </g>
</svg>`;

// Proposal 4: Material 3 Expressive "Morphing Shapes" (Scalloped / Squircle Forms & Bold Tonal Contrast)
const svg4 = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#191124"/>
      <stop offset="55%" stop-color="#251736"/>
      <stop offset="100%" stop-color="#110A1A"/>
    </linearGradient>
    <linearGradient id="cardPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F5D0FE"/>
      <stop offset="100%" stop-color="#DDD6FE"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg4)"/>

  <!-- Proposal Banner -->
  <rect x="36" y="22" width="780" height="44" rx="22" fill="#E9D5FF" fill-opacity="0.18"/>
  <text x="60" y="50" font-family="sans-serif" font-size="19" font-weight="800" fill="#E9D5FF">FÖRSLAG 4 · MATERIAL 3 EXPRESSIVE MORPHING SHAPES (ORGANISKA FORMER)</text>

  <!-- LEFT: Sculpted Expressive Squircle Photo/Video Canvas + Overlapping Giant Clock -->
  <g transform="translate(36, 84)">
    <rect width="750" height="590" rx="110" fill="#3B1D54" stroke="#E9D5FF" stroke-opacity="0.35" stroke-width="2"/>
    <circle cx="540" cy="240" r="180" fill="#F472B6" fill-opacity="0.22"/>
    <circle cx="240" cy="390" r="210" fill="#A855F7" fill-opacity="0.2"/>

    <!-- Expressive Pill Badge -->
    <rect x="56" y="42" width="286" height="44" rx="22" fill="#F5D0FE"/>
    <text x="80" y="70" font-family="sans-serif" font-size="16" font-weight="900" fill="#4A044E">✨ RÖRLIG BILD / VIDEO-CANVAS</text>

    <!-- Giant M3 Expressive Stacked Clock -->
    <text x="56" y="260" font-family="sans-serif" font-size="170" font-weight="900" fill="#FAF5FF" letter-spacing="-6">21</text>
    <text x="255" y="260" font-family="sans-serif" font-size="170" font-weight="900" fill="#F5D0FE" letter-spacing="-6">:05</text>
    <text x="64" y="318" font-family="sans-serif" font-size="26" font-weight="800" fill="#E9D5FF">Onsdag 28 okt · 18°C · Familjen Carlberg</text>

    <!-- Bottom-Hugging Expressive Google Home Button inside Frame -->
    <rect x="56" y="486" width="310" height="72" rx="36" fill="url(#cardPink)"/>
    <text x="94" y="531" font-family="sans-serif" font-size="22" font-weight="900" fill="#3B0764">🏠 Google Home (Inbäddad)</text>

    <rect x="384" y="486" width="310" height="72" rx="36" fill="#581C87"/>
    <text x="424" y="531" font-family="sans-serif" font-size="20" font-weight="800" fill="#FAF5FF">💡 5 lampor tända (75%)</text>

    <!-- Expressive Pill Media Player (Full Tonal Pastel Card) -->
    <g transform="translate(0, 614)">
      <rect width="750" height="266" rx="68" fill="url(#cardPink)"/>
      <rect x="34" y="34" width="136" height="136" rx="46" fill="#4A044E"/>
      <text x="82" y="120" font-family="sans-serif" font-size="54" fill="#F5D0FE">♫</text>

      <!-- Active Network Cast Output Switcher Pill -->
      <rect x="196" y="32" width="340" height="44" rx="22" fill="#4A044E"/>
      <text x="220" y="60" font-family="sans-serif" font-size="16" font-weight="900" fill="#F5D0FE">🔊 Vardagsrum + Google TV 4K ▾</text>

      <text x="196" y="116" font-family="sans-serif" font-size="34" font-weight="900" fill="#2E1065">As It Was</text>
      <text x="196" y="150" font-family="sans-serif" font-size="20" font-weight="800" fill="#581C87">Harry Styles · Spelas i samma Wi-Fi (Spotify)</text>

      <!-- Wavy Scrubber -->
      <path d="M38 214 Q75 200 112 214 T186 214 T260 214 T334 214 T408 214" stroke="#4A044E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <line x1="412" y1="214" x2="478" y2="214" stroke="#A855F7" stroke-width="6" stroke-linecap="round"/>

      <!-- Expressive Morphing Media Buttons -->
      <rect x="504" y="178" width="66" height="62" rx="31" fill="#E9D5FF"/>
      <text x="525" y="218" font-family="sans-serif" font-size="22" font-weight="900" fill="#3B0764">⏮</text>
      <rect x="580" y="172" width="84" height="74" rx="26" fill="#4A044E"/>
      <text x="610" y="219" font-family="sans-serif" font-size="26" font-weight="900" fill="#F5D0FE">⏸</text>
      <rect x="674" y="178" width="52" height="62" rx="26" fill="#E9D5FF"/>
      <text x="689" y="218" font-family="sans-serif" font-size="22" font-weight="900" fill="#3B0764">⏭</text>
    </g>
  </g>

  <!-- RIGHT: Expressive Shaped Widgets in S / M / L -->
  <g transform="translate(814, 84)">
    <!-- Large Rounded-60 Kalender Widget -->
    <rect width="750" height="296" rx="58" fill="#2E1A47" stroke="#E9D5FF" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="34" y="28" width="180" height="38" rx="19" fill="#F5D0FE"/>
    <text x="56" y="53" font-family="sans-serif" font-size="15" font-weight="900" fill="#4A044E">KALENDER · STOR 2×2</text>

    <rect x="34" y="84" width="682" height="84" rx="34" fill="#4A1D6E"/>
    <text x="62" y="135" font-family="sans-serif" font-size="24" font-weight="900" fill="#FAF5FF">17:30 · Fotbollsträning &amp; Familjemiddag</text>

    <rect x="34" y="182" width="682" height="84" rx="34" fill="#3B1559"/>
    <text x="62" y="233" font-family="sans-serif" font-size="24" font-weight="800" fill="#E9D5FF">Imorgon 09:00 · Utvecklingssamtal</text>

    <!-- Middle Row: Tall Pill Shopping Widget (1x2) + Medium Recipe Widget + Small Budget Pill -->
    <g transform="translate(0, 318)">
      <!-- Tall Capsule Inköpslista -->
      <rect width="362" height="562" rx="64" fill="#3B1D54" stroke="#F5D0FE" stroke-opacity="0.3" stroke-width="2"/>
      <rect x="32" y="32" width="196" height="38" rx="19" fill="#DDD6FE"/>
      <text x="54" y="57" font-family="sans-serif" font-size="14" font-weight="900" fill="#2E1065">INKÖPSLISTA · 1×2</text>

      <rect x="32" y="92" width="298" height="72" rx="32" fill="#251038"/>
      <text x="58" y="136" font-family="sans-serif" font-size="22" font-weight="800" fill="#FAF5FF">○ Havremjölk 2 st</text>

      <rect x="32" y="180" width="298" height="72" rx="32" fill="#251038"/>
      <text x="58" y="224" font-family="sans-serif" font-size="22" font-weight="800" fill="#FAF5FF">○ Avokado &amp; Lime</text>

      <rect x="32" y="268" width="298" height="72" rx="32" fill="#251038"/>
      <text x="58" y="312" font-family="sans-serif" font-size="22" font-weight="800" fill="#FAF5FF">○ Färsk pasta</text>

      <rect x="32" y="356" width="298" height="72" rx="32" fill="#251038"/>
      <text x="58" y="400" font-family="sans-serif" font-size="22" font-weight="800" fill="#FAF5FF">○ Kallrökt lax</text>

      <rect x="32" y="458" width="298" height="74" rx="37" fill="#F5D0FE"/>
      <text x="98" y="503" font-family="sans-serif" font-size="21" font-weight="900" fill="#4A044E">+ Lägg till vara</text>

      <!-- Right Stack: Att göra (1x1) + Budget (1x1) -->
      <g transform="translate(388, 0)">
        <rect width="362" height="270" rx="58" fill="#2E1A47" stroke="#E9D5FF" stroke-opacity="0.3" stroke-width="2"/>
        <rect x="32" y="28" width="166" height="36" rx="18" fill="#FBCFE8"/>
        <text x="54" y="52" font-family="sans-serif" font-size="14" font-weight="900" fill="#831843">ATT GÖRA · 1×1</text>
        <text x="36" y="108" font-family="sans-serif" font-size="21" font-weight="800" fill="#FAF5FF">○ Boka besiktning</text>
        <text x="36" y="150" font-family="sans-serif" font-size="21" font-weight="800" fill="#FAF5FF">○ Hämta paket ICA</text>
        <rect x="32" y="186" width="298" height="58" rx="29" fill="#FBCFE8"/>
        <text x="114" y="222" font-family="sans-serif" font-size="19" font-weight="900" fill="#831843">+ Ny uppgift</text>

        <g transform="translate(0, 292)">
          <rect width="362" height="270" rx="58" fill="#4A1D6E" stroke="#F5D0FE" stroke-opacity="0.35" stroke-width="2"/>
          <rect x="32" y="28" width="150" height="36" rx="18" fill="#FDE68A"/>
          <text x="54" y="52" font-family="sans-serif" font-size="14" font-weight="900" fill="#422006">BUDGET · 1×1</text>
          <text x="36" y="104" font-family="sans-serif" font-size="18" font-weight="700" fill="#E9D5FF">Kvar i månadsbudget</text>
          <text x="36" y="162" font-family="sans-serif" font-size="48" font-weight="900" fill="#FEF9C3">8 450 kr</text>
          <rect x="32" y="188" width="298" height="58" rx="29" fill="#FDE68A"/>
          <text x="122" y="224" font-family="sans-serif" font-size="19" font-weight="900" fill="#422006">+ Ny utgift</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;

// Proposal 5: Modular All-Pages Widget Canvas + Bottom Pixel Hub Dock (Google Home + Network Cast + Widget Picker)
const svg5 = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#090D16"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg5)"/>
  <!-- Subtle Animated Ambient Backdrop -->
  <circle cx="1300" cy="220" r="260" fill="#38BDF8" fill-opacity="0.1"/>
  <circle cx="320" cy="680" r="280" fill="#34D399" fill-opacity="0.1"/>

  <!-- Proposal Banner -->
  <rect x="36" y="20" width="840" height="42" rx="21" fill="#94A3B8" fill-opacity="0.22"/>
  <text x="60" y="47" font-family="sans-serif" font-size="18" font-weight="800" fill="#E2E8F0">FÖRSLAG 5 · ALLA 7 SIDOR SOM WIDGETS (S/M/L) + PIXEL HUB-DOCKA LÄNGST NER</text>

  <!-- TOP HEADER: Expressive Clock + Weather + Live Wallpaper Mode Switch -->
  <g transform="translate(40, 78)">
    <text x="0" y="76" font-family="sans-serif" font-size="86" font-weight="900" fill="#F8FAFC" letter-spacing="-3">17:50</text>
    <text x="248" y="46" font-family="sans-serif" font-size="24" font-weight="800" fill="#93C5FD">Onsdag 28 oktober · 18°C Klart</text>
    <text x="248" y="78" font-family="sans-serif" font-size="18" font-weight="600" fill="#94A3B8">Bakgrund: Levande Fotoram &amp; Rörlig Video · 6 aktiva sid-widgets</text>

    <rect x="1220" y="18" width="300" height="56" rx="28" fill="#334155"/>
    <text x="1254" y="53" font-family="sans-serif" font-size="18" font-weight="800" fill="#E2E8F0">⚙️ Anpassa widgets &amp; storlek</text>
  </g>

  <!-- MAIN 3-COLUMN MODULAR WIDGET CANVAS (Showing all App Pages in S/M/L) -->
  <g transform="translate(40, 178)">
    <!-- Col 1: Kalender (2x2 Stor) + Bilder (1x1) -->
    <rect x="0" y="0" width="490" height="360" rx="38" fill="#1E293B" fill-opacity="0.9" stroke="#93C5FD" stroke-opacity="0.3" stroke-width="1.5"/>
    <rect x="24" y="22" width="150" height="32" rx="16" fill="#93C5FD"/>
    <text x="42" y="43" font-family="sans-serif" font-size="13" font-weight="900" fill="#0F172A">KALENDER · STOR</text>
    <rect x="24" y="70" width="442" height="80" rx="24" fill="#0F172A"/>
    <text x="44" y="104" font-family="sans-serif" font-size="16" font-weight="900" fill="#93C5FD">IDAG 17:30</text>
    <text x="44" y="132" font-family="sans-serif" font-size="20" font-weight="800" fill="#F8FAFC">Fotbollsträning &amp; Middag</text>
    <rect x="24" y="162" width="442" height="80" rx="24" fill="#0F172A"/>
    <text x="44" y="196" font-family="sans-serif" font-size="16" font-weight="900" fill="#86EFAC">IMORGON 09:00</text>
    <text x="44" y="224" font-family="sans-serif" font-size="20" font-weight="800" fill="#F8FAFC">Utvecklingssamtal skolan</text>
    <rect x="24" y="254" width="442" height="80" rx="24" fill="#0F172A"/>
    <text x="44" y="288" font-family="sans-serif" font-size="16" font-weight="900" fill="#FDBA74">FREDAG 18:00</text>
    <text x="44" y="316" font-family="sans-serif" font-size="20" font-weight="800" fill="#F8FAFC">Fredagsmys med familjen</text>

    <!-- Col 1 Bottom: Recept (2x1 Mellan) -->
    <g transform="translate(0, 380)">
      <rect width="490" height="190" rx="38" fill="#271711" fill-opacity="0.92" stroke="#FDBA74" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="24" y="22" width="150" height="32" rx="16" fill="#FDBA74"/>
      <text x="42" y="43" font-family="sans-serif" font-size="13" font-weight="900" fill="#431407">RECEPT · MELLAN</text>
      <text x="28" y="96" font-family="sans-serif" font-size="25" font-weight="900" fill="#FFEDD5">Krämig Citronpasta med Lax</text>
      <text x="28" y="130" font-family="sans-serif" font-size="17" font-weight="700" fill="#FDBA74">Kvällens middag · 25 min · 4 port</text>
      <rect x="28" y="142" width="170" height="34" rx="17" fill="#FDBA74"/>
      <text x="50" y="164" font-family="sans-serif" font-size="14" font-weight="900" fill="#431407">Visa recept →</text>
    </g>

    <!-- Col 2: Inköpslista (1x2) + Att göra (1x2) -->
    <g transform="translate(514, 0)">
      <rect width="490" height="275" rx="38" fill="#0D281D" fill-opacity="0.92" stroke="#86EFAC" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="24" y="22" width="180" height="32" rx="16" fill="#86EFAC"/>
      <text x="42" y="43" font-family="sans-serif" font-size="13" font-weight="900" fill="#064E3B">INKÖPSLISTA · MELLAN</text>
      <rect x="24" y="68" width="214" height="58" rx="20" fill="#14532D"/>
      <text x="42" y="104" font-family="sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">○ Havremjölk</text>
      <rect x="252" y="68" width="214" height="58" rx="20" fill="#14532D"/>
      <text x="270" y="104" font-family="sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">○ Avokado</text>
      <rect x="24" y="138" width="214" height="58" rx="20" fill="#14532D"/>
      <text x="42" y="174" font-family="sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">○ Färsk pasta</text>
      <rect x="252" y="138" width="214" height="58" rx="20" fill="#86EFAC"/>
      <text x="292" y="174" font-family="sans-serif" font-size="18" font-weight="900" fill="#064E3B">+ Lägg till</text>
      <text x="28" y="242" font-family="sans-serif" font-size="16" font-weight="700" fill="#86EFAC">Tryck direkt på en vara för att bocka av</text>

      <!-- Att göra + Anteckningar -->
      <g transform="translate(0, 295)">
        <rect width="236" height="275" rx="38" fill="#1E293B" stroke="#FDE047" stroke-opacity="0.3" stroke-width="1.5"/>
        <rect x="22" y="22" width="140" height="30" rx="15" fill="#FEF08A"/>
        <text x="38" y="42" font-family="sans-serif" font-size="12" font-weight="900" fill="#422006">ATT GÖRA · LITEN</text>
        <text x="24" y="96" font-family="sans-serif" font-size="18" font-weight="800" fill="#F8FAFC">○ Besiktning</text>
        <text x="24" y="136" font-family="sans-serif" font-size="18" font-weight="800" fill="#F8FAFC">○ Vattna blommor</text>
        <rect x="22" y="198" width="192" height="52" rx="26" fill="#FEF08A"/>
        <text x="64" y="230" font-family="sans-serif" font-size="16" font-weight="900" fill="#422006">+ Ny uppgift</text>

        <g transform="translate(254, 0)">
          <rect width="236" height="275" rx="38" fill="#231D0B" stroke="#FDE047" stroke-opacity="0.3" stroke-width="1.5"/>
          <rect x="22" y="22" width="168" height="30" rx="15" fill="#FDE047"/>
          <text x="36" y="42" font-family="sans-serif" font-size="12" font-weight="900" fill="#422006">ANTECKNINGAR · 1×1</text>
          <text x="24" y="94" font-family="sans-serif" font-size="19" font-weight="900" fill="#FEF9C3">Portkod &amp; Wifi</text>
          <text x="24" y="128" font-family="sans-serif" font-size="15" font-weight="600" fill="#FDE047">HemmaHosF2026!</text>
          <rect x="22" y="198" width="192" height="52" rx="26" fill="#FDE047"/>
          <text x="54" y="230" font-family="sans-serif" font-size="16" font-weight="900" fill="#422006">+ Anteckning</text>
        </g>
      </g>
    </g>

    <!-- Col 3: Bilder/Fotoram Widget (1x2) + Budget Widget (1x1) -->
    <g transform="translate(1028, 0)">
      <rect width="492" height="320" rx="38" fill="#1E293B" stroke="#38BDF8" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="24" y="22" width="180" height="32" rx="16" fill="#7DD3FC"/>
      <text x="42" y="43" font-family="sans-serif" font-size="13" font-weight="900" fill="#082F49">BILDER &amp; ALBUM · 2×1</text>
      <circle cx="380" cy="160" r="88" fill="#38BDF8" fill-opacity="0.22"/>
      <path d="M0 230 Q180 170 340 230 T492 210 L492 320 L0 320 Z" fill="#0284C7" fill-opacity="0.35"/>
      <text x="28" y="284" font-family="sans-serif" font-size="20" font-weight="800" fill="#F0F9FF">📸 Familjealbum · 48 bilder i bildspelet</text>

      <g transform="translate(0, 340)">
        <rect width="492" height="230" rx="38" fill="#1E1633" stroke="#C4B5FD" stroke-opacity="0.35" stroke-width="1.5"/>
        <rect x="24" y="22" width="154" height="32" rx="16" fill="#C4B5FD"/>
        <text x="42" y="43" font-family="sans-serif" font-size="13" font-weight="900" fill="#1E1B4B">BUDGET · MELLAN</text>
        <text x="28" y="96" font-family="sans-serif" font-size="16" font-weight="700" fill="#C4B5FD">Kvar att använda i oktober</text>
        <text x="28" y="152" font-family="sans-serif" font-size="48" font-weight="900" fill="#EDE9FE">8 450 kr</text>
        <rect x="290" y="106" width="174" height="58" rx="29" fill="#C4B5FD"/>
        <text x="328" y="142" font-family="sans-serif" font-size="18" font-weight="900" fill="#1E1B4B">+ Ny utgift</text>
      </g>
    </g>
  </g>

  <!-- BOTTOM FLOATING PIXEL HUB DOCK (Google Home + Live Network Media + Speaker Selector) -->
  <g transform="translate(40, 774)">
    <rect width="1520" height="192" rx="48" fill="#0F172A" stroke="#38BDF8" stroke-opacity="0.45" stroke-width="2"/>

    <!-- Left: Google Home Embedded Trigger + 2 Quick Light Sliders -->
    <rect x="24" y="24" width="248" height="144" rx="36" fill="#FDE68A"/>
    <text x="48" y="88" font-family="sans-serif" font-size="24" font-weight="900" fill="#422006">🏠 Google Home</text>
    <text x="48" y="122" font-family="sans-serif" font-size="15" font-weight="800" fill="#78350F">Inbäddad panel · 5 lampor</text>

    <!-- Center: Live Network Spotify / Google TV Streamer Media Bar -->
    <g transform="translate(294, 20)">
      <rect width="840" height="152" rx="36" fill="#1E293B"/>
      <rect x="20" y="20" width="112" height="112" rx="26" fill="#065F46"/>
      <text x="62" y="92" font-family="sans-serif" font-size="44" fill="#6EE7B7">♫</text>

      <rect x="152" y="20" width="350" height="30" rx="15" fill="#064E3B"/>
      <text x="170" y="40" font-family="sans-serif" font-size="13" font-weight="900" fill="#6EE7B7">🟢 SPELAS PÅ SAMMA NÄTVERK · SPOTIFY / CAST</text>

      <text x="152" y="82" font-family="sans-serif" font-size="28" font-weight="900" fill="#FFFFFF"> Levande Musik i Hemmet</text>
      <text x="152" y="112" font-family="sans-serif" font-size="17" font-weight="600" fill="#94A3B8">Inga spellistor – bara rena kontroller när något spelas</text>

      <rect x="590" y="42" width="64" height="68" rx="26" fill="#334155"/>
      <text x="611" y="85" font-family="sans-serif" font-size="22" fill="#F8FAFC">⏮</text>
      <rect x="664" y="36" width="80" height="80" rx="26" fill="#34D399"/>
      <text x="692" y="87" font-family="sans-serif" font-size="26" font-weight="900" fill="#064E3B">⏸</text>
      <rect x="754" y="42" width="64" height="68" rx="26" fill="#334155"/>
      <text x="775" y="85" font-family="sans-serif" font-size="22" fill="#F8FAFC">⏭</text>
    </g>

    <!-- Right: Speaker Output Picker Button (Spotify / Android Media Output style) -->
    <g transform="translate(1154, 24)">
      <rect width="342" height="144" rx="36" fill="#38BDF8"/>
      <text x="32" y="64" font-family="sans-serif" font-size="21" font-weight="900" fill="#082F49">🔊 Välj högtalare ▴</text>
      <text x="32" y="96" font-family="sans-serif" font-size="16" font-weight="800" fill="#0C4A6E">✓ Vardagsrumshögtalare</text>
      <text x="32" y="122" font-family="sans-serif" font-size="16" font-weight="800" fill="#0C4A6E">✓ Google TV Streamer 4K</text>
    </g>
  </g>
</svg>`;

const proposals = [
  { name: 'forslag_1.png', svg: svg1 },
  { name: 'forslag_2.png', svg: svg2 },
  { name: 'forslag_3.png', svg: svg3 },
  { name: 'forslag_4.png', svg: svg4 },
  { name: 'forslag_5.png', svg: svg5 },
];

for (const p of proposals) {
  const outPath = path.join(outDir, p.name);
  await sharp(Buffer.from(p.svg)).png({ quality: 95 }).toFile(outPath);
  console.log('Generated:', outPath);
}
