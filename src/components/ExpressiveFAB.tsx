import React, { useState } from 'react';
import {
  Plus,
  Home,
  Calendar,
  CheckSquare,
  StickyNote,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
  Image as ImageIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavTab } from '../types';

interface ExpressiveFABProps {
  activeTab: NavTab;
  onSelectDestination: (tab: NavTab) => void;
  memberName?: string;
  onChangeMemberName?: (name: string) => void;
}

export const ExpressiveFAB: React.FC<ExpressiveFABProps> = ({
  activeTab,
  onSelectDestination,
}) => {
  const [open, setOpen] = useState(false);

  const actions: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    tone: string;
  }[] = [
    {
      id: 'budget',
      label: 'Budget & Månader',
      icon: <Wallet className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('budget');
      },
      tone: 'bg-[#FCE8D5] text-[#7A4F2B]',
    },
    {
      id: 'recipes',
      label: 'Recept',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('recipes');
      },
      tone: 'bg-[#EAE2FA] text-[#5C4389]',
    },
    {
      id: 'photos',
      label: 'Bilder & Album',
      icon: <ImageIcon className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('photos');
      },
      tone: 'bg-[#FFE4E6] text-[#9E2A2B]',
    },
    {
      id: 'shopping',
      label: 'Inköpslista',
      icon: <ShoppingBag className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('shopping');
      },
      tone: 'bg-[#D6EEF8] text-[#1D5B79]',
    },
    {
      id: 'notes',
      label: 'Anteckningar',
      icon: <StickyNote className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('notes');
      },
      tone: 'bg-[#FDF1E1] text-[#7A4F2B]',
    },
    {
      id: 'todo',
      label: 'Att göra & Påminnelser',
      icon: <CheckSquare className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('todo');
      },
      tone: 'bg-[#D8F3E3] text-[#183D2C]',
    },
    {
      id: 'calendar',
      label: 'Kalender',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('calendar');
      },
      tone: 'bg-[#D8F3E3] text-[#183D2C]',
    },
    {
      id: 'home',
      label: 'Hem',
      icon: <Home className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onSelectDestination('home');
      },
      tone: 'bg-[#D8F3E3] text-[#183D2C]',
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-5 sm:bottom-6 sm:right-6 z-40 flex md:hidden flex-col items-end gap-2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2 flex flex-col items-end gap-2 max-h-[75vh] overflow-y-auto pr-0.5 py-1"
            >
              {actions.map((act, index) => {
                const isCurrent = act.id === activeTab;
                // Cascade upward from the bottom button (Material 3 Expressive speed-dial effect)
                const reverseIndex = actions.length - 1 - index;
                return (
                  <motion.button
                    key={act.id}
                    initial={{ opacity: 0, y: 26, scale: 0.72 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.78 }}
                    transition={{
                      type: 'spring',
                      stiffness: 480,
                      damping: 26,
                      delay: reverseIndex * 0.03,
                    }}
                    whileTap={{ scale: 0.94 }}
                    onClick={act.onClick}
                    className={`origin-bottom-right min-h-[48px] rounded-full border pl-4 pr-2.5 py-1.5 shadow-lg flex items-center gap-3 whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'bg-[#183D2C] text-white border-[#183D2C] ring-2 ring-white/50'
                        : 'm3-expressive-pill-tonal hover:brightness-95'
                    }`}
                  >
                    <span className="text-xs font-extrabold tracking-tight">{act.label}</span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-2xs ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-white/85 text-[#183D2C]'
                      }`}
                    >
                      {act.icon}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen((prev) => !prev)}
          className={`m3-fab-button h-14 shadow-2xl flex items-center justify-center gap-2.5 whitespace-nowrap transition-all duration-200 ${
            open ? 'w-14 px-0 rounded-full' : 'px-5 rounded-[24px]'
          }`}
          aria-label="FAB-meny"
        >
          <motion.span
            animate={{ rotate: open ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </motion.span>
          {!open && (
            <span className="text-xs font-extrabold tracking-tight">Meny</span>
          )}
        </motion.button>
      </div>
    </>
  );
};
