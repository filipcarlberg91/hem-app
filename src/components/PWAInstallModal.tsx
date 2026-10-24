import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  X,
  Share,
  Copy,
  Check,
  Users,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getApiUrl } from '../utils/apiUrl';

interface PWAInstallControlProps {
  memberName: string;
  onChangeMemberName: (name: string) => void;
}

export const PWAInstallControl: React.FC<PWAInstallControlProps> = ({
  memberName,
  onChangeMemberName,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Direct GitHub Push State
  const [repoInput, setRepoInput] = useState(() => localStorage.getItem('vn_gh_repo') || '');
  const [githubToken, setGithubToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    ok?: boolean;
    message?: string;
    actionsUrl?: string;
  } | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyOrShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hem — Familjeapp (iOS & Android)',
          text: 'Öppna och lägg till vår gemensamma Hem-app på hemskärmen!',
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleDirectGitHubPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim() || !githubToken.trim()) return;
    setIsPushing(true);
    setPushResult(null);
    localStorage.setItem('vn_gh_repo', repoInput.trim());

    try {
      const res = await fetch(getApiUrl('/api/github/push'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoInput: repoInput.trim(),
          githubToken: githubToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPushResult({
          ok: false,
          message: data.error || 'Kunde inte skicka filer till GitHub.',
        });
      } else {
        setPushResult({
          ok: true,
          message: `Alla ${data.filesCount} filer (och ${
            data.workflowIncluded ? 'Android .aab-workflow' : 'projektfiler'
          }) har nu pushats till branchen "${data.branch}"!`,
          actionsUrl: data.actionsUrl,
        });
      }
    } catch (err: any) {
      setPushResult({
        ok: false,
        message: err?.message || 'Nätverksfel vid GitHub-uppladdning.',
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="min-h-[46px] rounded-2xl border border-[#CDE0D4] bg-white px-4 py-2.5 text-xs font-bold text-[#183D2C] shadow-lg hover:bg-[#F1F8F4] flex items-center gap-3 transition-colors whitespace-nowrap shrink-0"
        title="Intern testning för Android & iOS samt familjesynk"
      >
        <span>Intern testning: iOS & Android ({memberName})</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D8F3E3] text-[#183D2C]">
          <Smartphone className="h-4 w-4" />
        </span>
      </button>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCEAE1] bg-[#F6FBF7] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141E18]">
                    Intern testning: Android & iOS
                  </h3>
                  <p className="text-xs text-[#4E6357]">
                    Realtidssynk, GitHub-uppladdning & .aab-generering
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[#2E4035]">
              {/* Ready-to-Download Signed Android .aab Card */}
              <div className="rounded-2xl bg-[#183D2C] text-white p-4 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A6F2C6]">
                    Klart! Signerade .aab-filer för Google Play Console
                  </span>
                  <span className="rounded-lg bg-white/15 px-2 py-0.5 text-[10px] font-mono">
                    Telefon + Wear OS
                  </span>
                </div>
                <p className="text-xs text-white/90">
                  Välj <strong>Telefon/Surfplatta (.aab)</strong> för vanliga spåret i Google Play Console (utan <code>android.hardware.type.watch</code>), eller <strong>Wear OS Klocka (.aab)</strong> för klockspåret (med <code>required=&quot;true&quot;</code>):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://filipcarlberg91.github.io/hem-app/Hem-Google-Play-Signed.aab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] rounded-xl bg-[#A6F2C6] px-4 py-2 text-xs font-bold text-[#082114] hover:bg-[#8CE6B4] flex items-center justify-center gap-2 text-center"
                  >
                    Ladda ner .aab (Telefon / Play Console)
                  </a>
                  <a
                    href="https://filipcarlberg91.github.io/hem-app/Hem-WearOS-Google-Play-Signed.aab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25 flex items-center justify-center gap-2 text-center"
                  >
                    Ladda ner .aab (Wear OS Klocka)
                  </a>
                </div>
              </div>

              {/* Direct GitHub Push Card */}
              <form
                onSubmit={handleDirectGitHubPush}
                className="rounded-2xl bg-[#E7F3EC] border border-[#C6DFD0] p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#141E18]">
                  <UploadCloud className="h-4 w-4 text-[#183D2C]" />
                  <span>Tvinga uppladdning av alla nya filer direkt till GitHub</span>
                </div>
                <p className="text-xs text-[#38493F]">
                  Om AI Studios inbyggda GitHub-knapp inte skickar upp de senaste ändringarna kan du skicka upp hela koden (inklusive automatisk <code>.aab</code>-byggare) direkt härifrån:
                </p>
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="Ditt GitHub-repo, t.ex. filipcarlberg/hem"
                  className="w-full min-h-[40px] rounded-xl bg-white border border-[#CDE0D4] px-3 py-1.5 text-xs font-semibold text-[#141E18]"
                />
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="GitHub Personal Access Token (ghp_...)"
                  className="w-full min-h-[40px] rounded-xl bg-white border border-[#CDE0D4] px-3 py-1.5 text-xs font-semibold text-[#141E18]"
                />
                <p className="text-[11px] text-[#4E6357]">
                  Skapa en token på{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=HemApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold text-[#183D2C]"
                  >
                    github.com/settings/tokens/new
                  </a>{' '}
                  (med <strong>repo</strong> och <strong>workflow</strong> ikryssade).
                </p>
                <button
                  type="submit"
                  disabled={isPushing || !repoInput.trim() || !githubToken.trim()}
                  className="w-full min-h-[42px] rounded-xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPushing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Laddar upp alla filer till GitHub...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Skicka upp alla nya filer + bygg .aab på GitHub
                    </>
                  )}
                </button>

                {pushResult && (
                  <div
                    className={`rounded-xl p-3 text-xs font-semibold ${
                      pushResult.ok
                        ? 'bg-[#D8F3E3] text-[#0F291E]'
                        : 'bg-[#FADAD8] text-[#9E2A2B]'
                    }`}
                  >
                    <div>{pushResult.message}</div>
                    {pushResult.actionsUrl && (
                      <a
                        href={pushResult.actionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block underline font-bold"
                      >
                        Öppna GitHub Actions för att ladda ner din .aab-fil →
                      </a>
                    )}
                  </div>
                )}
              </form>

              {/* Active Device / Member Profile Selector */}
              <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4 space-y-2.5">
                <div className="text-xs font-bold text-[#183D2C]">
                  Vem använder denna telefon/enhet?
                </div>
                <p className="text-xs text-[#4E6357]">
                  Alla ändringar i kalender, inköpslista, uppgifter, anteckningar, recept och budget synkas automatiskt mellan era enheter och skickar notis till den andra.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onChangeMemberName('Filip')}
                    className={`min-h-[42px] rounded-xl text-xs font-bold border transition-colors ${
                      memberName === 'Filip'
                        ? 'bg-[#183D2C] text-white border-[#183D2C]'
                        : 'bg-[#F6FBF7] text-[#2E4035] border-[#CDE0D4]'
                    }`}
                  >
                    Filip (Android)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMemberName('Min fru')}
                    className={`min-h-[42px] rounded-xl text-xs font-bold border transition-colors ${
                      memberName === 'Min fru'
                        ? 'bg-[#183D2C] text-white border-[#183D2C]'
                        : 'bg-[#F6FBF7] text-[#2E4035] border-[#CDE0D4]'
                    }`}
                  >
                    Min fru (iOS)
                  </button>
                </div>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => onChangeMemberName(e.target.value)}
                  placeholder="Eller skriv valfritt namn..."
                  className="w-full min-h-[40px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3 py-1.5 text-xs font-semibold text-[#141E18]"
                />
              </div>

              {/* Share Link to Wife's iPhone */}
              <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4 space-y-2.5">
                <div className="text-xs font-bold text-[#141E18]">
                  Dela appen för intern testning
                </div>
                <p className="text-xs text-[#38493F]">
                  Skicka länken till din fru så att hon kan öppna den i Safari på sin iPhone.
                </p>
                <button
                  type="button"
                  onClick={handleCopyOrShare}
                  className="w-full min-h-[42px] rounded-xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Länk kopierad!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Dela / Kopiera testlänk
                    </>
                  )}
                </button>
              </div>

              {/* iOS Instructions for Wife */}
              <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4">
                <div className="flex items-center gap-2 font-bold text-[#141E18]">
                  <Share className="h-4 w-4 text-[#183D2C]" />
                  För din fru på iPhone (iOS)
                </div>
                <ol className="mt-2 space-y-1 text-xs leading-relaxed text-[#4E6357] list-decimal pl-4">
                  <li>Öppna länken i <strong>Safari</strong> på iPhone.</li>
                  <li>Tryck på <strong>Dela-knappen</strong> längst ner i Safari.</li>
                  <li>Välj <strong>Lägg till på hemskärmen</strong>.</li>
                  <li>
                    Öppna appen <strong>Hem</strong> från hemskärmen och välj <em>Min fru (iOS)</em> ovan – då körs den i fullskärm med iOS safe-area-stöd och webbläsarnotiser (iOS 16.4+).
                  </li>
                </ol>
              </div>

              {/* Android Instructions */}
              <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4">
                <div className="flex items-center gap-2 font-bold text-[#141E18]">
                  <CheckCircle2 className="h-4 w-4 text-[#183D2C]" />
                  För dig på Android
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#4E6357]">
                  {isInstalled
                    ? 'Appen körs redan installerad i helskärmsläge på din enhet.'
                    : 'Klicka på knappen nedan eller välj "Installera app" i Chrome-menyn för att installera Hem med Material 3 Expressive-ikon på hemskärmen.'}
                </p>
                {isInstallable && !isInstalled && (
                  <button
                    onClick={install}
                    className="mt-3 min-h-[42px] rounded-xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E]"
                  >
                    Installera på Android nu
                  </button>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-[#DCEAE1] bg-[#F6FBF7] flex justify-end shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2 text-xs font-bold text-white hover:bg-[#0F291E]"
              >
                Klar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
