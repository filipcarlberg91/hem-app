import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckSquare,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Share,
  Share2,
  ShoppingBag,
  Smartphone,
  StickyNote,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { FriendConnection, ShareableModule, UserAccount } from '../types';
import {
  ALL_SHAREABLE_MODULES,
  compressAvatarImage,
  getConnectionSharedModules,
  hasAnySharedModule,
  WorkspaceDataSlice,
} from '../utils/cloudHouseholdSync';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const SHAREABLE_PAGE_OPTIONS: {
  id: ShareableModule;
  label: string;
  shortDesc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'photos',
    label: 'Bilder & Album',
    shortDesc: 'Foton, album, emojis & kommentarer',
    icon: <ImageIcon className="h-3.5 w-3.5" />,
  },
  {
    id: 'shopping',
    label: 'Inköpslista',
    shortDesc: 'Handlingslista & varor',
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
  },
  {
    id: 'calendar',
    label: 'Kalender',
    shortDesc: 'Schema, händelser & kategorier',
    icon: <Calendar className="h-3.5 w-3.5" />,
  },
  {
    id: 'todo',
    label: 'Att göra',
    shortDesc: 'Uppgifter & påminnelser',
    icon: <CheckSquare className="h-3.5 w-3.5" />,
  },
  {
    id: 'notes',
    label: 'Anteckningar',
    shortDesc: 'Anteckningar & checklistor',
    icon: <StickyNote className="h-3.5 w-3.5" />,
  },
  {
    id: 'recipes',
    label: 'Recept',
    shortDesc: 'Sparade recept & måltider',
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
  },
  {
    id: 'budget',
    label: 'Budget',
    shortDesc: 'Inkomster, utgifter & månader',
    icon: <Wallet className="h-3.5 w-3.5" />,
  },
];

const PUBLIC_PWA_URL = 'https://hemmahosf.web.app/';

const AVATAR_COLORS = [
  { hex: '#183D2C', label: 'Skogsgrön' },
  { hex: '#143B5D', label: 'Västkustblå' },
  { hex: '#6E2C1B', label: 'Terrakotta' },
  { hex: '#3E276B', label: 'Ametist' },
  { hex: '#6B2146', label: 'Bär & Rosé' },
  { hex: '#0F5338', label: 'Smaragd' },
];

export function getInitials(name: string): string {
  const parts = (name || 'H').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || 'H').toUpperCase();
}

export const UserAvatarBubble: React.FC<{
  name: string;
  avatarDataUrl?: string;
  avatarColor?: string;
  sizeClass?: string;
  textClass?: string;
}> = ({
  name,
  avatarDataUrl,
  avatarColor = '#183D2C',
  sizeClass = 'h-10 w-10',
  textClass = 'text-xs',
}) => {
  if (avatarDataUrl) {
    return (
      <img
        src={avatarDataUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover border border-white/50 shadow-2xs shrink-0`}
      />
    );
  }
  return (
    <div
      style={{ backgroundColor: avatarColor || '#183D2C' }}
      className={`${sizeClass} ${textClass} rounded-full font-extrabold text-white flex items-center justify-center border border-white/40 shadow-2xs shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
};

interface AuthGateScreenProps {
  onRegister: (params: {
    email: string;
    password: string;
    name: string;
    roleTitle?: string;
    avatarDataUrl?: string;
    avatarColor: string;
  }) => Promise<void>;
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({
  onRegister,
  onLogin,
  onGoogleLogin,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);
  const [avatarColor, setAvatarColor] = useState<string>('#183D2C');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file);
      setAvatarDataUrl(compressed);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kunde inte ladda upp profilbilden.');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ange en giltig e-postadress.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Välj ett lösenord med minst 4 tecken.');
      return;
    }
    setStep(2);
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Ange ditt namn för profilen.');
      return;
    }
    setLoading(true);
    try {
      await onRegister({
        email: email.trim(),
        password,
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        avatarDataUrl,
        avatarColor,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kunde inte skapa konto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Fyll i både e-postadress och lösenord.');
      return;
    }
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kunde inte logga in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6FBF7] px-4 py-10 text-[#141E18]">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#CDE0D4] shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-[#183D2C] px-6 py-7 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 border border-white/25 shadow-md">
            <img
              src={`${import.meta.env.BASE_URL}icon.svg`}
              alt="Hem"
              className="h-11 w-11 rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Välkommen till Hem</h1>
          <p className="mt-1 text-xs text-[#CDE8D8]">
            Skapa ett personligt konto och välj själv vilka i familjen eller bland dina vänner du vill dela innehåll med
          </p>
        </div>

        {/* Mode Switcher: Skapa konto / Logga in */}
        <div className="px-6 pt-5 space-y-3">
          {onGoogleLogin && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setErrorMsg(null);
                  setLoading(true);
                  try {
                    await onGoogleLogin();
                  } catch (err: any) {
                    setErrorMsg(
                      err?.message || 'Kunde inte logga in med Google. Försök igen.'
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full min-h-[48px] rounded-2xl bg-white hover:bg-[#F3F9F5] border-2 border-[#183D2C] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#183D2C] flex items-center justify-center gap-2.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Fortsätt med Google (Säker Firebase-inloggning)</span>
              </button>
              <div className="flex items-center gap-2 text-[11px] text-[#54685C]">
                <div className="h-px flex-1 bg-[#DCEAE1]" />
                <span>eller med e-post & lösenord</span>
                <div className="h-px flex-1 bg-[#DCEAE1]" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#EBF3EE] rounded-2xl border border-[#DCEAE1]">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setStep(1);
                setErrorMsg(null);
              }}
              className={`min-h-[42px] rounded-xl text-xs font-extrabold transition-colors ${
                mode === 'register'
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'text-[#2E4035] hover:text-[#141E18]'
              }`}
            >
              Skapa konto
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`min-h-[42px] rounded-xl text-xs font-extrabold transition-colors ${
                mode === 'login'
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'text-[#2E4035] hover:text-[#141E18]'
              }`}
            >
              Logga in
            </button>
          </div>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-[#FADAD8] border border-[#E2A9A5] px-4 py-3 text-xs font-bold text-[#9E2A2B]">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#54685C] pb-1">
                <span className="font-bold text-[#183D2C]">Steg 1 av 2 · Konto & lösenord</span>
                <span>Nästa: Din profil</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  Välj din e-postadress
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-[#54685C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din.mejl@exempel.se"
                    className="w-full min-h-[46px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] pl-10 pr-4 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  Välj ett lösenord
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-[#54685C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minst 4 tecken"
                    className="w-full min-h-[46px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] pl-10 pr-11 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#54685C] hover:text-[#183D2C] p-1"
                    aria-label="Visa eller dölj lösenord"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-2xl bg-[#183D2C] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#0F291E] transition-colors shadow-md"
              >
                Fortsätt till din profil →
              </button>
            </form>
          )}

          {mode === 'register' && step === 2 && (
            <form onSubmit={handleSubmitRegister} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#54685C] pb-1">
                <span className="font-bold text-[#183D2C]">Steg 2 av 2 · Skapa din profil</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[#183D2C] font-bold hover:underline"
                >
                  ← Ändra mejl/lösenord
                </button>
              </div>

              {/* Optional Profile Picture Picker */}
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#F6FBF7] border border-[#DCEAE1] p-4">
                <UserAvatarBubble
                  name={name || email || 'Hem'}
                  avatarDataUrl={avatarDataUrl}
                  avatarColor={avatarColor}
                  sizeClass="h-20 w-20"
                  textClass="text-2xl"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] rounded-xl bg-white border border-[#CDE0D4] px-3.5 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#E4F3EA] flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{avatarDataUrl ? 'Byt profilbild' : 'Välj profilbild (frivilligt)'}</span>
                  </button>
                  {avatarDataUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarDataUrl(undefined)}
                      className="min-h-[38px] rounded-xl bg-white border border-[#E2A9A5] px-3 py-1.5 text-xs font-bold text-[#9E2A2B] hover:bg-[#FADAD8]"
                    >
                      Ta bort bild
                    </button>
                  )}
                </div>

                {!avatarDataUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-[#54685C]">Färg:</span>
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAvatarColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${
                          avatarColor === c.hex ? 'border-[#141E18] scale-110' : 'border-white'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  Ditt namn
                </label>
                <div className="relative">
                  <UserIcon className="h-4 w-4 text-[#54685C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="t.ex. Filip Carlberg"
                    className="w-full min-h-[46px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] pl-10 pr-4 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  Roll eller titel i profilen (frivilligt)
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="t.ex. Familj, Partner, Pappa, Mamma..."
                  className="w-full min-h-[44px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-2xl bg-[#183D2C] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#0F291E] transition-colors shadow-md disabled:opacity-60"
              >
                {loading ? 'Skapar ditt konto...' : 'Slutför & öppna Hem'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  E-postadress
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-[#54685C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din.mejl@exempel.se"
                    className="w-full min-h-[46px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] pl-10 pr-4 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                  Lösenord
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-[#54685C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ditt lösenord"
                    className="w-full min-h-[46px] rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] pl-10 pr-11 py-2.5 text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#54685C] hover:text-[#183D2C] p-1"
                    aria-label="Visa eller dölj lösenord"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-2xl bg-[#183D2C] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#0F291E] transition-colors shadow-md disabled:opacity-60"
              >
                {loading ? 'Loggar in...' : 'Logga in'}
              </button>
            </form>
          )}

          {/* In-App PWA Install Prompt for iOS Safari & Android Chrome */}
          {!isInstalled && (
            <div className="mt-5 pt-4 border-t border-[#DCEAE1]">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] px-4 py-2.5 text-xs font-extrabold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Installera Hem som app på hemskärmen</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowIOSGuide((v) => !v)}
                  className="w-full min-h-[42px] rounded-2xl bg-[#E4F3EA] border border-[#CDE0D4] px-4 py-2.5 text-xs font-extrabold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center justify-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>
                    {isIOS
                      ? 'Installera som app på iPhone / Safari'
                      : 'Installera på hemskärmen (iPhone / Android)'}
                  </span>
                </button>
              )}

              {showIOSGuide && (
                <div className="mt-2.5 rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] p-3.5 text-xs text-[#2E4035] space-y-1.5">
                  <div className="font-extrabold text-[#183D2C] flex items-center gap-1.5">
                    <Share className="h-3.5 w-3.5" />
                    <span>Så installerar du Hem på iPhone (Safari):</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tryck på <strong>Dela-knappen</strong> (fyrkant med pil uppåt) i Safari.</li>
                    <li>Skrolla ner och välj <strong>Lägg till på hemskärmen</strong>.</li>
                    <li>Öppna <strong>Hem</strong> direkt från hemskärmen i fullskärm!</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfileMenuModalProps {
  open: boolean;
  onClose: () => void;
  account: UserAccount;
  allAccounts: UserAccount[];
  onSaveAccount: (updated: UserAccount, newPassword?: string) => Promise<void>;
  onTransferPrivateToShared?: (
    modules: ShareableModule[],
    targetEmails?: string[]
  ) => Promise<void>;
  privateSlice?: Partial<WorkspaceDataSlice> | null;
  onLogout: () => void;
  onForceSync: () => void;
  isSyncing: boolean;
}

export const ProfileMenuModal: React.FC<ProfileMenuModalProps> = ({
  open,
  onClose,
  account,
  allAccounts,
  onSaveAccount,
  onTransferPrivateToShared,
  privateSlice,
  onLogout,
  onForceSync,
  isSyncing,
}) => {
  const [tab, setTab] = useState<'sharing' | 'profile'>('sharing');

  // Edit profile state
  const [name, setName] = useState(account.name);
  const [roleTitle, setRoleTitle] = useState(account.roleTitle || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(
    account.avatarDataUrl
  );
  const [avatarColor, setAvatarColor] = useState(account.avatarColor || '#183D2C');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // "Dela innehåll" modal state
  const [showShareContentModal, setShowShareContentModal] = useState(false);
  const [selectedTransferModules, setSelectedTransferModules] = useState<
    Record<ShareableModule, boolean>
  >({
    calendar: false,
    todo: false,
    notes: false,
    shopping: false,
    recipes: false,
    budget: false,
    photos: false,
  });
  const [transferringContent, setTransferringContent] = useState(false);

  // Sharing warning confirmation modal when turning a page from Privat -> Delad
  const [pendingShareWarning, setPendingShareWarning] = useState<{
    title: string;
    targetName: string;
    targetEmail: string;
    modulesBeingTurnedOn: ShareableModule[];
    alsoTransferPrivate: boolean;
    onConfirm: (alsoTransfer: boolean) => Promise<void>;
  } | null>(null);

  // Add friend/family state
  const [friendEmailInput, setFriendEmailInput] = useState('');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [newConnModules, setNewConnModules] = useState<
    Record<ShareableModule, boolean>
  >({
    calendar: true,
    todo: true,
    notes: true,
    shopping: true,
    recipes: true,
    budget: true,
    photos: true,
  });
  const [friendError, setFriendError] = useState<string | null>(null);
  const [copiedPwaLink, setCopiedPwaLink] = useState(false);
  const [expandedConnectionEmails, setExpandedConnectionEmails] = useState<
    Record<string, boolean>
  >({});
  const [showPageStatusSummary, setShowPageStatusSummary] = useState(false);
  const [showAddFriendForm, setShowAddFriendForm] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localConnections, setLocalConnections] = useState<FriendConnection[]>(() =>
    Array.isArray(account.connections) ? account.connections : []
  );
  const localConnectionsRef = useRef<FriendConnection[]>(
    Array.isArray(account.connections) ? account.connections : []
  );
  const lastLocalSwitchEditMsRef = useRef<number>(0);

  React.useEffect(() => {
    setName(account.name);
    setRoleTitle(account.roleTitle || '');
    setAvatarDataUrl(account.avatarDataUrl);
    setAvatarColor(account.avatarColor || '#183D2C');
    // Only sync connections from parent prop if we didn't just toggle a switch locally in the last 4 seconds
    if (Date.now() - lastLocalSwitchEditMsRef.current > 4000) {
      const nextConns = Array.isArray(account.connections) ? account.connections : [];
      setLocalConnections(nextConns);
      localConnectionsRef.current = nextConns;
    }
  }, [account]);

  if (!open) return null;

  const connections: FriendConnection[] = localConnections;

  const applyOptimisticConnections = (nextConnections: FriendConnection[]) => {
    lastLocalSwitchEditMsRef.current = Date.now();
    localConnectionsRef.current = nextConnections;
    setLocalConnections(nextConnections);
  };

  // Only show accounts that have specifically added your email address (incoming invitations),
  // never random accounts registered in the app.
  const discoverableAccounts = allAccounts.filter((other) => {
    const oMail = other.email.trim().toLowerCase();
    const myMail = account.email.trim().toLowerCase();
    if (oMail === myMail) return false;
    const alreadyInMyConnections = connections.some(
      (c) => c.email.trim().toLowerCase() === oMail
    );
    if (alreadyInMyConnections) return false;
    return (other.connections || []).some(
      (c) => c.email.trim().toLowerCase() === myMail
    );
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file);
      setAvatarDataUrl(compressed);
    } catch {
      // Ignore
    }
  };

  const handleSaveProfileForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    setStatusMessage(null);
    try {
      await onSaveAccount(
        {
          ...account,
          name: name.trim(),
          roleTitle: roleTitle.trim(),
          avatarDataUrl,
          avatarColor,
          connections: localConnectionsRef.current,
        },
        newPassword.trim() ? newPassword.trim() : undefined
      );
      setNewPassword('');
      setStatusMessage('Profilen har sparats!');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError(null);
    const cleanEmail = friendEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFriendError('Ange en giltig e-postadress.');
      return;
    }
    if (cleanEmail === account.email.trim().toLowerCase()) {
      setFriendError('Du kan inte lägga till din egen e-postadress.');
      return;
    }
    if (
      localConnectionsRef.current.some(
        (c) => c.email.trim().toLowerCase() === cleanEmail
      )
    ) {
      setFriendError('Den här personen finns redan i din lista.');
      return;
    }

    const registeredMatch = allAccounts.find(
      (a) => a.email.trim().toLowerCase() === cleanEmail
    );

    const allOn = ALL_SHAREABLE_MODULES.every((m) => newConnModules[m]);
    const sharedLabels = SHAREABLE_PAGE_OPTIONS.filter(
      (opt) => newConnModules[opt.id]
    ).map((opt) => opt.label);
    const nowIso = new Date().toISOString();

    const newConn: FriendConnection = {
      email: cleanEmail,
      name:
        registeredMatch?.name ||
        friendNameInput.trim() ||
        cleanEmail.split('@')[0],
      avatarDataUrl: registeredMatch?.avatarDataUrl,
      avatarColor: registeredMatch?.avatarColor || '#143B5D',
      shareAll: allOn,
      sharedModules: { ...newConnModules },
      addedAt: nowIso,
      updatedAt: nowIso,
    };

    const nextConnections = [...localConnectionsRef.current, newConn];
    const updatedAccount: UserAccount = {
      ...account,
      connections: nextConnections,
    };

    const turnedOnMods = ALL_SHAREABLE_MODULES.filter((m) => newConnModules[m]);
    if (turnedOnMods.length > 0) {
      setPendingShareWarning({
        title: `Dela valda sidor med ${newConn.name}?`,
        targetName: newConn.name,
        targetEmail: cleanEmail,
        modulesBeingTurnedOn: turnedOnMods,
        alsoTransferPrivate: false,
        onConfirm: async (alsoTransfer) => {
          applyOptimisticConnections(nextConnections);
          await onSaveAccount(updatedAccount);
          if (alsoTransfer && onTransferPrivateToShared) {
            await onTransferPrivateToShared(turnedOnMods, [cleanEmail]);
          }
          setFriendEmailInput('');
          setFriendNameInput('');
          setStatusMessage(
            alsoTransfer
              ? `Lade till ${newConn.name} och förde över ditt privata innehåll till delningen!`
              : `Lade till ${newConn.name} (delar: ${sharedLabels.join(', ')})!`
          );
          setTimeout(() => setStatusMessage(null), 3500);
        },
      });
      return;
    }

    applyOptimisticConnections(nextConnections);
    await onSaveAccount(updatedAccount);
    setFriendEmailInput('');
    setFriendNameInput('');
    setStatusMessage(
      `Lade till ${newConn.name} (alla sidor är privata tills du slår på en switch).`
    );
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleQuickAddRegisteredUser = async (other: UserAccount) => {
    const defaultMods: Record<ShareableModule, boolean> = {
      calendar: true,
      todo: true,
      notes: true,
      shopping: true,
      recipes: true,
      budget: true,
      photos: true,
    };
    const nowIso = new Date().toISOString();
    const newConn: FriendConnection = {
      email: other.email.trim().toLowerCase(),
      name: other.name,
      avatarDataUrl: other.avatarDataUrl,
      avatarColor: other.avatarColor || '#143B5D',
      shareAll: true,
      sharedModules: defaultMods,
      addedAt: nowIso,
      updatedAt: nowIso,
    };
    const nextConnections = [...localConnectionsRef.current, newConn];
    const updatedAccount: UserAccount = {
      ...account,
      connections: nextConnections,
    };
    setPendingShareWarning({
      title: `Dela alla sidor med ${other.name}?`,
      targetName: other.name,
      targetEmail: newConn.email,
      modulesBeingTurnedOn: [...ALL_SHAREABLE_MODULES],
      alsoTransferPrivate: false,
      onConfirm: async (alsoTransfer) => {
        applyOptimisticConnections(nextConnections);
        await onSaveAccount(updatedAccount);
        if (alsoTransfer && onTransferPrivateToShared) {
          await onTransferPrivateToShared([...ALL_SHAREABLE_MODULES], [newConn.email]);
        }
        setStatusMessage(
          alsoTransfer
            ? `Lade till ${other.name} och förde över ditt privata innehåll!`
            : `Lade till ${other.name}! Du kan välja exakt vilka sidor ni delar nedan.`
        );
        setTimeout(() => setStatusMessage(null), 3500);
      },
    });
  };

  const handleToggleShareAllForConnection = async (targetEmail: string) => {
    const cleanTarget = targetEmail.trim().toLowerCase();
    const currentList = localConnectionsRef.current;
    const existingConn = currentList.find(
      (c) => c.email.trim().toLowerCase() === cleanTarget
    );
    if (!existingConn) return;

    const currentMods = getConnectionSharedModules(existingConn);
    const isCurrentlyAllOn = ALL_SHAREABLE_MODULES.every((m) => currentMods[m]);
    const nextVal = !isCurrentlyAllOn;
    const nowIso = new Date().toISOString();

    const nextConnections = currentList.map((c) => {
      if (c.email.trim().toLowerCase() !== cleanTarget) return c;
      const updatedMods: Record<ShareableModule, boolean> = {
        calendar: nextVal,
        todo: nextVal,
        notes: nextVal,
        shopping: nextVal,
        recipes: nextVal,
        budget: nextVal,
        photos: nextVal,
      };
      return {
        ...c,
        shareAll: nextVal,
        sharedModules: updatedMods,
        updatedAt: nowIso,
      };
    });

    // Update UI switches immediately so toggling feels instant
    applyOptimisticConnections(nextConnections);

    setStatusMessage(
      nextVal
        ? `Delar nu alla sidor med ${existingConn.name}!`
        : `Stängde av all delning med ${existingConn.name} — sidorna är nu privata för dig.`
    );
    setTimeout(() => setStatusMessage(null), 3500);

    try {
      await onSaveAccount({
        ...account,
        connections: nextConnections,
      });
    } catch (err: any) {
      setFriendError(err?.message || 'Kunde inte spara ändringen i molnet.');
    }
  };

  const handleToggleSinglePageForConnection = async (
    targetEmail: string,
    module: ShareableModule
  ) => {
    const cleanTarget = targetEmail.trim().toLowerCase();
    const currentList = localConnectionsRef.current;
    const existingConn = currentList.find(
      (c) => c.email.trim().toLowerCase() === cleanTarget
    );
    if (!existingConn) return;

    const currentMods = getConnectionSharedModules(existingConn);
    const toggledTo = !currentMods[module];
    const targetName = existingConn.name;
    const pageLabel =
      SHAREABLE_PAGE_OPTIONS.find((p) => p.id === module)?.label || module;
    const nowIso = new Date().toISOString();

    const nextConnections = currentList.map((c) => {
      if (c.email.trim().toLowerCase() !== cleanTarget) return c;
      const updatedMods: Record<ShareableModule, boolean> = {
        ...currentMods,
        [module]: toggledTo,
      };
      const allOn = ALL_SHAREABLE_MODULES.every((m) => updatedMods[m]);
      return {
        ...c,
        shareAll: allOn,
        sharedModules: updatedMods,
        updatedAt: nowIso,
      };
    });

    // Flip the switch immediately in the UI
    applyOptimisticConnections(nextConnections);

    setStatusMessage(
      toggledTo
        ? `Delar nu "${pageLabel}" med ${targetName}!`
        : `Slutade dela "${pageLabel}" med ${targetName} — sidan är nu privat för dig.`
    );
    setTimeout(() => setStatusMessage(null), 3500);

    try {
      await onSaveAccount({
        ...account,
        connections: nextConnections,
      });
    } catch (err: any) {
      setFriendError(err?.message || 'Kunde inte spara ändringen i molnet.');
    }
  };

  const handleRemoveConnection = async (targetEmail: string) => {
    const cleanTarget = targetEmail.trim().toLowerCase();
    const nextConnections = localConnectionsRef.current.filter(
      (c) => c.email.trim().toLowerCase() !== cleanTarget
    );
    applyOptimisticConnections(nextConnections);
    try {
      await onSaveAccount({
        ...account,
        connections: nextConnections,
      });
    } catch (err: any) {
      setFriendError(err?.message || 'Kunde inte ta bort personen.');
    }
  };

  const getPrivateItemSummaryForModule = (mod: ShareableModule): { count: number; text: string } => {
    const ps = privateSlice || {};
    switch (mod) {
      case 'calendar': {
        const n = Array.isArray(ps.events) ? ps.events.length : 0;
        return { count: n, text: `${n} ${n === 1 ? 'händelse' : 'händelser'} sparade privat` };
      }
      case 'shopping': {
        const n = Array.isArray(ps.shopping) ? ps.shopping.length : 0;
        return { count: n, text: `${n} ${n === 1 ? 'vara' : 'varor'} sparade privat` };
      }
      case 'photos': {
        const n = Array.isArray(ps.photos) ? ps.photos.length : 0;
        const a = Array.isArray(ps.photoAlbums) ? ps.photoAlbums.length : 0;
        return {
          count: n + a,
          text: `${n} ${n === 1 ? 'bild' : 'bilder'}${a > 0 ? ` & ${a} album` : ''} sparade privat`,
        };
      }
      case 'todo': {
        const n = Array.isArray(ps.todos) ? ps.todos.length : 0;
        return { count: n, text: `${n} ${n === 1 ? 'uppgift' : 'uppgifter'} sparade privat` };
      }
      case 'notes': {
        const n = Array.isArray(ps.notes) ? ps.notes.length : 0;
        return { count: n, text: `${n} ${n === 1 ? 'anteckning' : 'anteckningar'} sparade privat` };
      }
      case 'recipes': {
        const n = Array.isArray(ps.recipes) ? ps.recipes.length : 0;
        return { count: n, text: `${n} recept sparade privat` };
      }
      case 'budget': {
        const months = Array.isArray(ps.budgetMonths) ? ps.budgetMonths : [];
        const entriesCount = months.reduce(
          (sum, m) => sum + (Array.isArray(m.entries) ? m.entries.length : 0),
          0
        );
        return {
          count: entriesCount,
          text: `${entriesCount} ${entriesCount === 1 ? 'budgetpost' : 'budgetposter'} sparade privat`,
        };
      }
    }
  };

  const handleOpenShareContentModal = () => {
    // Pre-select pages that currently have private content and are shared (or have private content)
    const initialSel: Record<ShareableModule, boolean> = {
      calendar: false,
      todo: false,
      notes: false,
      shopping: false,
      recipes: false,
      budget: false,
      photos: false,
    };
    for (const mod of ALL_SHAREABLE_MODULES) {
      const { count } = getPrivateItemSummaryForModule(mod);
      const isShared = connections.some((c) => getConnectionSharedModules(c)[mod]);
      if (count > 0 && isShared) {
        initialSel[mod] = true;
      }
    }
    setSelectedTransferModules(initialSel);
    setShowShareContentModal(true);
  };

  const handleExecuteTransferPrivateContent = async () => {
    if (!onTransferPrivateToShared) return;
    const chosen = ALL_SHAREABLE_MODULES.filter((m) => selectedTransferModules[m]);
    if (chosen.length === 0) return;
    setTransferringContent(true);
    try {
      await onTransferPrivateToShared(chosen);
      const chosenLabels = SHAREABLE_PAGE_OPTIONS.filter((p) =>
        chosen.includes(p.id)
      ).map((p) => p.label);
      setShowShareContentModal(false);
      setStatusMessage(
        `Förde över ditt privata innehåll till delad sida för: ${chosenLabels.join(', ')}!`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setTransferringContent(false);
    }
  };

  const activeSharedCount = connections.filter((c) => hasAnySharedModule(c)).length;
  const allNewConnSelected = ALL_SHAREABLE_MODULES.every((m) => newConnModules[m]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
      >
        {/* Top Profile Header */}
        <div className="bg-[#183D2C] px-6 py-5 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatarBubble
              name={account.name}
              avatarDataUrl={account.avatarDataUrl}
              avatarColor={account.avatarColor}
              sizeClass="h-13 w-13"
              textClass="text-base"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold truncate">{account.name}</h2>
                {account.roleTitle && (
                  <span className="text-xs text-[#A6F2C6] font-semibold truncate">
                    · {account.roleTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#CDE8D8] truncate">{account.email}</p>
              <p className="mt-0.5 text-[11px] text-[#A6F2C6] font-semibold">
                {activeSharedCount > 0
                  ? `Delar utvalda sidor med ${activeSharedCount} ${
                      activeSharedCount === 1 ? 'person' : 'personer'
                    }`
                  : 'Alla sidor är privata · Välj nedan vad du vill dela med familj eller vänner'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 shrink-0"
            aria-label="Stäng profilmeny"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Profile Menu (Material 3 Expressive Segmented Pills) */}
        <div className="px-6 pt-4 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#E4F3EA] rounded-full border border-[#CDE0D4]">
            <button
              type="button"
              onClick={() => setTab('sharing')}
              className={`min-h-[42px] rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                tab === 'sharing'
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'text-[#183D2C] hover:bg-white/60'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Delning & Familj ({connections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`min-h-[42px] rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                tab === 'profile'
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'text-[#183D2C] hover:bg-white/60'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Redigera min profil</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mx-6 mt-3 rounded-2xl bg-[#D8F3E3] border border-[#8CE6B4] px-4 py-2.5 text-xs font-bold text-[#183D2C] flex items-center gap-2 shrink-0">
            <Check className="h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'sharing' ? (
            <>
              {/* Connections List with Collapsible Per-Page Menu */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#141E18]">
                      Mina vänner & familj ({connections.length})
                    </h3>
                    <p className="text-[11px] text-[#54685C]">
                      Tryck på den fällbara menyn under en person för att välja vilka sidor ni delar.
                    </p>
                  </div>
                </div>

                {connections.length === 0 ? (
                  <div className="rounded-3xl bg-white border border-[#DCEAE1] p-6 text-center space-y-1">
                    <Share2 className="h-6 w-6 text-[#54685C] mx-auto mb-1" />
                    <p className="text-xs font-bold text-[#141E18]">
                      Inga vänner eller familjemedlemmar tillagda ännu
                    </p>
                    <p className="text-xs text-[#54685C]">
                      Alla sidor i appen fungerar som vanligt och är helt privata för dig. Bjud in familj eller vänner nedan och välj vilka sidor du vill dela!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map((conn) => {
                      const isRegistered = allAccounts.some(
                        (a) =>
                          a.email.trim().toLowerCase() ===
                          conn.email.trim().toLowerCase()
                      );
                      const modState = getConnectionSharedModules(conn);
                      const sharedPagesList = SHAREABLE_PAGE_OPTIONS.filter(
                        (p) => modState[p.id]
                      );
                      const allOn = sharedPagesList.length === SHAREABLE_PAGE_OPTIONS.length;
                      const anyOn = sharedPagesList.length > 0;
                      const isExpanded = Boolean(expandedConnectionEmails[conn.email]);
                      const firstName = conn.name.split(' ')[0];

                      return (
                        <div
                          key={conn.email}
                          className={`rounded-3xl border p-4 transition-colors space-y-3 ${
                            anyOn
                              ? 'bg-white border-[#183D2C] shadow-xs'
                              : 'bg-white/80 border-[#DCEAE1]'
                          }`}
                        >
                          {/* Top Row: Person Info + Master "Alla sidor" Switch + Remove */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatarBubble
                                name={conn.name}
                                avatarDataUrl={conn.avatarDataUrl}
                                avatarColor={conn.avatarColor}
                                sizeClass="h-11 w-11"
                                textClass="text-xs"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-extrabold text-[#141E18] truncate">
                                    {conn.name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#54685C]">
                                    ·{' '}
                                    {isRegistered
                                      ? 'Registrerad i Hem'
                                      : 'Inväntar registrering'}
                                  </span>
                                </div>
                                <div className="text-xs text-[#54685C] truncate">
                                  {conn.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Master Switch: Alla sidor */}
                              <div className="flex flex-col items-end">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={allOn}
                                  onClick={() =>
                                    handleToggleShareAllForConnection(conn.email)
                                  }
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                                    allOn ? 'bg-[#183D2C]' : 'bg-[#CBD8D0]'
                                  }`}
                                  title="Slå på eller av alla sidor samtidigt för denna person"
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                                      allOn ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                                <span className="mt-1 text-[10px] font-extrabold text-[#54685C]">
                                  Alla sidor
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveConnection(conn.email)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6A7F72] hover:bg-[#FADAD8] hover:text-[#9E2A2B]"
                                title="Ta bort person"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Per-Page Menu Trigger (Fällbar meny per person) */}
                          <div className="pt-2.5 border-t border-[#EBF2EE]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedConnectionEmails((prev) => ({
                                  ...prev,
                                  [conn.email]: !prev[conn.email],
                                }))
                              }
                              aria-expanded={isExpanded}
                              className="w-full rounded-2xl bg-[#F4F8F5] hover:bg-[#E4F3EA] border border-[#CDE0D4] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-extrabold text-[#183D2C] truncate">
                                  Välj vilka sidor du delar med {firstName}
                                </div>
                                <div className="mt-0.5 text-[11px] font-semibold text-[#54685C] truncate">
                                  {sharedPagesList.length === 0
                                    ? 'Inga sidor delas just nu (helt privat)'
                                    : allOn
                                    ? `Alla ${SHAREABLE_PAGE_OPTIONS.length} sidor delas i realtid`
                                    : `${sharedPagesList.length} av ${SHAREABLE_PAGE_OPTIONS.length} sidor delas (${sharedPagesList
                                        .map((p) => p.label)
                                        .join(', ')})`}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="rounded-full bg-[#183D2C] text-white px-2.5 py-1 text-[10px] font-extrabold">
                                  {sharedPagesList.length} av {SHAREABLE_PAGE_OPTIONS.length}
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#CDE0D4] text-[#183D2C]">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </span>
                              </div>
                            </button>

                            {/* Collapsible Content: 7 Per-Page Switches */}
                            {isExpanded && (
                              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {SHAREABLE_PAGE_OPTIONS.map((page) => {
                                  const isShared = Boolean(modState[page.id]);
                                  return (
                                    <div
                                      key={page.id}
                                      onClick={() =>
                                        handleToggleSinglePageForConnection(
                                          conn.email,
                                          page.id
                                        )
                                      }
                                      className={`rounded-2xl border px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
                                        isShared
                                          ? 'bg-[#EAF5EE] border-[#183D2C] text-[#141E18]'
                                          : 'bg-[#F8FBF9] border-[#DCEAE1] text-[#54685C] hover:bg-[#F1F7F3]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                            isShared
                                              ? 'bg-[#183D2C] text-white'
                                              : 'bg-[#E2ECE6] text-[#54685C]'
                                          }`}
                                        >
                                          {page.icon}
                                        </span>
                                        <div className="min-w-0">
                                          <div className="text-xs font-extrabold truncate">
                                            {page.label}
                                          </div>
                                          <div className="text-[10px] opacity-80 truncate">
                                            {isShared ? 'Delas i realtid' : 'Privat för er'}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isShared}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleSinglePageForConnection(
                                            conn.email,
                                            page.id
                                          );
                                        }}
                                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                          isShared ? 'bg-[#183D2C]' : 'bg-[#CBD8D0]'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs transition-transform ${
                                            isShared ? 'translate-x-4' : 'translate-x-0.5'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compact Collapsible Action Row: Bjud in person + Status per sida + Dela privat innehåll */}
              <div className="space-y-2.5">
                {/* 1. Collapsible Add Friend / Family Member Section */}
                <div className="rounded-3xl bg-white border border-[#DCEAE1] overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowAddFriendForm((prev) => !prev)}
                    aria-expanded={showAddFriendForm}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6FBF7] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C] shrink-0">
                        <UserPlus className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#141E18] truncate">
                          Bjud in / lägg till ny person
                        </div>
                        <div className="text-[11px] text-[#54685C] truncate">
                          Lägg till familj eller vänner via e-post
                        </div>
                      </div>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F8F5] border border-[#CDE0D4] text-[#183D2C] shrink-0">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          showAddFriendForm ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {showAddFriendForm && (
                    <form
                      onSubmit={handleAddConnection}
                      className="px-4 pb-4 pt-2 border-t border-[#EBF2EE] space-y-3"
                    >
                      {friendError && (
                        <div className="rounded-xl bg-[#FADAD8] px-3 py-2 text-xs font-bold text-[#9E2A2B]">
                          {friendError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#2E4035] mb-1">
                            Personens e-postadress *
                          </label>
                          <input
                            type="email"
                            required
                            value={friendEmailInput}
                            onChange={(e) => setFriendEmailInput(e.target.value)}
                            placeholder="namn@exempel.se"
                            className="w-full min-h-[42px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3.5 py-2 text-xs text-[#141E18]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#2E4035] mb-1">
                            Namn (hämtas automatiskt om registrerad)
                          </label>
                          <input
                            type="text"
                            value={friendNameInput}
                            onChange={(e) => setFriendNameInput(e.target.value)}
                            placeholder="t.ex. Partner / Vän"
                            className="w-full min-h-[42px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3.5 py-2 text-xs text-[#141E18]"
                          />
                        </div>
                      </div>

                      {/* Choose which pages to share with this new person */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-[#2E4035]">
                            Välj sidor att dela med personen:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !allNewConnSelected;
                              setNewConnModules({
                                calendar: nextVal,
                                todo: nextVal,
                                notes: nextVal,
                                shopping: nextVal,
                                recipes: nextVal,
                                budget: nextVal,
                                photos: nextVal,
                              });
                            }}
                            className="text-[11px] font-bold text-[#183D2C] hover:underline"
                          >
                            {allNewConnSelected ? 'Avmarkera alla sidor' : 'Välj alla sidor'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {SHAREABLE_PAGE_OPTIONS.map((page) => {
                            const active = newConnModules[page.id];
                            return (
                              <button
                                key={page.id}
                                type="button"
                                onClick={() =>
                                  setNewConnModules((prev) => ({
                                    ...prev,
                                    [page.id]: !prev[page.id],
                                  }))
                                }
                                className={`min-h-[36px] rounded-full border px-3 py-1.5 text-left text-[11px] font-bold flex items-center justify-between gap-1.5 transition-colors ${
                                  active
                                    ? 'bg-[#183D2C] text-white border-[#183D2C]'
                                    : 'bg-[#F6FBF7] text-[#54685C] border-[#DCEAE1]'
                                }`}
                              >
                                <span className="truncate">{page.label}</span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="min-h-[40px] rounded-full bg-[#183D2C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E] flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Lägg till person</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Collapsible Per-Page Privacy vs Shared Summary Box */}
                <div className="rounded-3xl bg-[#F0F7F3] border border-[#CDE0D4] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPageStatusSummary((prev) => !prev)}
                    aria-expanded={showPageStatusSummary}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#E4F3EA] transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#183D2C]">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>Status per sida i din app (Delat eller Privat)</span>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#CDE0D4] text-[#183D2C] shrink-0">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          showPageStatusSummary ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {showPageStatusSummary && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#DCEAE1] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {SHAREABLE_PAGE_OPTIONS.map((page) => {
                          const sharedPeople = connections
                            .filter((c) => getConnectionSharedModules(c)[page.id])
                            .map((c) => c.name.split(' ')[0]);
                          const isShared = sharedPeople.length > 0;
                          return (
                            <div
                              key={page.id}
                              className="rounded-2xl bg-white border border-[#DCEAE1] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="font-bold text-[#141E18] truncate">
                                {page.label}
                              </span>
                              {isShared ? (
                                <span className="text-[11px] font-extrabold text-[#183D2C] truncate">
                                  Delas med {sharedPeople.join(', ')}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#54685C] flex items-center gap-1 shrink-0">
                                  <Lock className="h-3 w-3" />
                                  <span>Privat</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl bg-white border border-[#CDE0D4] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <p className="text-[11px] text-[#2E4035]">
                          Vill du föra över innehåll från dina privata sidor till den delade sidan?
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenShareContentModal}
                          className="min-h-[36px] rounded-full bg-[#183D2C] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#0F291E] flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Dela innehåll</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick suggestions if other family members have already registered in the app */}
              {discoverableAccounts.length > 0 && (
                <div className="rounded-2xl bg-[#EBF4EE] border border-[#CDE0D4] p-4 space-y-2.5">
                  <div className="text-xs font-extrabold text-[#183D2C]">
                    Personer som bjudit in dig — tryck för att lägga till:
                  </div>
                  <div className="space-y-2">
                    {discoverableAccounts.map((other) => (
                      <div
                        key={other.id}
                        className="rounded-xl bg-white border border-[#DCEAE1] p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatarBubble
                            name={other.name}
                            avatarDataUrl={other.avatarDataUrl}
                            avatarColor={other.avatarColor}
                            sizeClass="h-9 w-9"
                            textClass="text-xs"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#141E18] truncate">
                              {other.name}
                            </div>
                            <div className="text-[11px] text-[#54685C] truncate">
                              {other.email}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickAddRegisteredUser(other)}
                          className="min-h-[36px] rounded-xl bg-[#183D2C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0F291E] whitespace-nowrap shrink-0"
                        >
                          + Lägg till
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Edit My Profile Tab */
            <form onSubmit={handleSaveProfileForm} className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white border border-[#DCEAE1] p-4">
                <UserAvatarBubble
                  name={name || account.name}
                  avatarDataUrl={avatarDataUrl}
                  avatarColor={avatarColor}
                  sizeClass="h-20 w-20"
                  textClass="text-2xl"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3.5 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#E4F3EA] flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{avatarDataUrl ? 'Byt profilbild' : 'Ladda upp profilbild (frivilligt)'}</span>
                  </button>
                  {avatarDataUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarDataUrl(undefined)}
                      className="min-h-[38px] rounded-xl bg-white border border-[#E2A9A5] px-3 py-1.5 text-xs font-bold text-[#9E2A2B] hover:bg-[#FADAD8]"
                    >
                      Ta bort bild
                    </button>
                  )}
                </div>

                {!avatarDataUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-[#54685C]">Profilfärg:</span>
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAvatarColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${
                          avatarColor === c.hex ? 'border-[#141E18] scale-110' : 'border-white'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Ditt namn
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Roll / Status (frivilligt)
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="t.ex. Familj, Partner, Pappa, Mamma..."
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  E-postadress (ditt konto-ID)
                </label>
                <input
                  type="email"
                  disabled
                  value={account.email}
                  className="w-full min-h-[44px] rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] px-4 py-2 text-sm text-[#54685C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Byt lösenord (lämna tomt för att behålla nuvarande)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nytt lösenord (valfritt)"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full min-h-[46px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-extrabold text-white hover:bg-[#0F291E] transition-colors"
              >
                {savingProfile ? 'Sparar profil...' : 'Spara profiländringar'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions: Sync, Privacy Policy & Log out */}
        <div className="px-6 py-4 border-t border-[#DCEAE1] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] rounded-full border border-[#E2A9A5] bg-[#FADAD8]/50 px-4 py-2 text-xs font-bold text-[#9E2A2B] hover:bg-[#FADAD8] flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logga ut</span>
            </button>
            <a
              href={`${import.meta.env.BASE_URL}integritetspolicy.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#54685C] hover:text-[#183D2C] underline"
            >
              Integritetspolicy
            </a>
            <a
              href={`${import.meta.env.BASE_URL}play-store/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#54685C] hover:text-[#183D2C] underline"
            >
              Play Store-bilder
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onForceSync}
              disabled={isSyncing}
              className="min-h-[40px] rounded-full bg-[#E4F3EA] border border-[#CDE0D4] px-4 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synkar...' : 'Synka nu'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-full bg-[#183D2C] px-6 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E] transition-colors"
            >
              Klar
            </button>
          </div>
        </div>

        {/* Sub-Modal 1: "Dela innehåll" (Transfer Private Content to Shared Page) */}
        {showShareContentModal && (
          <div
            onClick={() => setShowShareContentModal(false)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#183D2C] px-5 py-4 text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    <Share2 className="h-4 w-4 text-[#A6F2C6]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">Dela innehåll</h3>
                    <p className="text-[11px] text-[#CDE8D8]">
                      Välj vilka privata sidor som ska föras över till den delade sidan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareContentModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Warning box */}
                <div className="rounded-2xl bg-[#FFF8E7] border border-[#F59E0B]/50 p-3.5 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#78350F] space-y-1 leading-relaxed">
                    <div className="font-extrabold text-[#92400E]">
                      Viktigt att veta om delade sidor:
                    </div>
                    <p>
                      Allt som läggs till medan en sida är <strong>delad</strong> försvinner när sidan görs <strong>privat</strong> igen.
                    </p>
                    <p>
                      Det du redan har skrivit när sidan var <strong>privat</strong> finns däremot alltid kvar i förvar och kommer tillbaka när du slutar dela.
                    </p>
                  </div>
                </div>

                {connections.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-[#DCEAE1] p-5 text-center space-y-2">
                    <Users className="h-6 w-6 text-[#54685C] mx-auto" />
                    <p className="text-xs font-extrabold text-[#141E18]">
                      Du har inte lagt till någon person att dela med ännu
                    </p>
                    <p className="text-xs text-[#54685C]">
                      Stäng det här fönstret och lägg till din partner, familjemedlem eller vän under ”Bjud in / lägg till ny person i din krets” först.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#141E18]">
                        Välj sidor att föra över från privat till delad:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const anySelected = ALL_SHAREABLE_MODULES.some(
                            (m) => selectedTransferModules[m]
                          );
                          const next: Record<ShareableModule, boolean> = {
                            calendar: !anySelected,
                            todo: !anySelected,
                            notes: !anySelected,
                            shopping: !anySelected,
                            recipes: !anySelected,
                            budget: !anySelected,
                            photos: !anySelected,
                          };
                          setSelectedTransferModules(next);
                        }}
                        className="text-[11px] font-bold text-[#183D2C] hover:underline"
                      >
                        {ALL_SHAREABLE_MODULES.some((m) => selectedTransferModules[m])
                          ? 'Avmarkera alla'
                          : 'Markera alla sidor'}
                      </button>
                    </div>

                    {SHAREABLE_PAGE_OPTIONS.map((page) => {
                      const checked = Boolean(selectedTransferModules[page.id]);
                      const { count, text } = getPrivateItemSummaryForModule(page.id);
                      const sharedWith = connections
                        .filter((c) => getConnectionSharedModules(c)[page.id])
                        .map((c) => c.name.split(' ')[0]);
                      const isCurrentlyShared = sharedWith.length > 0;

                      return (
                        <div
                          key={page.id}
                          onClick={() =>
                            setSelectedTransferModules((prev) => ({
                              ...prev,
                              [page.id]: !prev[page.id],
                            }))
                          }
                          className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                            checked
                              ? 'bg-[#EAF5EE] border-[#183D2C]'
                              : 'bg-white border-[#DCEAE1] hover:bg-[#F3F9F5]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                                checked
                                  ? 'bg-[#183D2C] border-[#183D2C] text-white'
                                  : 'bg-white border-[#A5B8AD]'
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-[#141E18]">
                                  {page.label}
                                </span>
                                <span
                                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                    isCurrentlyShared
                                      ? 'bg-[#D8F3E3] text-[#183D2C]'
                                      : 'bg-[#EBF2EE] text-[#54685C]'
                                  }`}
                                >
                                  {isCurrentlyShared
                                    ? `Delas med ${sharedWith.join(', ')}`
                                    : 'Privat (aktiverar delning)'}
                                </span>
                              </div>
                              <div
                                className={`text-[11px] mt-0.5 ${
                                  count > 0
                                    ? 'font-bold text-[#183D2C]'
                                    : 'text-[#6A7F72]'
                                }`}
                              >
                                {text}
                              </div>
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-[#54685C] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-[#DCEAE1] bg-white flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowShareContentModal(false)}
                  className="min-h-[40px] rounded-xl border border-[#CDE0D4] bg-white px-4 py-2 text-xs font-bold text-[#2E4035] hover:bg-[#F6FBF7]"
                >
                  Avbryt
                </button>
                {connections.length > 0 && (
                  <button
                    type="button"
                    disabled={
                      transferringContent ||
                      !ALL_SHAREABLE_MODULES.some((m) => selectedTransferModules[m])
                    }
                    onClick={handleExecuteTransferPrivateContent}
                    className="min-h-[40px] rounded-xl bg-[#183D2C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>
                      {transferringContent
                        ? 'För över innehåll...'
                        : 'För över till delad sida'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Modal 2: Warning Confirmation when turning ON sharing for a page */}
        {pendingShareWarning && (
          <div
            onClick={() => setPendingShareWarning(null)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white border border-[#CDE0D4] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#183D2C] px-5 py-4 text-white flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FDE68A]/20 text-[#FDE68A] shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">
                    {pendingShareWarning.title}
                  </h3>
                  <p className="text-[11px] text-[#CDE8D8]">
                    Viktig information innan du startar delningen
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-[#2E4035]">
                <div className="rounded-2xl bg-[#FFF8E7] border border-[#F59E0B]/50 p-3.5 space-y-1.5 leading-relaxed">
                  <div className="font-extrabold text-[#92400E] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" />
                    <span>Det som läggs till under delning försvinner vid privat läge</span>
                  </div>
                  <p className="text-[#78350F]">
                    Allt som läggs till medan sidan är <strong>delad</strong> försvinner när sidan görs <strong>privat</strong> igen.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EAF5EE] border border-[#CDE0D4] p-3.5 space-y-1 leading-relaxed">
                  <div className="font-extrabold text-[#183D2C]">
                    Ditt privata innehåll är tryggt sparat
                  </div>
                  <p>
                    Det du har lagt in när sidan var privat ligger kvar i förvar och kommer tillbaka så fort du slutar dela sidan. Du kan även föra över ditt privata innehåll när som helst via knappen <strong>Dela innehåll</strong> på profilsidan.
                  </p>
                </div>

                {/* Optional quick checkbox to also transfer private content right now */}
                <label className="rounded-2xl bg-[#F6FBF7] border border-[#CDE0D4] p-3.5 flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pendingShareWarning.alsoTransferPrivate}
                    onChange={(e) =>
                      setPendingShareWarning((prev) =>
                        prev
                          ? { ...prev, alsoTransferPrivate: e.target.checked }
                          : null
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-[#183D2C] rounded"
                  />
                  <span className="text-xs font-bold text-[#141E18] leading-snug">
                    För även över mitt sparade privata innehåll till den delade sidan direkt
                  </span>
                </label>
              </div>

              <div className="px-5 py-4 border-t border-[#DCEAE1] bg-[#F6FBF7] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingShareWarning(null)}
                  className="min-h-[40px] rounded-xl border border-[#CDE0D4] bg-white px-4 py-2 text-xs font-bold text-[#2E4035] hover:bg-[#EBF2EE]"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const warn = pendingShareWarning;
                    setPendingShareWarning(null);
                    if (warn) {
                      await warn.onConfirm(warn.alsoTransferPrivate);
                    }
                  }}
                  className="min-h-[40px] rounded-xl bg-[#183D2C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E]"
                >
                  Jag förstår, starta delning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
