import React, { useState } from 'react';
import { X, Tv, Speaker, Home, LayoutGrid, Sparkles, Maximize2, CheckCircle2 } from 'lucide-react';

export interface HubProposalItem {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  accentColor: string;
  highlights: string[];
}

export const HUB_MODE_PROPOSALS: HubProposalItem[] = [
  {
    id: 1,
    title: 'Förslag 1 · Pixel Hub Split (Levande Fotoram/Video + Widget-Grid)',
    subtitle: 'Klassisk Pixel Tablet Hub Mode-uppdelning med stor rörlig bild/video till vänster och sid-widgets i olika storlekar till höger.',
    imageUrl: '/assets/hub_proposals/forslag_1.png',
    accentColor: '#34D399',
    highlights: [
      'Vänster (54%): Fullskärms levande fotoram, video eller rörlig konst med jätteklocka, Google Home-knapp och inbäddad snabbpanel.',
      'Nätverks-Mediakort (Spotify Connect & Cast): Dyker upp automatiskt när någon i samma Wi-Fi startar musik på högtalarna eller TV:n – inga spellistor, bara rena kontroller + högtalarväljare.',
      'Höger (46%): Anpassningsbart Material 3 Expressive-rutnät med widgets för appens sidor i Liten (1×1), Mellan (2×1) och Stor (2×2).',
    ],
  },
  {
    id: 2,
    title: 'Förslag 2 · Fullskärms Cinema & Flytande Öar (Med Öppen Högtalarmeny)',
    subtitle: 'Rörlig video eller bild över hela skärmen med svävande Material 3 Expressive-widgets och Android 15/Spotify-högtalarväljare.',
    imageUrl: '/assets/hub_proposals/forslag_2.png',
    accentColor: '#38BDF8',
    highlights: [
      '100 % fullskärmsbakgrund för video, rörlig bild eller familjealbum utan fast delningslinje.',
      'Öppen Högtalarmeny (Output Switcher): Precis som i Spotify och Androids mediameny kan man kryssa i vilka högtalare/Google TV Streamer 4K som ska spela och justera volymen per rum.',
      'Flytande M3 Expressive-widgets längs högerkanten (t.ex. Kalender 2×1, Recept 2×1, Inköpslista 1×2, Anteckningar 1×2).',
    ],
  },
  {
    id: 3,
    title: 'Förslag 3 · Smart Hem & Cast Command Center (Inbäddad Google Home-panel)',
    subtitle: 'Visar den inbäddade Google Home-panelen öppen sida vid sida med nätverkets Cast-spelare och familjens sid-widgets.',
    imageUrl: '/assets/hub_proposals/forslag_3.png',
    accentColor: '#FDBA74',
    highlights: [
      'Inbäddad Google Home-vy till vänster med Google Home-liknande svepreglage för alla rum samt direktknapp till Google Home-appen.',
      'Dedikerad Google TV Streamer 4K & Spotify Connect-vy i mitten som känner av uppspelning i samma Wi-Fi-nätverk.',
      'Tydliga högtalarpiller för att snabbt växla ljudet mellan Vardagsrum, Kök, Google TV Streamer 4K eller Hela hemmet.',
    ],
  },
  {
    id: 4,
    title: 'Förslag 4 · Material 3 Expressive "Morphing Shapes" (Skulpterade Former)',
    subtitle: 'Maximalt Material 3 Expressive-designspråk med organiska squircle-former, pastellkontraster och vågig tidslinje.',
    imageUrl: '/assets/hub_proposals/forslag_4.png',
    accentColor: '#E9D5FF',
    highlights: [
      'Levande bild/video inramad i en stor organisk Material 3 Expressive-form med överlappande jättesiffror.',
      'Pastelltonat M3 Expressive-mediakort med vågig tidslinje, skulpterade Play/Pause-knappar och högtalarväljare-piller.',
      'Sid-widgets i unika M3 Expressive-former: Stor rundad Kalender (2×2), hög kapsel för Inköpslista (1×2) samt kvadratiska kort för Att göra och Budget.',
    ],
  },
  {
    id: 5,
    title: 'Förslag 5 · Alla 7 Sidor som Widgets (S/M/L) + Pixel Hub-Docka Längst Ner',
    subtitle: 'Fritt anpassningsbar widget-canvas för appens alla 7 sidor ovanför en svävande Pixel Hub-docka.',
    imageUrl: '/assets/hub_proposals/forslag_5.png',
    accentColor: '#93C5FD',
    highlights: [
      'Plats för widgets från samtliga 7 sidor i appen (Kalender, Inköpslista, Att göra, Anteckningar, Recept, Budget, Bilder) i valfri storlek (Liten, Mellan, Stor).',
      'Svävande Pixel Hub-docka längst ner som samlar Google Home-knappen (inbäddad panel), nätverkets Spotify/Cast-spelare och Högtalarväljaren på en fast plats.',
      'Ren överblick där hela familjen både kan bocka av varor, läsa recept, styra lampor och byta högtalare direkt på skärmsläckaren.',
    ],
  },
];

interface HubModeProposalsModalProps {
  open: boolean;
  onClose: () => void;
}

export const HubModeProposalsModal: React.FC<HubModeProposalsModalProps> = ({
  open,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [fullscreenImage, setFullscreenImage] = useState<HubProposalItem | null>(null);

  if (!open) return null;

  const activeProposal =
    HUB_MODE_PROPOSALS.find((p) => p.id === selectedId) || HUB_MODE_PROPOSALS[0];

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#12161F] text-white rounded-[36px] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-[#181E2C]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                5 Förslag: Pixel Tablet Hub Mode (Skärmsläckare)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Cast &amp; Spotify i samma nätverk · Google TV Streamer 4K · Högtalarväljare · Inbäddad Google Home · Sid-widgets i olika storlekar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Technical Feasibility Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-3xl bg-emerald-950/60 border border-emerald-400/25 p-3.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Speaker className="w-4 h-4" /> Spotify i samma nätverk
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Via <strong>Spotify Connect API</strong> + Android MediaSession ser surfplattan direkt när din fru startar musik på högtalarna i hemmet och visar endast rena mediakontroller.
              </p>
            </div>

            <div className="rounded-3xl bg-sky-950/60 border border-sky-400/25 p-3.5">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Tv className="w-4 h-4" /> Google TV Streamer 4K &amp; Cast
              </div>
              <p className="text-xs text-sky-100/90 leading-relaxed">
                Via Androids <strong>MediaRouter2 / Google Cast</strong> på samma Wi-Fi upptäcks aktiv uppspelning på Google TV Streamer 4K och Nest/Cast-högtalare automatiskt.
              </p>
            </div>

            <div className="rounded-3xl bg-amber-950/60 border border-amber-400/25 p-3.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Home className="w-4 h-4" /> Inbäddad Google Home
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Knapp som öppnar en <strong>inbäddad Google Home-panel</strong> direkt på skärmsläckaren (med svepreglage för lampor/rum) + genväg till Google Home-appen.
              </p>
            </div>

            <div className="rounded-3xl bg-purple-950/60 border border-purple-400/25 p-3.5">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider mb-1">
                <LayoutGrid className="w-4 h-4" /> M3 Expressive Sid-Widgets
              </div>
              <p className="text-xs text-purple-100/90 leading-relaxed">
                Lägg till widgets för <strong>alla 7 sidor</strong> i appen i storlekarna <strong>Liten (1×1)</strong>, <strong>Mellan (2×1)</strong> eller <strong>Stor (2×2)</strong>.
              </p>
            </div>
          </div>

          {/* 5 Proposal Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {HUB_MODE_PROPOSALS.map((prop) => {
              const isSelected = prop.id === selectedId;
              return (
                <button
                  key={prop.id}
                  onClick={() => setSelectedId(prop.id)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-lg scale-[1.02]'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: prop.accentColor }}
                  />
                  Förslag {prop.id}
                </button>
              );
            })}
          </div>

          {/* Active Proposal Large Preview */}
          <div className="rounded-[32px] bg-[#1A2130] border border-white/15 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {activeProposal.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  {activeProposal.subtitle}
                </p>
              </div>
              <button
                onClick={() => setFullscreenImage(activeProposal)}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Förstora bild
              </button>
            </div>

            <div
              onClick={() => setFullscreenImage(activeProposal)}
              className="relative rounded-[24px] overflow-hidden border border-white/15 cursor-pointer group bg-black"
            >
              <img
                src={activeProposal.imageUrl}
                alt={activeProposal.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {activeProposal.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-start gap-2.5"
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: activeProposal.accentColor }}
                  />
                  <span className="text-xs text-slate-200 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All 5 Proposals Thumbnail Grid for Quick Comparison */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
              Alla 5 förslag sida vid sida (klicka på ett kort för att granska)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {HUB_MODE_PROPOSALS.map((prop) => {
                const isSelected = prop.id === selectedId;
                return (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedId(prop.id)}
                    className={`text-left rounded-[22px] overflow-hidden border transition-all flex flex-col ${
                      isSelected
                        ? 'border-white ring-2 ring-white/40 bg-white/15'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[16/10] object-cover"
                    />
                    <div className="p-2.5">
                      <div className="text-xs font-extrabold text-white truncate">
                        Förslag {prop.id}
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                        {prop.title.replace(/^Förslag \d+ · /, '')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-6xl flex items-center justify-between mb-3">
            <div className="text-base sm:text-lg font-extrabold text-white">
              {fullscreenImage.title}
            </div>
            <button
              onClick={() => setFullscreenImage(null)}
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Stäng helskärm
            </button>
          </div>
          <img
            src={fullscreenImage.imageUrl}
            alt={fullscreenImage.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-3xl border border-white/20 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
