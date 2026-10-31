import React, { useRef, useState } from 'react';
import {
  Plus,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Star,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { ChecklistItem, NoteItem } from '../types';

interface NotesViewProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (note: NoteItem) => void;
  onToggleFavorite: (id: string) => void;
  onToggleChecklistItem: (noteId: string, itemId: string) => void;
  isGoogleConnected: boolean;
  onSyncKeep: () => void;
  isSyncing: boolean;
  keepSyncStatus: string;
}

const TONE_STYLES: Record<NoteItem['colorTone'], { bg: string; border: string; label: string }> = {
  sage: { bg: 'bg-[#E6F4EC]', border: 'border-[#C2DFCE]', label: 'Salviagrön' },
  sand: { bg: 'bg-[#FDF1E1]', border: 'border-[#EBD5B7]', label: 'Varm sand' },
  lavender: { bg: 'bg-[#EFEAFA]', border: 'border-[#D5C8F0]', label: 'Lavendel' },
  clay: { bg: 'bg-[#FCE5E3]', border: 'border-[#EBC2BE]', label: 'Terrakotta' },
  sky: { bg: 'bg-[#E2F2FA]', border: 'border-[#BDE0F2]', label: 'Havsbris' },
  white: { bg: 'bg-white', border: 'border-[#D8E6DD]', label: 'Kritvit' },
};

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onToggleFavorite,
  onToggleChecklistItem,
  isGoogleConnected,
  onSyncKeep,
  isSyncing,
  keepSyncStatus,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [colorTone, setColorTone] = useState<NoteItem['colorTone']>('sage');
  const [listMode, setListMode] = useState<NoteItem['listMode']>('none');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newCheckText, setNewCheckText] = useState('');
  const [favorite, setFavorite] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setColorTone('sage');
    setListMode('none');
    setChecklistItems([]);
    setNewCheckText('');
    setFavorite(false);
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, 20);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setTitle(note.title);
    setColorTone(note.colorTone);
    setListMode(note.listMode);
    setChecklistItems(note.checklistItems || []);
    setNewCheckText('');
    setFavorite(note.favorite);
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = note.contentHtml || '';
      }
    }, 20);
  };

  const applyFormatCommand = (cmd: 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList') => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false);
    if (cmd === 'insertUnorderedList') setListMode('bullet');
    if (cmd === 'insertOrderedList') setListMode('numbered');
  };

  const handleAddChecklistItem = () => {
    if (!newCheckText.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: newCheckText.trim(), checked: false },
    ]);
    setNewCheckText('');
    setListMode('checklist');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const htmlContent = editorRef.current ? editorRef.current.innerHTML : '';

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim(),
        contentHtml: htmlContent,
        listMode,
        checklistItems,
        colorTone,
        favorite,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddNote({
        title: title.trim(),
        contentHtml: htmlContent,
        listMode,
        checklistItems,
        colorTone,
        favorite,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white border border-[#D8E6DD] p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#141E18]">Anteckningar</h1>
          <p className="mt-1 text-xs text-[#54685C]">
            Stöd för fetstil, kursiv text, punktlista, numrerad lista och interaktiv kryssboxlista · {keepSyncStatus}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isGoogleConnected && (
            <button
              onClick={onSyncKeep}
              disabled={isSyncing}
              className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-4 py-2 text-xs font-semibold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Synka nu
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="min-h-[44px] rounded-2xl bg-[#183D2C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Ny anteckning
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {notes.map((note) => {
          const tone = TONE_STYLES[note.colorTone] || TONE_STYLES.sage;

          return (
            <div
              key={note.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-transform ${tone.bg} ${tone.border}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#141E18]">{note.title}</h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggleFavorite(note.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        note.favorite
                          ? 'text-[#B86B11] bg-white/70'
                          : 'text-[#54685C] hover:bg-white/60'
                      }`}
                      title="Favoritmarkera till startsidan"
                    >
                      <Star className={`h-4 w-4 ${note.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => openEditModal(note)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#2E4035] hover:bg-white/60"
                      title="Redigera anteckning"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9E2A2B] hover:bg-white/60"
                      title="Ta bort anteckning"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Rich HTML Text Content */}
                {note.contentHtml && (
                  <div
                    className="mt-3 text-sm text-[#233229] leading-relaxed max-h-[320px] overflow-y-auto pr-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 space-y-1.5"
                    dangerouslySetInnerHTML={{ __html: note.contentHtml }}
                  />
                )}

                {/* Interactive Checklist Items */}
                {note.checklistItems && note.checklistItems.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-black/10 pt-3">
                    {note.checklistItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onToggleChecklistItem(note.id, item.id)}
                        className="w-full flex items-center gap-2.5 text-left text-sm py-1 hover:opacity-80"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            item.checked
                              ? 'bg-[#183D2C] border-[#183D2C] text-white'
                              : 'bg-white/80 border-[#4E6357]'
                          }`}
                        >
                          {item.checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span
                          className={
                            item.checked
                              ? 'line-through text-[#54685C]'
                              : 'font-medium text-[#141E18]'
                          }
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-black/8 flex items-center justify-between text-xs text-[#4E6357] font-mono tabular-nums">
                <span>{tone.label}</span>
                <span>
                  {new Date(note.updatedAt).toLocaleDateString('sv-SE', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rich Note Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-2xl rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">
                {editingNote ? 'Redigera anteckning' : 'Ny anteckning'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Rubrik</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Rubrik på anteckningen..."
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm font-bold"
              />
            </div>

            {/* Formatting Toolbar: Bold, Italic, Bullet list, Numbered list, Checklist */}
            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                Textformatering & listverktyg
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#E4F3EA] p-1.5 border border-[#CDE0D4]">
                <button
                  type="button"
                  onClick={() => applyFormatCommand('bold')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-white flex items-center gap-1.5"
                  title="Fet text"
                >
                  <Bold className="h-4 w-4" />
                  <span>Fet</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatCommand('italic')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-white flex items-center gap-1.5"
                  title="Kursiv text"
                >
                  <Italic className="h-4 w-4" />
                  <span>Kursiv</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatCommand('insertUnorderedList')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-white flex items-center gap-1.5"
                  title="Punktlista"
                >
                  <List className="h-4 w-4" />
                  <span>Punktlista</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatCommand('insertOrderedList')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-white flex items-center gap-1.5"
                  title="Numrerad lista"
                >
                  <ListOrdered className="h-4 w-4" />
                  <span>Numrerad</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setListMode((prev) => (prev === 'checklist' ? 'none' : 'checklist'))
                  }
                  className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
                    listMode === 'checklist'
                      ? 'bg-[#183D2C] text-white'
                      : 'text-[#183D2C] hover:bg-white'
                  }`}
                  title="Kryssboxlista"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Kryssboxlista</span>
                </button>
              </div>

              {/* Spacious ContentEditable Rich Text Area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="mt-2 min-h-[280px] sm:min-h-[340px] max-h-[55vh] overflow-y-auto w-full rounded-2xl bg-white border border-[#CDE0D4] p-4 sm:p-5 text-base text-[#141E18] leading-relaxed focus:outline-none focus:border-[#183D2C] focus:ring-2 focus:ring-[#183D2C]/15 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              />
            </div>

            {/* Interactive Checklist Builder */}
            <div className="rounded-2xl bg-white border border-[#DCEAE1] p-4 space-y-3">
              <div className="text-xs font-bold text-[#183D2C]">
                Kryssboxlista ({checklistItems.length} rader)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  placeholder="Lägg till kryssbox-rad..."
                  className="flex-1 min-h-[40px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="min-h-[40px] rounded-xl bg-[#183D2C] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0F291E]"
                >
                  Lägg till rad
                </button>
              </div>

              {checklistItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) =>
                            setChecklistItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, checked: e.target.checked } : i
                              )
                            )
                          }
                          className="h-4 w-4 accent-[#183D2C]"
                        />
                        <span className={item.checked ? 'line-through text-[#6A7F72]' : ''}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setChecklistItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        className="text-xs text-[#9E2A2B] hover:underline"
                      >
                        Ta bort
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Tone Selector */}
            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1.5">
                Färgton (Material 3 Expressive)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(TONE_STYLES) as NoteItem['colorTone'][]).map((toneKey) => (
                  <button
                    key={toneKey}
                    type="button"
                    onClick={() => setColorTone(toneKey)}
                    className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold border ${
                      TONE_STYLES[toneKey].bg
                    } ${TONE_STYLES[toneKey].border} ${
                      colorTone === toneKey ? 'ring-2 ring-[#183D2C]' : ''
                    }`}
                  >
                    {TONE_STYLES[toneKey].label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-[#141E18] cursor-pointer">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="h-4 w-4 accent-[#183D2C]"
              />
              Fäst som favorit på startsidan
            </label>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[44px] rounded-2xl px-5 py-2.5 text-xs font-semibold text-[#38493F] hover:bg-[#E4EFE8]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0F291E]"
              >
                Spara anteckning
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
