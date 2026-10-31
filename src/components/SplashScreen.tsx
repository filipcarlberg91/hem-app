import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  forceOpen?: boolean;
  onFinish?: () => void;
}

const SPLASH_SESSION_KEY = 'hem_splash_shown_v1';

export const SplashScreen: React.FC<SplashScreenProps> = ({ forceOpen = false, onFinish }) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (forceOpen) return true;
    if (typeof window === 'undefined') return false;
    const hash = (window.location.hash || '').toLowerCase();
    if (
      hash.startsWith('#wear') ||
      hash.startsWith('#widget') ||
      hash.startsWith('#screensaver')
    ) {
      return false;
    }
    try {
      return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const [step, setStep] = useState<number>(0);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (forceOpen) {
      setFadingOut(false);
      setStep(0);
      setVisible(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    const handleReplay = () => {
      setFadingOut(false);
      setStep(0);
      setVisible(true);
    };
    window.addEventListener('hem-replay-splash', handleReplay);
    return () => window.removeEventListener('hem-replay-splash', handleReplay);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Choreographed spring-block house assembly ("Förslag 1: Klossbygget")
    const t1 = setTimeout(() => setStep(1), 60); // 1. Lawn foundation pops in
    const t2 = setTimeout(() => setStep(2), 340); // 2. Left & right walls + terracotta door drop in
    const t3 = setTimeout(() => setStep(3), 720); // 3. Chimney + forest-green roof land with squash-and-stretch
    const t4 = setTimeout(() => setStep(4), 1060); // 4. Golden window glow + sage chimney puffs + "Hem" title
    const t5 = setTimeout(() => setFadingOut(true), 2250); // Smooth fade out
    const t6 = setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
      } catch {
        // Ignore storage restrictions
      }
      setVisible(false);
      onFinish?.();
    }, 2620);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [visible, onFinish]);

  if (!visible) return null;

  const handleSkip = () => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // Ignore
    }
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 240);
  };

  return (
    <div
      onClick={handleSkip}
      role="presentation"
      style={{
        transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(1.03)' : 'scale(1)',
      }}
      className="fixed inset-0 z-[120] bg-[#F6FBF7] flex flex-col items-center justify-center select-none overflow-hidden font-['Roboto',sans-serif] cursor-pointer"
    >
      {/* Subtle Nordic Sage ambient backdrop rings */}
      <div
        style={{
          transition: 'transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 700ms ease-out',
          transform: step >= 1 ? 'scale(1)' : 'scale(0.4)',
          opacity: step >= 1 ? 1 : 0,
        }}
        className="absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full bg-[#E4F3EA]/70 pointer-events-none"
      />
      <div
        style={{
          transition: 'transform 1100ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 800ms ease-out',
          transform: step >= 2 ? 'scale(1)' : 'scale(0.5)',
          opacity: step >= 2 ? 0.65 : 0,
        }}
        className="absolute w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] rounded-full bg-[#D3EDE0]/75 pointer-events-none"
      />

      {/* Interactive SVG House Block Assembly ("Förslag 1: Klossbygget") */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          style={{
            transition: 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform:
              step === 3
                ? 'scaleX(1.06) scaleY(0.94) translateY(5px)'
                : 'scaleX(1) scaleY(1) translateY(0px)',
          }}
          className="w-[240px] h-[240px] sm:w-[270px] sm:h-[270px] flex items-center justify-center"
        >
          <svg
            viewBox="0 0 280 270"
            className="w-full h-full overflow-visible"
            aria-label="Hem logotyp byggs upp"
          >
            <defs>
              <filter id="hemBlockShadow" x="-15%" y="-15%" width="130%" height="135%">
                <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#183D2C" floodOpacity="0.14" />
              </filter>
              <filter id="hemWindowGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 4B. Playful Sage-Green Chimney Smoke Puffs */}
            <g
              style={{
                transition: 'opacity 450ms ease-out, transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: step >= 4 ? 1 : 0,
                transform: step >= 4 ? 'translateY(0px) scale(1)' : 'translateY(22px) scale(0.5)',
                transformOrigin: '198px 52px',
              }}
            >
              <circle cx="198" cy="44" r="9" fill="#A6F2C6" opacity="0.92" />
              <circle cx="212" cy="27" r="12" fill="#A6F2C6" opacity="0.78" />
              <circle cx="196" cy="11" r="7.5" fill="#10B981" opacity="0.55" />
            </g>

            {/* 3A. Terracotta Chimney Block */}
            <g
              style={{
                transition: 'transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 260ms ease-out',
                opacity: step >= 3 ? 1 : 0,
                transform: step >= 3 ? 'translateY(0px) scale(1)' : 'translateY(-65px) scale(0.8)',
                transformOrigin: '196px 78px',
              }}
              filter="url(#hemBlockShadow)"
            >
              <rect x="180" y="54" width="32" height="48" rx="9" fill="#EA580C" />
              <rect x="176" y="50" width="40" height="10" rx="5" fill="#C2410C" />
            </g>

            {/* 2A. House Main Cream-White Left & Right Wall Blocks */}
            <g
              style={{
                transition: 'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 260ms ease-out',
                opacity: step >= 2 ? 1 : 0,
                transform: step >= 2 ? 'translateY(0px) scale(1)' : 'translateY(-55px) scale(0.84)',
                transformOrigin: '140px 168px',
              }}
              filter="url(#hemBlockShadow)"
            >
              {/* Main Tactile House Body */}
              <rect
                x="62"
                y="114"
                width="156"
                height="108"
                rx="22"
                fill="#FFFFFF"
                stroke="#CDE3D5"
                strokeWidth="3.5"
              />
              {/* Subtle Architectural Block Divider */}
              <line
                x1="66"
                y1="166"
                x2="214"
                y2="166"
                stroke="#E4F3EA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* 2B. Warm Terracotta Front Door Block */}
            <g
              style={{
                transition: 'transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 70ms, opacity 260ms ease-out 70ms',
                opacity: step >= 2 ? 1 : 0,
                transform: step >= 2 ? 'translateY(0px) scale(1)' : 'translateY(42px) scale(0.75)',
                transformOrigin: '140px 194px',
              }}
            >
              <rect x="121" y="160" width="38" height="62" rx="14" fill="#EA580C" />
              <circle cx="150" cy="193" r="3.5" fill="#FEF08A" />
            </g>

            {/* 4A. Left & Right Windows (Light up with warm golden glow in Step 4) */}
            <g
              style={{
                transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out',
                opacity: step >= 2 ? 1 : 0,
                transform: step >= 2 ? 'scale(1)' : 'scale(0.6)',
                transformOrigin: '140px 146px',
              }}
            >
              {/* Left Window */}
              <rect
                x="80"
                y="132"
                width="30"
                height="28"
                rx="8"
                fill={step >= 4 ? '#FACC15' : '#E4F3EA'}
                stroke="#183D2C"
                strokeWidth="2.5"
                filter={step >= 4 ? 'url(#hemWindowGlow)' : undefined}
              />
              <line x1="95" y1="134" x2="95" y2="158" stroke="#183D2C" strokeWidth="2" />
              <line x1="82" y1="146" x2="108" y2="146" stroke="#183D2C" strokeWidth="2" />

              {/* Right Window */}
              <rect
                x="170"
                y="132"
                width="30"
                height="28"
                rx="8"
                fill={step >= 4 ? '#FACC15' : '#E4F3EA'}
                stroke="#183D2C"
                strokeWidth="2.5"
                filter={step >= 4 ? 'url(#hemWindowGlow)' : undefined}
              />
              <line x1="185" y1="134" x2="185" y2="158" stroke="#183D2C" strokeWidth="2" />
              <line x1="172" y1="146" x2="198" y2="146" stroke="#183D2C" strokeWidth="2" />
            </g>

            {/* 3B. Expressive Forest-Green Roof Block */}
            <g
              style={{
                transition: 'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease-out',
                opacity: step >= 3 ? 1 : 0,
                transform: step >= 3 ? 'translateY(0px) scale(1)' : 'translateY(-78px) scale(0.86)',
                transformOrigin: '140px 92px',
              }}
              filter="url(#hemBlockShadow)"
            >
              <path
                d="M42 122 L131 50 C136.5 45.5 143.5 45.5 149 50 L238 122 C244 127 240.5 136 232.5 136 L47.5 136 C39.5 136 36 127 42 122 Z"
                fill="#183D2C"
              />
              {/* Attic Sage Round Window */}
              <circle
                cx="140"
                cy="98"
                r="12"
                fill={step >= 4 ? '#FEF08A' : '#A6F2C6'}
                stroke="#0F291E"
                strokeWidth="3"
              />
            </g>

            {/* 1. Forest-Green & Mint Lawn Foundation Block */}
            <g
              style={{
                transition: 'transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease-out',
                opacity: step >= 1 ? 1 : 0,
                transform: step >= 1 ? 'scaleX(1) scaleY(1)' : 'scaleX(0.25) scaleY(0.4)',
                transformOrigin: '140px 224px',
              }}
              filter="url(#hemBlockShadow)"
            >
              <rect x="34" y="214" width="212" height="22" rx="11" fill="#183D2C" />
              <rect x="48" y="218" width="184" height="7" rx="3.5" fill="#A6F2C6" opacity="0.85" />
            </g>
          </svg>
        </div>

        {/* Brand Title & Subtitle in Roboto */}
        <div
          style={{
            transition: 'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 380ms ease-out',
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? 'translateY(0px)' : 'translateY(14px)',
          }}
          className="text-center mt-1"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D8F3E3] border border-[#B5E2C8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#183D2C] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Välkommen hem</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#183D2C]">
            Hem
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#4E6357] mt-1">
            Hela familjens vardagsnav
          </p>
        </div>
      </div>
    </div>
  );
};
