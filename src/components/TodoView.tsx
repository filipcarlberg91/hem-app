import React, { useState } from 'react';
import {
  Plus,
  Bell,
  Star,
  Check,
  Trash2,
  RefreshCw,
  Clock,
  Edit3,
  X,
} from 'lucide-react';
import { TodoItem } from '../types';
import { getTodayDateString } from '../data/initialData';

interface TodoViewProps {
  todos: TodoItem[];
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'updatedAt'>) => void;
  onUpdateTodo: (todo: TodoItem) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (todo: TodoItem) => void;
  onToggleFavorite: (id: string) => void;
  isGoogleConnected: boolean;
  onSyncGoogleTasks: () => void;
  isSyncing: boolean;
  onTriggerTestNotification: (title: string, body: string) => void;
}

export const TodoView: React.FC<TodoViewProps> = ({
  todos,
  onAddTodo,
  onUpdateTodo,
  onToggleTodo,
  onDeleteTodo,
  onToggleFavorite,
  isGoogleConnected,
  onSyncGoogleTasks,
  isSyncing,
  onTriggerTestNotification,
}) => {
  const todayStr = getTodayDateString();
  const [filter, setFilter] = useState<'all' | 'active' | 'favorites' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState(todayStr);
  const [reminderTime, setReminderTime] = useState('15:00');
  const [enableReminder, setEnableReminder] = useState(true);
  const [category, setCategory] = useState('Personligt');
  const [favorite, setFavorite] = useState(false);

  const openNewModal = () => {
    setEditingTodo(null);
    setTitle('');
    setNotes('');
    setPriority('medium');
    setDueDate(todayStr);
    setReminderTime('15:00');
    setEnableReminder(true);
    setCategory('Personligt');
    setFavorite(false);
    setShowModal(true);
  };

  const openEditModal = (t: TodoItem) => {
    setEditingTodo(t);
    setTitle(t.title);
    setNotes(t.notes || '');
    setPriority(t.priority);
    setDueDate(t.dueDate);
    setReminderTime(t.reminderTime || '15:00');
    setEnableReminder(!!t.reminderTime);
    setCategory(t.category);
    setFavorite(t.favorite);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTodo) {
      onUpdateTodo({
        ...editingTodo,
        title: title.trim(),
        notes: notes.trim(),
        priority,
        dueDate,
        reminderTime: enableReminder ? reminderTime : undefined,
        notifiedReminder: false,
        category: category.trim() || 'Personligt',
        favorite,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddTodo({
        title: title.trim(),
        notes: notes.trim(),
        completed: false,
        priority,
        dueDate,
        reminderTime: enableReminder ? reminderTime : undefined,
        favorite,
        category: category.trim() || 'Personligt',
      });
    }
    setShowModal(false);
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'favorites') return t.favorite;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white border border-[#D8E6DD] p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#141E18]">Att göra & Påminnelser</h1>
          <p className="mt-1 text-xs text-[#54685C]">
            Delas med familj & vänner · Tidsinställda påminnelser med ljud- och systemnotiser
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isGoogleConnected && (
            <button
              onClick={onSyncGoogleTasks}
              disabled={isSyncing}
              className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-4 py-2 text-xs font-semibold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Synka nu
            </button>
          )}
          <button
            onClick={openNewModal}
            className="min-h-[44px] rounded-2xl bg-[#183D2C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Ny uppgift
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-[#EBF3EE] rounded-2xl">
          {(
            [
              { id: 'all', label: `Alla (${todos.length})` },
              { id: 'active', label: `Att göra (${todos.filter((t) => !t.completed).length})` },
              { id: 'favorites', label: `Favoriter (${todos.filter((t) => t.favorite).length})` },
              { id: 'completed', label: `Klara (${todos.filter((t) => t.completed).length})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                filter === f.id
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'text-[#38493F] hover:text-[#141E18]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="rounded-3xl bg-white border border-[#D8E6DD] divide-y divide-[#EBF2EE]">
        {filteredTodos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[#54685C]">Inga uppgifter matchar filtret.</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const prioLabel =
              todo.priority === 'high'
                ? 'Hög prioritet'
                : todo.priority === 'medium'
                ? 'Medelprioritet'
                : 'Låg prioritet';

            return (
              <div
                key={todo.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F9FCFA] transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleTodo(todo.id)}
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                      todo.completed
                        ? 'bg-[#183D2C] border-[#183D2C] text-white'
                        : 'border-[#BDD3C5] text-transparent hover:border-[#183D2C]'
                    }`}
                    aria-label="Växla klar-status"
                  >
                    <Check className="h-5 w-5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-base font-bold ${
                        todo.completed ? 'line-through text-[#6A7F72]' : 'text-[#141E18]'
                      }`}
                    >
                      {todo.title}
                    </div>
                    {todo.notes && (
                      <p className="mt-0.5 text-xs text-[#4E6357] line-clamp-2">{todo.notes}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#54685C] font-mono tabular-nums">
                      <span>{prioLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Datum {todo.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{todo.category}</span>
                      {todo.reminderTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-[#183D2C] font-semibold">
                            <Clock className="h-3 w-3" />
                            Påminnelse kl {todo.reminderTime}
                          </span>
                        </>
                      )}
                      {todo.googleTaskId && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Google Tasks</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {todo.reminderTime && (
                    <button
                      onClick={() =>
                        onTriggerTestNotification(
                          `Påminnelse: ${todo.title}`,
                          `Tidsinställd uppgift (${todo.reminderTime}) — ${todo.category}`
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#183D2C] hover:bg-[#E4F3EA]"
                      title="Testa påminnelsenotis nu"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onToggleFavorite(todo.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      todo.favorite
                        ? 'text-[#B86B11] bg-[#FDF1E1]'
                        : 'text-[#6A7F72] hover:bg-[#EAF5EE]'
                    }`}
                    title="Favoritmarkera till startsidan"
                  >
                    <Star className={`h-4 w-4 ${todo.favorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => openEditModal(todo)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#38493F] hover:bg-[#E4EFE8]"
                    title="Redigera uppgift"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTodo(todo)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9E2A2B] hover:bg-[#FADAD8]"
                    title="Ta bort uppgift"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">
                {editingTodo ? 'Redigera uppgift' : 'Ny uppgift med påminnelse'}
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
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Uppgift</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vad behöver göras?"
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Prioritet</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm"
                >
                  <option value="high">Hög prioritet</option>
                  <option value="medium">Medelprioritet</option>
                  <option value="low">Låg prioritet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="t.ex. Hem, Arbete, Ekonomi"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Datum</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#2E4035] mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableReminder}
                    onChange={(e) => setEnableReminder(e.target.checked)}
                    className="h-4 w-4 accent-[#183D2C]"
                  />
                  Tidsinställd notis (klockslag)
                </label>
                <input
                  type="time"
                  disabled={!enableReminder}
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Anteckning</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Valfria detaljer..."
                className="w-full rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
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
                {editingTodo ? 'Uppdatera' : 'Skapa uppgift'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
