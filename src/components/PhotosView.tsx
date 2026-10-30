import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Folders,
  Grid,
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Smile,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  PhotoAlbum,
  PhotoComment,
  PhotoItem,
  UserAccount,
} from '../types';
import { compressGalleryPhoto } from '../utils/cloudHouseholdSync';
import { UserAvatarBubble } from './ProfileAccountModal';

const QUICK_REACTION_EMOJIS = ['❤️', '😍', '😂', '🥰', '🔥', '👏', '🎉', '👍'];
const COMMENT_EMOJI_PALETTE = [
  '❤️',
  '😍',
  '🥰',
  '😂',
  '🤣',
  '😊',
  '🤩',
  '🥳',
  '🔥',
  '✨',
  '👏',
  '🙌',
  '👍',
  '🌸',
  '☀️',
  '🍕',
  '🥂',
  '🏡',
  '🐶',
  '🐱',
  '👶',
  '💪',
  '🙏',
  '💯',
];

const GRID_ZOOM_PRESETS = [
  {
    level: 1,
    label: 'Extra små',
    shortLabel: 'XS',
    gridClass: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1',
    radiusClass: 'rounded-lg',
  },
  {
    level: 2,
    label: 'Små',
    shortLabel: 'S',
    gridClass: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5',
    radiusClass: 'rounded-xl',
  },
  {
    level: 3,
    label: 'Mellan',
    shortLabel: 'M',
    gridClass: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2',
    radiusClass: 'rounded-2xl',
  },
  {
    level: 4,
    label: 'Stora',
    shortLabel: 'L',
    gridClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
    radiusClass: 'rounded-2xl',
  },
  {
    level: 5,
    label: 'Extra stora',
    shortLabel: 'XL',
    gridClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
    radiusClass: 'rounded-3xl',
  },
] as const;

interface PhotosViewProps {
  photos: PhotoItem[];
  albums: PhotoAlbum[];
  currentAccount: UserAccount;
  sharedWithNames: string[];
  onOpenSharingSettings: () => void;
  onAddPhotos: (
    newPhotos: Omit<PhotoItem, 'id' | 'createdAt'>[],
    albumNameForNotif?: string,
    newAlbumToCreate?: { name: string; description?: string }
  ) => void;
  onDeletePhoto: (photo: PhotoItem) => void;
  onToggleFavoritePhoto: (photoId: string) => void;
  onMovePhotoToAlbum: (photoId: string, albumId: string | undefined) => void;
  onToggleReaction: (photoId: string, emoji: string) => void;
  onAddComment: (photoId: string, text: string) => void;
  onDeleteComment: (photoId: string, commentId: string) => void;
  onCreateAlbum: (name: string, description?: string) => PhotoAlbum;
  onDeleteAlbum: (album: PhotoAlbum) => void;
}

export function downloadPhotoFile(photo: PhotoItem) {
  try {
    const cleanCaption = (photo.caption || 'hem-bild')
      .toLowerCase()
      .replace(/[^a-z0-9åäö]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    const filename = `${cleanCaption || 'hem-bild'}-${photo.id.slice(-5)}.jpg`;

    if (photo.imageUrl.startsWith('data:')) {
      const parts = photo.imageUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
      return;
    }

    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Fallback
  }
}

function formatPhotoDayHeader(isoDateStr: string): string {
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return 'Tidigare';
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
    const dateKey = d.toISOString().slice(0, 10);

    if (dateKey === todayKey) return 'Idag';
    if (dateKey === yesterday) return 'Igår';

    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      ...(sameYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return 'Bilder';
  }
}

export const PhotosView: React.FC<PhotosViewProps> = ({
  photos,
  albums,
  currentAccount,
  sharedWithNames,
  onOpenSharingSettings,
  onAddPhotos,
  onDeletePhoto,
  onToggleFavoritePhoto,
  onMovePhotoToAlbum,
  onToggleReaction,
  onAddComment,
  onDeleteComment,
  onCreateAlbum,
  onDeleteAlbum,
}) => {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');

  // Google Photos-style grid zoom level (1 = smallest/most columns, 5 = largest)
  const [gridZoomLevel, setGridZoomLevel] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('vn_photos_grid_zoom_v1'));
      if (saved >= 1 && saved <= 5) return saved;
    } catch {
      // Ignore
    }
    return 3;
  });

  const updateGridZoom = (nextLevel: number) => {
    const clamped = Math.max(1, Math.min(5, nextLevel));
    setGridZoomLevel(clamped);
    try {
      localStorage.setItem('vn_photos_grid_zoom_v1', String(clamped));
    } catch {
      // Ignore
    }
  };

  // Upload Photo Modal / Sheet State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAlbumId, setUploadAlbumId] = useState<string>('');
  const [inlineNewAlbumName, setInlineNewAlbumName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCaptionEmojiPicker, setShowCaptionEmojiPicker] = useState(false);

  // Fullscreen / Photo Detail Modal State (opened when tapping a photo in the Google Photos grid)
  const [fullscreenPhotoId, setFullscreenPhotoId] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fullscreenComment, setFullscreenComment] = useState('');
  const [showFullscreenEmojis, setShowFullscreenEmojis] = useState(false);
  const [showAllReactionEmojis, setShowAllReactionEmojis] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter photos by selected album and sort newest first
  const filteredPhotos = useMemo(() => {
    return [...photos]
      .filter((p) => {
        if (selectedAlbumId === 'all') return true;
        if (selectedAlbumId === 'favorites') return Boolean(p.favorite);
        return p.albumId === selectedAlbumId;
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [photos, selectedAlbumId]);

  // Group photos by day like Google Photos
  const groupedPhotosByDate = useMemo(() => {
    const groups: { dateKey: string; label: string; items: PhotoItem[] }[] = [];
    const map = new Map<string, { dateKey: string; label: string; items: PhotoItem[] }>();
    for (const photo of filteredPhotos) {
      const dateKey = (photo.createdAt || '').slice(0, 10) || 'unknown';
      let grp = map.get(dateKey);
      if (!grp) {
        grp = {
          dateKey,
          label: formatPhotoDayHeader(photo.createdAt),
          items: [],
        };
        map.set(dateKey, grp);
        groups.push(grp);
      }
      grp.items.push(photo);
    }
    return groups;
  }, [filteredPhotos]);

  const activeZoomSpec =
    GRID_ZOOM_PRESETS.find((p) => p.level === gridZoomLevel) || GRID_ZOOM_PRESETS[2];

  const activeAlbumObj = albums.find((a) => a.id === selectedAlbumId);

  const fullscreenIndex = fullscreenPhotoId
    ? filteredPhotos.findIndex((p) => p.id === fullscreenPhotoId)
    : -1;
  const fullscreenPhoto =
    fullscreenIndex >= 0
      ? filteredPhotos[fullscreenIndex]
      : photos.find((p) => p.id === fullscreenPhotoId) || null;

  // Keyboard navigation in Photo Detail Lightbox
  React.useEffect(() => {
    if (!fullscreenPhotoId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenPhotoId(null);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight' && fullscreenIndex >= 0) {
        const next = filteredPhotos[(fullscreenIndex + 1) % filteredPhotos.length];
        if (next) {
          setFullscreenPhotoId(next.id);
          setIsZoomed(false);
        }
      } else if (e.key === 'ArrowLeft' && fullscreenIndex >= 0) {
        const prev =
          filteredPhotos[
            (fullscreenIndex - 1 + filteredPhotos.length) % filteredPhotos.length
          ];
        if (prev) {
          setFullscreenPhotoId(prev.id);
          setIsZoomed(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenPhotoId, fullscreenIndex, filteredPhotos]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsCompressing(true);
    setShowUploadModal(true);
    if (selectedAlbumId !== 'all' && selectedAlbumId !== 'favorites') {
      setUploadAlbumId(selectedAlbumId);
    }
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const dataUrl = await compressGalleryPhoto(fileList[i]);
        compressedList.push(dataUrl);
      }
      setPendingPreviews((prev) => [...prev, ...compressedList]);
    } catch {
      // Ignore invalid image file
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingPreviews.length === 0) return;

    const targetAlbumId: string | undefined =
      uploadAlbumId && uploadAlbumId !== 'none' ? uploadAlbumId : undefined;
    let targetAlbumName: string | undefined = albums.find(
      (a) => a.id === targetAlbumId
    )?.name;

    let inlineAlbumSpec: { name: string; description?: string } | undefined;
    if (uploadAlbumId === '__new__' && inlineNewAlbumName.trim()) {
      inlineAlbumSpec = { name: inlineNewAlbumName.trim() };
      targetAlbumName = inlineNewAlbumName.trim();
    }

    const itemsToAdd: Omit<PhotoItem, 'id' | 'createdAt'>[] = pendingPreviews.map(
      (dataUrl) => ({
        albumId: targetAlbumId,
        imageUrl: dataUrl,
        caption: uploadCaption.trim(),
        uploadedBy: currentAccount.name,
        uploadedByEmail: currentAccount.email,
        uploadedByAvatarDataUrl: currentAccount.avatarDataUrl,
        uploadedByAvatarColor: currentAccount.avatarColor,
        reactions: [],
        comments: [],
        favorite: false,
      })
    );

    onAddPhotos(itemsToAdd, targetAlbumName, inlineAlbumSpec);
    setPendingPreviews([]);
    setUploadCaption('');
    setInlineNewAlbumName('');
    setShowCaptionEmojiPicker(false);
    setShowUploadModal(false);
  };

  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    const created = onCreateAlbum(newAlbumName.trim(), newAlbumDesc.trim() || undefined);
    setNewAlbumName('');
    setNewAlbumDesc('');
    setShowCreateAlbumModal(false);
    setSelectedAlbumId(created.id);
  };

  const handleSendFullscreenComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullscreenPhoto || !fullscreenComment.trim()) return;
    onAddComment(fullscreenPhoto.id, fullscreenComment.trim());
    setFullscreenComment('');
    setShowFullscreenEmojis(false);
  };

  // Compute grouped reactions for currently open photo in modal
  const fullscreenReactionGroups = useMemo(() => {
    const map = new Map<
      string,
      { count: number; names: string[]; reactedByMe: boolean }
    >();
    if (!fullscreenPhoto) return map;
    for (const r of fullscreenPhoto.reactions || []) {
      const prev = map.get(r.emoji) || {
        count: 0,
        names: [],
        reactedByMe: false,
      };
      prev.count += 1;
      prev.names.push(r.userName);
      if (
        r.userEmail.trim().toLowerCase() ===
        currentAccount.email.trim().toLowerCase()
      ) {
        prev.reactedByMe = true;
      }
      map.set(r.emoji, prev);
    }
    return map;
  }, [fullscreenPhoto, currentAccount.email]);

  return (
    <div className="space-y-5">
      {/* Hidden multi-photo file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Top Header Banner */}
      <section className="rounded-3xl bg-[#183D2C] text-white p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A6F2C6]">
            <span>Bilder & Familjealbum</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenSharingSettings}
              className="inline-flex items-center gap-1.5 underline decoration-[#A6F2C6]/60 hover:text-white transition-colors"
            >
              {sharedWithNames.length > 0 ? (
                <>
                  <Users className="h-3.5 w-3.5" />
                  <span>Delas med: {sharedWithNames.join(', ')}</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Privat sida (endast du ser dessa bilder — ändra i profilen)</span>
                </>
              )}
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Era bilder, minnen & album
          </h1>
          <p className="text-xs sm:text-sm text-[#CDE8D8] max-w-2xl">
            Bläddra i Google Foto-vy, justera bildstorleken och tryck på valfri bild för att öppna helskärm, reagera med emojis och kommentera.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateAlbumModal(true)}
            className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-xs font-extrabold text-white flex items-center gap-2 transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nytt album</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] rounded-2xl bg-[#A6F2C6] hover:bg-[#8CE6B4] px-5 py-2.5 text-xs font-extrabold text-[#082114] flex items-center gap-2 shadow-md transition-colors"
          >
            <Camera className="h-4 w-4" />
            <span>Ladda upp bilder</span>
          </button>
        </div>
      </section>

      {/* Albums Filter Bar + Google Photos Grid Size Controller */}
      <section className="rounded-3xl bg-white border border-[#D8E6DD] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#183D2C]">
            <Folders className="h-4 w-4" />
            <span>Album ({albums.length})</span>
            {activeAlbumObj && (
              <button
                type="button"
                onClick={() => onDeleteAlbum(activeAlbumObj)}
                className="ml-2 text-xs font-bold text-[#9E2A2B] hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Ta bort "{activeAlbumObj.name}"</span>
              </button>
            )}
          </div>

          {/* Google Photos Grid Size / Zoom Control */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#F2F8F4] border border-[#D5E8DC] rounded-2xl px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#183D2C]">
              <Grid className="h-3.5 w-3.5" />
              <span>Bildstorlek:</span>
              <span className="text-[#4A6355] font-semibold">
                {activeZoomSpec.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateGridZoom(gridZoomLevel - 1)}
                disabled={gridZoomLevel <= 1}
                className="h-7 w-7 rounded-xl bg-white border border-[#CDE0D4] text-[#183D2C] flex items-center justify-center hover:bg-[#E4F3EA] disabled:opacity-40 transition-colors"
                title="Mindre bilder (fler i bredd)"
                aria-label="Mindre bilder"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <div className="hidden xs:flex items-center gap-1 px-1">
                {GRID_ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset.level}
                    type="button"
                    onClick={() => updateGridZoom(preset.level)}
                    className={`h-6 min-w-[26px] px-1.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      gridZoomLevel === preset.level
                        ? 'bg-[#183D2C] text-[#A6F2C6] shadow-2xs'
                        : 'text-[#4A6355] hover:bg-white'
                    }`}
                    title={preset.label}
                  >
                    {preset.shortLabel}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => updateGridZoom(gridZoomLevel + 1)}
                disabled={gridZoomLevel >= 5}
                className="h-7 w-7 rounded-xl bg-white border border-[#CDE0D4] text-[#183D2C] flex items-center justify-center hover:bg-[#E4F3EA] disabled:opacity-40 transition-colors"
                title="Större bilder"
                aria-label="Större bilder"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedAlbumId('all')}
            className={`min-h-[40px] rounded-2xl px-4 py-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors shrink-0 ${
              selectedAlbumId === 'all'
                ? 'bg-[#183D2C] text-white shadow-xs'
                : 'bg-[#F2F8F4] text-[#2E4035] hover:bg-[#E4F3EA]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Alla bilder ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedAlbumId('favorites')}
            className={`min-h-[40px] rounded-2xl px-4 py-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors shrink-0 ${
              selectedAlbumId === 'favorites'
                ? 'bg-[#183D2C] text-white shadow-xs'
                : 'bg-[#F2F8F4] text-[#2E4035] hover:bg-[#E4F3EA]'
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Favoriter ({photos.filter((p) => p.favorite).length})</span>
          </button>

          {albums.map((alb) => {
            const count = photos.filter((p) => p.albumId === alb.id).length;
            const isSelected = selectedAlbumId === alb.id;
            return (
              <button
                key={alb.id}
                type="button"
                onClick={() => setSelectedAlbumId(alb.id)}
                className={`min-h-[40px] rounded-2xl px-4 py-2 text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#183D2C] text-white shadow-xs'
                    : 'bg-[#F2F8F4] text-[#2E4035] hover:bg-[#E4F3EA]'
                }`}
              >
                <Folders className="h-3.5 w-3.5" />
                <span>
                  {alb.name} ({count})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowCreateAlbumModal(true)}
            className="min-h-[40px] rounded-2xl border border-dashed border-[#8AB59B] bg-[#F6FBF7] hover:bg-[#E4F3EA] px-3.5 py-2 text-xs font-extrabold text-[#183D2C] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Skapa album</span>
          </button>
        </div>

        {activeAlbumObj?.description && (
          <p className="text-xs text-[#54685C] pt-1 border-t border-[#EBF2EE]">
            {activeAlbumObj.description}
          </p>
        )}
      </section>

      {/* Google Photos-Style GridView or Empty State */}
      {filteredPhotos.length === 0 ? (
        <section className="rounded-3xl bg-white border border-[#D8E6DD] p-10 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E4F3EA] text-[#183D2C]">
            <ImageIcon className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-extrabold text-[#141E18]">
              {selectedAlbumId === 'all'
                ? 'Inga bilder uppladdade ännu'
                : selectedAlbumId === 'favorites'
                ? 'Inga favoritmarkerade bilder ännu'
                : `Inga bilder i albumet "${activeAlbumObj?.name || ''}" ännu`}
            </h2>
            <p className="text-xs text-[#54685C]">
              Ladda upp bilder från din telefon, surfplatta eller dator. Tryck på en bild i rutnätet för att öppna den, reagera med emojis och kommentera.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] rounded-2xl bg-[#183D2C] hover:bg-[#0F291E] px-5 py-2.5 text-xs font-extrabold text-white flex items-center gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span>Välj bilder att ladda upp</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateAlbumModal(true)}
              className="min-h-[44px] rounded-2xl bg-[#E4F3EA] hover:bg-[#D8F3E3] border border-[#CDE0D4] px-4 py-2.5 text-xs font-extrabold text-[#183D2C] flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Skapa nytt album</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          {groupedPhotosByDate.map((group) => (
            <div key={group.dateKey} className="space-y-2.5">
              {/* Date Group Header (Google Photos style) */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm sm:text-base font-extrabold text-[#141E18] capitalize">
                  {group.label}
                </h2>
                <span className="text-[11px] font-bold text-[#54685C] font-mono tabular-nums">
                  {group.items.length} {group.items.length === 1 ? 'bild' : 'bilder'}
                </span>
              </div>

              {/* Responsive Square Photo Grid */}
              <div className={`grid ${activeZoomSpec.gridClass}`}>
                {group.items.map((photo) => {
                  const reactionCount = (photo.reactions || []).length;
                  const commentCount = (photo.comments || []).length;
                  const topEmojis = Array.from(
                    new Set((photo.reactions || []).map((r) => r.emoji))
                  ).slice(0, 2);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => {
                        setFullscreenPhotoId(photo.id);
                        setIsZoomed(false);
                        setShowAllReactionEmojis(false);
                        setShowFullscreenEmojis(false);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFullscreenPhotoId(photo.id);
                          setIsZoomed(false);
                        }
                      }}
                      className={`group relative aspect-square overflow-hidden bg-[#E4EFE8] cursor-pointer select-none border border-[#D8E6DD]/80 shadow-2xs ${activeZoomSpec.radiusClass}`}
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || 'Familjebild'}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Subtle top-right favorite button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoritePhoto(photo.id);
                        }}
                        className={`absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-xs transition-all ${
                          photo.favorite
                            ? 'bg-black/55 text-[#FBBF24] opacity-100'
                            : 'bg-black/35 text-white opacity-0 group-hover:opacity-100'
                        }`}
                        title="Favoritmarkera"
                        aria-label="Favoritmarkera"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${photo.favorite ? 'fill-current' : ''}`}
                        />
                      </button>

                      {/* Bottom overlay with reaction/comment count indicators when present */}
                      {(reactionCount > 0 || commentCount > 0 || (gridZoomLevel >= 4 && photo.caption)) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 py-1.5 flex items-end justify-between gap-1.5 text-white">
                          {gridZoomLevel >= 4 && photo.caption ? (
                            <span className="text-[11px] font-semibold truncate">
                              {photo.caption}
                            </span>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            {reactionCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-black/55 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-extrabold">
                                <span>{topEmojis.join('') || '❤️'}</span>
                                <span>{reactionCount}</span>
                              </span>
                            )}
                            {commentCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-extrabold">
                                <MessageCircle className="h-2.5 w-2.5" />
                                <span>{commentCount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Upload Photos Modal */}
      {showUploadModal && (
        <div
          onClick={() => setShowUploadModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            <div className="bg-[#183D2C] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="h-5 w-5 text-[#A6F2C6]" />
                <h3 className="text-base font-extrabold">Ladda upp bilder</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmUpload}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {isCompressing && (
                <div className="rounded-2xl bg-[#E4F3EA] p-4 text-xs font-bold text-[#183D2C] text-center">
                  Läser in bild i originalstorlek (full upplösning)...
                </div>
              )}

              {pendingPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {pendingPreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden aspect-square border border-[#CDE0D4] bg-black"
                    >
                      <img
                        src={src}
                        alt={`Vald bild ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPendingPreviews((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#9E2A2B]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-[#8AB59B] bg-white hover:bg-[#E4F3EA] aspect-square flex flex-col items-center justify-center gap-1 text-xs font-extrabold text-[#183D2C]"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Fler bilder</span>
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2E4035]">
                    Bildtext / kommentar (frivilligt)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCaptionEmojiPicker((v) => !v)}
                    className="text-xs font-bold text-[#183D2C] flex items-center gap-1 hover:underline"
                  >
                    <Smile className="h-3.5 w-3.5" />
                    <span>Lägg till emoji</span>
                  </button>
                </div>

                {showCaptionEmojiPicker && (
                  <div className="mb-2 rounded-2xl bg-white border border-[#CDE0D4] p-2 flex flex-wrap gap-1">
                    {COMMENT_EMOJI_PALETTE.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setUploadCaption((prev) => `${prev}${em}`)}
                        className="h-8 w-8 rounded-lg hover:bg-[#E4F3EA] flex items-center justify-center text-base"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="t.ex. Helgutflykt i solen ☀️❤️"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Lägg i album (frivilligt)
                </label>
                <select
                  value={uploadAlbumId}
                  onChange={(e) => setUploadAlbumId(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm font-semibold text-[#141E18]"
                >
                  <option value="none">Inget specifikt album (Alla bilder)</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      Album: {a.name}
                    </option>
                  ))}
                  <option value="__new__">+ Skapa nytt album direkt...</option>
                </select>
              </div>

              {uploadAlbumId === '__new__' && (
                <div>
                  <label className="block text-xs font-bold text-[#2E4035] mb-1">
                    Namn på nytt album *
                  </label>
                  <input
                    type="text"
                    required
                    value={inlineNewAlbumName}
                    onChange={(e) => setInlineNewAlbumName(e.target.value)}
                    placeholder="t.ex. Sommar 2026, Barnen, Renovering..."
                    className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingPreviews([]);
                    setShowUploadModal(false);
                  }}
                  className="min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-xs font-bold text-[#2E4035]"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={pendingPreviews.length === 0 || isCompressing}
                  className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E] disabled:opacity-50"
                >
                  Publicera {pendingPreviews.length}{' '}
                  {pendingPreviews.length === 1 ? 'bild' : 'bilder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Album Modal */}
      {showCreateAlbumModal && (
        <div
          onClick={() => setShowCreateAlbumModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] shadow-2xl overflow-hidden"
          >
            <div className="bg-[#183D2C] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#A6F2C6]" />
                <h3 className="text-base font-extrabold">Skapa nytt album</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAlbumModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbumSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Albumets namn *
                </label>
                <input
                  type="text"
                  required
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="t.ex. Semester, Familjemiddagar, Trädgård..."
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Beskrivning (frivilligt)
                </label>
                <input
                  type="text"
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  placeholder="Kort beskrivning av albumet"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm text-[#141E18]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAlbumModal(false)}
                  className="min-h-[42px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-xs font-bold text-[#2E4035]"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] rounded-2xl bg-[#183D2C] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0F291E]"
                >
                  Skapa album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Detail & Lightbox Modal (Opens when tapping any photo in the grid — includes Reactions & Comments) */}
      {fullscreenPhoto && (
        <div
          onClick={() => {
            setFullscreenPhotoId(null);
            setIsZoomed(false);
          }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none"
        >
          {/* Top Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 sm:px-6 pt-[max(env(safe-area-inset-top,0px),16px)] pb-3 bg-gradient-to-b from-black/85 to-transparent flex flex-wrap items-center justify-between gap-2 z-20 shrink-0"
          >
            <div className="flex items-center gap-2.5 min-w-0 text-white">
              <UserAvatarBubble
                name={fullscreenPhoto.uploadedBy}
                avatarDataUrl={fullscreenPhoto.uploadedByAvatarDataUrl}
                avatarColor={fullscreenPhoto.uploadedByAvatarColor}
                sizeClass="h-9 w-9"
                textClass="text-xs"
              />
              <div className="min-w-0">
                <div className="text-sm font-extrabold truncate">
                  {fullscreenPhoto.uploadedBy}
                </div>
                <div className="text-[11px] text-white/75 truncate">
                  {new Date(fullscreenPhoto.createdAt).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {fullscreenPhoto.caption ? ` · ${fullscreenPhoto.caption}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {albums.length > 0 && (
                <select
                  value={fullscreenPhoto.albumId || ''}
                  onChange={(e) =>
                    onMovePhotoToAlbum(
                      fullscreenPhoto.id,
                      e.target.value ? e.target.value : undefined
                    )
                  }
                  className="h-9 rounded-2xl bg-white/15 border border-white/20 px-2.5 text-xs font-bold text-white focus:outline-none"
                  title="Välj album"
                >
                  <option value="" className="text-black">
                    Inget album
                  </option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id} className="text-black">
                      {a.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => onToggleFavoritePhoto(fullscreenPhoto.id)}
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                  fullscreenPhoto.favorite
                    ? 'bg-[#FBBF24]/25 text-[#FBBF24]'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title="Favoritmarkera"
              >
                <Star
                  className={`h-4 w-4 ${fullscreenPhoto.favorite ? 'fill-current' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                className="min-h-[36px] rounded-2xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5"
                title="Zooma bild"
              >
                {isZoomed ? (
                  <ZoomOut className="h-4 w-4" />
                ) : (
                  <ZoomIn className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isZoomed ? 'Återställ' : 'Zooma'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadPhotoFile(fullscreenPhoto)}
                className="min-h-[36px] rounded-2xl bg-[#A6F2C6] hover:bg-[#8CE6B4] px-3 py-1.5 text-xs font-extrabold text-[#082114] flex items-center gap-1.5"
                title="Ladda ner bild"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Ladda ner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const toDelete = fullscreenPhoto;
                  setFullscreenPhotoId(null);
                  onDeletePhoto(toDelete);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 hover:bg-[#9E2A2B] text-white transition-colors"
                title="Ta bort bild"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setFullscreenPhotoId(null);
                  setIsZoomed(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white"
                aria-label="Stäng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Center Image Stage with Prev / Next Navigation */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center overflow-auto px-2 sm:px-12 py-2 min-h-[240px]"
          >
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const prev =
                    filteredPhotos[
                      (fullscreenIndex - 1 + filteredPhotos.length) %
                        filteredPhotos.length
                    ];
                  if (prev) {
                    setFullscreenPhotoId(prev.id);
                    setIsZoomed(false);
                  }
                }}
                className="absolute left-3 sm:left-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white shadow-lg"
                aria-label="Föregående bild"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={fullscreenPhoto.imageUrl}
              alt={fullscreenPhoto.caption || 'Helskärmsbild'}
              onClick={() => setIsZoomed((z) => !z)}
              style={{
                transform: isZoomed ? 'scale(1.85)' : 'scale(1)',
                transition: 'transform 0.22s ease-out',
              }}
              className="max-h-[54vh] sm:max-h-[62vh] max-w-[94vw] object-contain rounded-xl shadow-2xl cursor-zoom-in"
            />

            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const next =
                    filteredPhotos[(fullscreenIndex + 1) % filteredPhotos.length];
                  if (next) {
                    setFullscreenPhotoId(next.id);
                    setIsZoomed(false);
                  }
                }}
                className="absolute right-3 sm:right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white shadow-lg"
                aria-label="Nästa bild"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Interactive Sheet: Caption, Reactions & Comments */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] pt-2 z-20 space-y-2.5 shrink-0"
          >
            {fullscreenPhoto.caption && (
              <div className="text-sm font-bold text-white px-1">
                {fullscreenPhoto.caption}
              </div>
            )}

            {/* Emoji Reactions Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-white/10 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/15">
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_REACTION_EMOJIS.map((em) => {
                  const info = fullscreenReactionGroups.get(em);
                  const count = info?.count || 0;
                  const mine = Boolean(info?.reactedByMe);
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => onToggleReaction(fullscreenPhoto.id, em)}
                      title={info?.names.length ? info.names.join(', ') : `Reagera med ${em}`}
                      className={`min-h-[34px] rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-transform ${
                        mine
                          ? 'bg-[#A6F2C6] text-[#082114] scale-105'
                          : count > 0
                          ? 'bg-white/25 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span>{em}</span>
                      {count > 0 && (
                        <span className="font-mono tabular-nums text-[11px]">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Custom reactions not in default quick 8 */}
                {Array.from(fullscreenReactionGroups.entries())
                  .filter(([em]) => !QUICK_REACTION_EMOJIS.includes(em))
                  .map(([emoji, info]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onToggleReaction(fullscreenPhoto.id, emoji)}
                      title={info.names.join(', ')}
                      className={`min-h-[34px] rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1 ${
                        info.reactedByMe
                          ? 'bg-[#A6F2C6] text-[#082114]'
                          : 'bg-white/25 text-white'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="font-mono tabular-nums text-[11px]">
                        {info.count}
                      </span>
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() => setShowAllReactionEmojis((v) => !v)}
                  className="min-h-[34px] rounded-xl bg-white/15 hover:bg-white/25 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1"
                  title="Fler reaktioner"
                >
                  <Heart className="h-3.5 w-3.5 text-[#A6F2C6]" />
                  <span>+</span>
                </button>
              </div>

              <div className="text-xs text-white/80 flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{(fullscreenPhoto.comments || []).length} kommentarer</span>
              </div>
            </div>

            {showAllReactionEmojis && (
              <div className="rounded-2xl bg-[#141E18] border border-white/20 p-2.5 flex flex-wrap gap-1.5">
                {COMMENT_EMOJI_PALETTE.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      onToggleReaction(fullscreenPhoto.id, em);
                      setShowAllReactionEmojis(false);
                    }}
                    className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-base"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Comments List inside Photo Modal */}
            {(fullscreenPhoto.comments || []).length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 bg-black/65 rounded-2xl p-3 border border-white/15">
                {fullscreenPhoto.comments.map((c: PhotoComment) => {
                  const isMine =
                    c.authorEmail.trim().toLowerCase() ===
                    currentAccount.email.trim().toLowerCase();
                  return (
                    <div
                      key={c.id}
                      className="text-xs text-white flex items-center justify-between gap-2 py-0.5"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-[#A6F2C6] mr-1.5">
                          {c.authorName}:
                        </span>
                        <span className="text-white/95 break-words">{c.text}</span>
                      </div>
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(fullscreenPhoto.id, c.id)}
                          className="text-white/50 hover:text-[#FF8A8A] p-1 shrink-0"
                          title="Ta bort kommentar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showFullscreenEmojis && (
              <div className="rounded-2xl bg-[#141E18] border border-white/20 p-2 flex flex-wrap gap-1">
                {COMMENT_EMOJI_PALETTE.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setFullscreenComment((prev) => `${prev}${em}`)}
                    className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-base"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSendFullscreenComment}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setShowFullscreenEmojis((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white hover:bg-white/25"
                title="Emojis"
              >
                <Smile className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={fullscreenComment}
                onChange={(e) => setFullscreenComment(e.target.value)}
                placeholder="Skriv en kommentar..."
                className="flex-1 min-h-[40px] rounded-2xl bg-white/15 border border-white/20 px-4 py-2 text-xs text-white placeholder:text-white/60 focus:outline-none focus:border-[#A6F2C6]"
              />
              <button
                type="submit"
                className="min-h-[40px] rounded-2xl bg-[#A6F2C6] px-4 py-2 text-xs font-extrabold text-[#082114] hover:bg-[#8CE6B4] flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Skicka</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
