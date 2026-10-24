import React, { useState, useEffect } from 'react';
import {
  Plus,
  ShoppingBag,
  Star,
  Check,
  Trash2,
  Sparkles,
  CheckCheck,
  Layers,
} from 'lucide-react';
import { ShoppingItem, SwedishShoppingCategory } from '../types';
import {
  classifySwedishGrocery,
  SWEDISH_CATEGORY_ORDER,
} from '../utils/swedishGrocerySorter';

interface ShoppingViewProps {
  items: ShoppingItem[];
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
  onToggleChecked: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onTriggerShoppingNotification: () => void;
}

const AUTO_CAT_STORAGE_KEY = 'hem_shopping_auto_categorize_v1';

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  items,
  onAddItem,
  onToggleChecked,
  onToggleFavorite,
  onDeleteItem,
  onClearChecked,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('1');
  const [unit, setUnit] = useState<string>('st');
  const [manualCategory, setManualCategory] = useState<SwedishShoppingCategory | 'auto'>('auto');

  const [autoCategorize, setAutoCategorize] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_CAT_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_CAT_STORAGE_KEY, JSON.stringify(autoCategorize));
    } catch {
      // Ignore storage errors
    }
  }, [autoCategorize]);

  const detectedCategory = name.trim() ? classifySwedishGrocery(name) : 'Frukt & Grönt';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalCategory: SwedishShoppingCategory = !autoCategorize
      ? 'Övrigt'
      : manualCategory === 'auto'
      ? classifySwedishGrocery(name)
      : manualCategory;

    onAddItem({
      name: name.trim(),
      amount: Math.max(0.1, Number(amount) || 1),
      unit,
      category: finalCategory,
      checked: false,
      favorite: false,
    });
    setName('');
    setAmount('1');
    setManualCategory('auto');
  };

  // Split into unchecked (top) and checked (bottom)
  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  // Group ONLY unchecked items by Swedish supermarket category order when autoCategorize is enabled
  const groupedUnchecked = SWEDISH_CATEGORY_ORDER.map((category) => ({
    category,
    items: uncheckedItems.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  const renderCompactRow = (item: ShoppingItem, showCategoryBadge = false) => (
    <div
      key={item.id}
      onClick={() => onToggleChecked(item.id)}
      className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer select-none ${
        item.checked
          ? 'bg-[#F4F8F5] hover:bg-[#EAF2ED]'
          : 'hover:bg-[#F3F9F5]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleChecked(item.id);
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            item.checked
              ? 'bg-[#183D2C] border-[#183D2C] text-white'
              : 'border-[#9AB8A6] bg-white text-transparent group-hover:border-[#183D2C]'
          }`}
          aria-label={`Markera ${item.name}`}
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>

        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <span
            className={`text-xs sm:text-sm font-semibold truncate ${
              item.checked ? 'line-through text-[#6A7F72]' : 'text-[#141E18]'
            }`}
          >
            {item.name}
          </span>
          <span
            className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
              item.checked
                ? 'bg-[#E6EFE9] text-[#6A7F72]'
                : 'bg-[#EAF5EE] text-[#183D2C] font-semibold'
            }`}
          >
            {item.amount} {item.unit}
          </span>
          {showCategoryBadge && item.category && item.category !== 'Övrigt' && (
            <span className="hidden sm:inline-block text-[10px] text-[#6A7F72] truncate">
              · {item.category}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleFavorite(item.id)}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            item.favorite
              ? 'text-[#B86B11] bg-[#FDF1E1]'
              : 'text-[#7A8F82] hover:bg-[#EAF5EE]'
          }`}
          title="Favoritmarkera vara"
        >
          <Star className={`h-3.5 w-3.5 ${item.favorite ? 'fill-current' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteItem(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9E2A2B]/80 hover:text-[#9E2A2B] hover:bg-[#FADAD8] transition-colors"
          title="Ta bort vara"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3.5">
      {/* Compact Header + Auto-Categorize Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#D8E6DD] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#183D2C]">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#141E18] leading-tight">
              Inköpslista
            </h1>
            <p className="text-[11px] text-[#54685C]">
              {uncheckedItems.length} att handla · {checkedItems.length} avbockade
            </p>
          </div>
        </div>

        {/* Toggle Switch for Automatic Categorization */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl bg-[#F4F8F5] border border-[#D8E6DD] px-3 py-1.5">
          <Layers className="h-3.5 w-3.5 text-[#183D2C]" />
          <span className="text-xs font-bold text-[#141E18]">
            Automatisk kategorisering
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={autoCategorize}
            onClick={() => setAutoCategorize((prev) => !prev)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              autoCategorize ? 'bg-[#183D2C]' : 'bg-[#BDD3C5]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                autoCategorize ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Compact Quick-Add Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-[#E7F3EC] border border-[#C6DFD0] p-3 space-y-2"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lägg till vara (t.ex. Mjölk, Avokado, Kaffe)..."
            className="flex-1 min-h-[38px] rounded-xl bg-white border border-[#BDD3C5] px-3 py-1.5 text-xs sm:text-sm text-[#141E18] focus:outline-none focus:border-[#183D2C]"
          />

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Mängd"
              className="w-16 min-h-[38px] rounded-xl bg-white border border-[#BDD3C5] px-2.5 py-1.5 text-xs font-mono tabular-nums text-center"
            />

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Enhet"
              className="w-20 min-h-[38px] rounded-xl bg-white border border-[#BDD3C5] px-2 py-1.5 text-xs font-medium"
            >
              <option value="st">st</option>
              <option value="förp">förp</option>
              <option value="kg">kg</option>
              <option value="hg">hg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="dl">dl</option>
            </select>

            {autoCategorize && (
              <select
                value={manualCategory}
                onChange={(e) =>
                  setManualCategory(e.target.value as SwedishShoppingCategory | 'auto')
                }
                aria-label="Avdelning"
                className="w-32 sm:w-40 min-h-[38px] rounded-xl bg-white border border-[#BDD3C5] px-2 py-1.5 text-[11px] font-semibold truncate"
              >
                <option value="auto">
                  Auto ({name.trim() ? detectedCategory : 'Väljs'})
                </option>
                {SWEDISH_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="min-h-[38px] rounded-xl bg-[#183D2C] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Lägg till</span>
            </button>
          </div>
        </div>

        {autoCategorize && name.trim() && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#183D2C] px-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>
              Kategoriseras som:{' '}
              <strong>
                {manualCategory === 'auto' ? detectedCategory : manualCategory}
              </strong>
            </span>
          </div>
        )}
      </form>

      {/* Empty State when whole list is empty */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#D8E6DD] p-8 text-center">
          <ShoppingBag className="h-8 w-8 text-[#6A7F72] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#141E18]">Inköpslistan är tom</h3>
          <p className="mt-0.5 text-xs text-[#54685C]">
            Skriv in varor ovan eller lägg till direkt från dina recept.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* UNCHECKED ITEMS SECTION (Inte färdigt) */}
          {uncheckedItems.length > 0 ? (
            autoCategorize ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {groupedUnchecked.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-2xl bg-white border border-[#D8E6DD] p-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#EBF2EE] pb-1.5 mb-1 px-1">
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#183D2C]">
                        {group.category}
                      </h2>
                      <span className="text-[11px] text-[#54685C] font-mono tabular-nums">
                        {group.items.length}
                      </span>
                    </div>

                    <div className="divide-y divide-[#F1F6F3]">
                      {group.items.map((item) => renderCompactRow(item, false))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[#D8E6DD] p-2.5">
                <div className="flex items-center justify-between border-b border-[#EBF2EE] pb-1.5 mb-1 px-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#183D2C]">
                    Att handla
                  </h2>
                  <span className="text-[11px] text-[#54685C] font-mono tabular-nums">
                    {uncheckedItems.length} {uncheckedItems.length === 1 ? 'vara' : 'varor'}
                  </span>
                </div>
                <div className="divide-y divide-[#F1F6F3]">
                  {uncheckedItems.map((item) => renderCompactRow(item, false))}
                </div>
              </div>
            )
          ) : (
            <div className="rounded-2xl bg-[#F4F8F5] border border-[#D8E6DD] px-4 py-3 text-center text-xs font-semibold text-[#183D2C]">
              Alla varor på listan är avbockade!
            </div>
          )}

          {/* DIVIDER & CHECKED ITEMS SECTION AT THE BOTTOM (Färdigt / Avbockat) */}
          {checkedItems.length > 0 && (
            <div className="pt-1 space-y-2.5">
              {/* Visual Divider between Unchecked and Checked */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#C6DFD0]" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3EC] border border-[#C6DFD0] px-3 py-0.5 text-[11px] font-bold text-[#183D2C]">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Avbockade / Färdiga ({checkedItems.length})
                </span>
                <div className="h-px flex-1 bg-[#C6DFD0]" />
              </div>

              {/* Compact Checked Items List + Clear Button */}
              <div className="rounded-2xl bg-white/85 border border-[#D8E6DD] p-2.5 space-y-2">
                <div className="divide-y divide-[#F1F6F3]">
                  {checkedItems.map((item) => renderCompactRow(item, autoCategorize))}
                </div>

                <div className="pt-1.5 border-t border-[#EBF2EE] flex justify-end">
                  <button
                    type="button"
                    onClick={onClearChecked}
                    className="w-full sm:w-auto min-h-[36px] rounded-xl bg-[#FADAD8] px-3.5 py-1.5 text-xs font-bold text-[#9E2A2B] hover:bg-[#F5C5C2] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Ta bort alla avbockade ({checkedItems.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
