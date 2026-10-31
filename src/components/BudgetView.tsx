import React, { useState } from 'react';
import {
  Plus,
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarPlus,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { BudgetEntry, BudgetMonth } from '../types';

export type BudgetApplyScope = 'single' | 'future' | 'all';

interface BudgetViewProps {
  months: BudgetMonth[];
  activeMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
  onAddMonth: (monthKey: string, label: string, copyFromCurrent: boolean) => void;
  onDeleteMonth?: (monthKey: string) => void;
  onSaveEntry: (
    entry: Omit<BudgetEntry, 'id'>,
    editingEntryId: string | null,
    scope: BudgetApplyScope,
    targetMonthKey: string
  ) => void;
  onDeleteEntry: (entry: BudgetEntry, scope: BudgetApplyScope, targetMonthKey: string) => void;
  onOpenCalculator: (onUseValue?: (val: number) => void) => void;
}

const SWEDISH_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

export const BudgetView: React.FC<BudgetViewProps> = ({
  months,
  activeMonthKey,
  onSelectMonth,
  onAddMonth,
  onDeleteMonth,
  onSaveEntry,
  onDeleteEntry,
  onOpenCalculator,
}) => {
  const activeMonth = months.find((m) => m.monthKey === activeMonthKey) || months[0];

  // Add / Edit Entry Modal State
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('1000');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Boende');
  const [dayOfMonth, setDayOfMonth] = useState<number>(25);
  const [applyScope, setApplyScope] = useState<BudgetApplyScope>('single');

  // Add New Month Modal State
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [newMonthYear, setNewMonthYear] = useState(2027);
  const [newMonthIndex, setNewMonthIndex] = useState(0); // 0 = Januari
  const [copyTemplate, setCopyTemplate] = useState(true);

  // Delete Month Modal State
  const [deletingMonth, setDeletingMonth] = useState<BudgetMonth | null>(null);

  // Delete Scope Modal State
  const [deletingEntry, setDeletingEntry] = useState<BudgetEntry | null>(null);
  const [deleteScope, setDeleteScope] = useState<BudgetApplyScope>('single');

  const openNewEntry = (defaultType: 'income' | 'expense' = 'expense') => {
    setEditingEntry(null);
    setTitle('');
    setAmount('');
    setType(defaultType);
    setCategory(defaultType === 'income' ? 'Lön' : 'Mat & Hushåll');
    setDayOfMonth(25);
    setApplyScope('single');
    setShowEntryModal(true);
  };

  const openEditEntry = (entry: BudgetEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setAmount(String(entry.amount));
    setType(entry.type);
    setCategory(entry.category);
    setDayOfMonth(entry.dayOfMonth);
    setApplyScope('single');
    setShowEntryModal(true);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeMonth) return;
    const numericAmount = Math.max(0, Number(amount) || 0);

    onSaveEntry(
      {
        seriesId: editingEntry?.seriesId || `ser-${Date.now()}`,
        title: title.trim(),
        amount: numericAmount,
        type,
        category: category.trim() || 'Övrigt',
        dayOfMonth: Math.min(31, Math.max(1, Number(dayOfMonth) || 1)),
      },
      editingEntry ? editingEntry.id : null,
      applyScope,
      activeMonth.monthKey
    );
    setShowEntryModal(false);
  };

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const mm = String(newMonthIndex + 1).padStart(2, '0');
    const key = `${newMonthYear}-${mm}`;
    const label = `${SWEDISH_MONTH_NAMES[newMonthIndex]} ${newMonthYear}`;
    onAddMonth(key, label, copyTemplate);
    setShowAddMonthModal(false);
  };

  const incomes = activeMonth
    ? activeMonth.entries.filter((e) => e.type === 'income')
    : [];
  const expenses = activeMonth
    ? activeMonth.entries.filter((e) => e.type === 'expense')
    : [];

  const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netRemaining = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netRemaining / totalIncome) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Built-In Calculator Button & Add Month */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl bg-white border border-[#D8E6DD] p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#141E18]">
            Flermånadersbudget & Kalkylator
          </h1>
          <p className="mt-1 text-xs text-[#54685C]">
            Räknar automatiskt ut inkomster, utgifter och överskott · Välj om ändringar gäller en månad eller flera
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddMonthModal(true)}
            className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-4 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-2 whitespace-nowrap"
          >
            <CalendarPlus className="h-4 w-4" />
            Lägg till månad
          </button>

          {onDeleteMonth && activeMonth && (
            <button
              type="button"
              onClick={() => setDeletingMonth(activeMonth)}
              className="min-h-[44px] rounded-2xl border border-[#E2A9A5] bg-white px-4 py-2 text-xs font-bold text-[#9E2A2B] hover:bg-[#FADAD8] flex items-center gap-2 whitespace-nowrap"
              title={`Ta bort ${activeMonth.label}`}
            >
              <Trash2 className="h-4 w-4" />
              Ta bort månad
            </button>
          )}

          <button
            onClick={() => openNewEntry('expense')}
            className="min-h-[44px] rounded-2xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Ny budgetpost
          </button>
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {months.map((m) => {
          const isCurrent = m.monthKey === activeMonth?.monthKey;
          return (
            <div
              key={m.monthKey}
              className={`min-h-[44px] rounded-2xl pl-4 pr-2.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                isCurrent
                  ? 'bg-[#183D2C] text-white shadow-xs'
                  : 'bg-white border border-[#D8E6DD] text-[#38493F] hover:bg-[#EBF4EE]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectMonth(m.monthKey)}
                className="py-0.5 text-left font-bold"
              >
                {m.label}
              </button>
              {onDeleteMonth && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingMonth(m);
                  }}
                  className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                    isCurrent
                      ? 'text-white/75 hover:text-white hover:bg-white/15'
                      : 'text-[#54685C] hover:text-[#9E2A2B] hover:bg-[#FADAD8]'
                  }`}
                  aria-label={`Ta bort ${m.label}`}
                  title={`Ta bort ${m.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Automatic Totals KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl bg-white border border-[#D8E6DD] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#21513B]">Totala inkomster</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums text-[#141E18]">
            +{totalIncome.toLocaleString('sv-SE')} kr
          </div>
          <div className="mt-1 text-xs text-[#54685C] font-mono tabular-nums">
            {incomes.length} inkomstposter i {activeMonth?.label}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#D8E6DD] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9E2A2B]">Totala utgifter</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FADAD8] text-[#9E2A2B]">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums text-[#141E18]">
            -{totalExpense.toLocaleString('sv-SE')} kr
          </div>
          <div className="mt-1 text-xs text-[#54685C] font-mono tabular-nums">
            {expenses.length} utgiftsposter i {activeMonth?.label}
          </div>
        </div>

        <div className="rounded-3xl bg-[#183D2C] text-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#A6F2C6]">Kvar att leva på / Netto</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-[#A6F2C6]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono tabular-nums">
            {netRemaining >= 0 ? '+' : ''}
            {netRemaining.toLocaleString('sv-SE')} kr
          </div>
          <div className="mt-1 text-xs text-[#CDE8D8] font-mono tabular-nums">
            Överskottsmarginal: {savingsRate}% av inkomst
          </div>
        </div>
      </div>

      {/* Income & Expense Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomes Column */}
        <div className="rounded-3xl bg-white border border-[#D8E6DD] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EBF2EE]">
            <div>
              <h2 className="text-lg font-bold text-[#141E18]">Inkomster</h2>
              <p className="text-xs text-[#54685C]">{activeMonth?.label}</p>
            </div>
            <button
              onClick={() => openNewEntry('income')}
              className="min-h-[38px] rounded-xl bg-[#E7F3EC] px-3.5 py-1.5 text-xs font-bold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Lägg till inkomst
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#F1F6F3]">
            {incomes.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#54685C]">
                Inga inkomster registrerade för denna månad.
              </p>
            ) : (
              incomes.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#141E18] truncate">
                      {entry.title}
                    </div>
                    <div className="text-xs text-[#54685C] font-mono tabular-nums">
                      {entry.category} · Den {entry.dayOfMonth}:e
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-[#183D2C]">
                      +{entry.amount.toLocaleString('sv-SE')} kr
                    </span>
                    <button
                      onClick={() => openEditEntry(entry)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#38493F] hover:bg-[#E7F3EC]"
                      title="Redigera post (välj en eller flera månader)"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingEntry(entry);
                        setDeleteScope('single');
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9E2A2B] hover:bg-[#FADAD8]"
                      title="Ta bort post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Column */}
        <div className="rounded-3xl bg-white border border-[#D8E6DD] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EBF2EE]">
            <div>
              <h2 className="text-lg font-bold text-[#141E18]">Utgifter & Sparande</h2>
              <p className="text-xs text-[#54685C]">{activeMonth?.label}</p>
            </div>
            <button
              onClick={() => openNewEntry('expense')}
              className="min-h-[38px] rounded-xl bg-[#FADAD8] px-3.5 py-1.5 text-xs font-bold text-[#9E2A2B] hover:bg-[#F5C5C2] flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Lägg till utgift
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#F1F6F3]">
            {expenses.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#54685C]">
                Inga utgifter registrerade för denna månad.
              </p>
            ) : (
              expenses.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#141E18] truncate">
                      {entry.title}
                    </div>
                    <div className="text-xs text-[#54685C] font-mono tabular-nums">
                      {entry.category} · Den {entry.dayOfMonth}:e
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-[#9E2A2B]">
                      -{entry.amount.toLocaleString('sv-SE')} kr
                    </span>
                    <button
                      onClick={() => openEditEntry(entry)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#38493F] hover:bg-[#E7F3EC]"
                      title="Redigera post (välj en eller flera månader)"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingEntry(entry);
                        setDeleteScope('single');
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9E2A2B] hover:bg-[#FADAD8]"
                      title="Ta bort post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Entry with Multi-Month Scope Selection */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleEntrySubmit}
            className="w-full max-w-lg rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">
                {editingEntry ? 'Redigera budgetpost' : 'Ny budgetpost'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#E7F3EC] rounded-2xl">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                  type === 'income'
                    ? 'bg-[#183D2C] text-white'
                    : 'text-[#38493F] hover:text-[#141E18]'
                }`}
              >
                Inkomst (+)
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                  type === 'expense'
                    ? 'bg-[#9E2A2B] text-white'
                    : 'text-[#38493F] hover:text-[#141E18]'
                }`}
              >
                Utgift (-)
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Benämning</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Hyra, Matkasse, Lön, Gymkort..."
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2E4035]">Belopp (kr)</label>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCalculator((val) => {
                        setAmount(String(val));
                      })
                    }
                    className="text-xs font-bold text-[#183D2C] hover:underline flex items-center gap-1"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Räkna i kalkylator
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Dag i månaden
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Kategori</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="t.ex. Boende, Mat & Hushåll, Transport, Sparande"
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            {/* Multi-month Scope Selector */}
            <div className="rounded-2xl bg-[#E7F3EC] border border-[#C6DFD0] p-4 space-y-2">
              <div className="text-xs font-bold text-[#183D2C]">
                Vilka månader ska ändringen gälla för?
              </div>
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyScope === 'single'}
                  onChange={() => setApplyScope('single')}
                  className="h-4 w-4 accent-[#183D2C]"
                />
                <span>Endast {activeMonth?.label} (denna månad)</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyScope === 'future'}
                  onChange={() => setApplyScope('future')}
                  className="h-4 w-4 accent-[#183D2C]"
                />
                <span>{activeMonth?.label} och alla kommande månader</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={applyScope === 'all'}
                  onChange={() => setApplyScope('all')}
                  className="h-4 w-4 accent-[#183D2C]"
                />
                <span>Samtliga månader i budgeten ({months.length} månader)</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="min-h-[44px] rounded-2xl px-5 py-2.5 text-xs font-semibold text-[#38493F]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0F291E]"
              >
                Spara budgetpost
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Entry with Multi-Month Scope Selection */}
      {deletingEntry && activeMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#141E18]">
              Ta bort "{deletingEntry.title}"
            </h3>
            <p className="text-xs text-[#4E6357]">
              Vill du ta bort denna post enbart för {activeMonth.label} eller även i andra månader?
            </p>
            <div className="space-y-2 rounded-2xl bg-white border border-[#DCEAE1] p-4">
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="delScope"
                  checked={deleteScope === 'single'}
                  onChange={() => setDeleteScope('single')}
                  className="h-4 w-4 accent-[#9E2A2B]"
                />
                <span>Endast i {activeMonth.label}</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="delScope"
                  checked={deleteScope === 'future'}
                  onChange={() => setDeleteScope('future')}
                  className="h-4 w-4 accent-[#9E2A2B]"
                />
                <span>I {activeMonth.label} och alla kommande månader</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
                <input
                  type="radio"
                  name="delScope"
                  checked={deleteScope === 'all'}
                  onChange={() => setDeleteScope('all')}
                  className="h-4 w-4 accent-[#9E2A2B]"
                />
                <span>I alla månader</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingEntry(null)}
                className="min-h-[42px] rounded-2xl px-4 py-2 text-xs font-semibold text-[#38493F]"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(deletingEntry, deleteScope, activeMonth.monthKey);
                  setDeletingEntry(null);
                }}
                className="min-h-[42px] rounded-2xl bg-[#9E2A2B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#7E1F20]"
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Month */}
      {showAddMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateMonth}
            className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">Lägg till ny månad i budget</h3>
              <button
                type="button"
                onClick={() => setShowAddMonthModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Månad</label>
                <select
                  value={newMonthIndex}
                  onChange={(e) => setNewMonthIndex(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm"
                >
                  {SWEDISH_MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">År</label>
                <input
                  type="number"
                  min={2025}
                  max={2035}
                  value={newMonthYear}
                  onChange={(e) => setNewMonthYear(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[#141E18] cursor-pointer">
              <input
                type="checkbox"
                checked={copyTemplate}
                onChange={(e) => setCopyTemplate(e.target.checked)}
                className="h-4 w-4 accent-[#183D2C]"
              />
              Kopiera återkommande inkomster och utgifter från {activeMonth?.label}
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMonthModal(false)}
                className="min-h-[44px] rounded-2xl px-4 py-2 text-xs font-semibold text-[#38493F]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0F291E]"
              >
                Skapa månad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Month Confirmation Modal */}
      {deletingMonth && onDeleteMonth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeletingMonth(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#141E18]">
                Ta bort {deletingMonth.label}?
              </h2>
              <button
                type="button"
                onClick={() => setDeletingMonth(null)}
                className="h-9 w-9 flex items-center justify-center rounded-xl text-[#54685C] hover:bg-[#E4F0E9]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#38493F] leading-relaxed">
              Är du säker på att du vill ta bort månaden{' '}
              <strong>{deletingMonth.label}</strong> och dess{' '}
              <strong>{deletingMonth.entries.length}</strong> budgetposter?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMonth(null)}
                className="min-h-[44px] rounded-2xl px-4 py-2 text-xs font-semibold text-[#38493F] hover:bg-[#E7F3EC]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMonth(deletingMonth.monthKey);
                  setDeletingMonth(null);
                }}
                className="min-h-[44px] rounded-2xl bg-[#9E2A2B] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#7D2021] flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Ta bort månad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Round Calculator Button (Bottom-Left, follows scroll strictly on Budget page) */}
      <button
        type="button"
        onClick={() =>
          onOpenCalculator((calculatedVal) => {
            setEditingEntry(null);
            setTitle('Uträknad post från kalkylator');
            setAmount(String(calculatedVal));
            setType('expense');
            setCategory('Övrigt');
            setApplyScope('single');
            setShowEntryModal(true);
          })
        }
        className="fixed bottom-6 left-5 sm:bottom-6 sm:left-6 z-40 h-14 w-14 rounded-full bg-[#183D2C] text-white shadow-2xl hover:bg-[#102A1E] active:scale-95 transition-all flex items-center justify-center border-2 border-[#A6F2C6]/40"
        aria-label="Öppna kalkylator"
        title="Öppna kalkylator"
      >
        <Calculator className="h-6 w-6 text-[#A6F2C6]" />
      </button>
    </div>
  );
};
