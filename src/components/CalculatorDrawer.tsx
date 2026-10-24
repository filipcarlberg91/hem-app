import React, { useState } from 'react';
import { Calculator, X, Delete, Check, RotateCcw } from 'lucide-react';

interface CalculatorDrawerProps {
  open: boolean;
  onClose: () => void;
  onUseAmount?: (value: number) => void;
}

export const CalculatorDrawer: React.FC<CalculatorDrawerProps> = ({
  open,
  onClose,
  onUseAmount,
}) => {
  const [expression, setExpression] = useState<string>('0');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);

  if (!open) return null;

  const safeEvaluate = (expr: string): number | null => {
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
      if (!/^[0-9+\-*/.() ]+$/.test(sanitized)) return null;
      const fn = new Function(`return (${sanitized})`);
      const val = fn();
      if (typeof val === 'number' && Number.isFinite(val)) {
        return Math.round(val * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handlePress = (token: string) => {
    if (token === 'C') {
      setExpression('0');
      return;
    }
    if (token === 'DEL') {
      setExpression((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (token === '=') {
      const evaluated = safeEvaluate(expression);
      if (evaluated !== null) {
        const resultStr = String(evaluated);
        setHistory((prev) => [{ expr: expression, result: resultStr }, ...prev.slice(0, 5)]);
        setExpression(resultStr);
      }
      return;
    }

    setExpression((prev) => {
      if (prev === '0' && !['+', '-', '×', '÷', '.'].includes(token)) {
        return token;
      }
      return prev + token;
    });
  };

  const liveResult = safeEvaluate(expression);

  const keys = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', 'DEL', '='],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/40 backdrop-blur-xs p-0 sm:p-6">
      <div className="w-full sm:w-96 rounded-t-3xl sm:rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#141E18]">Snabbkalkylator</h3>
              <p className="text-xs text-[#54685C]">Material 3 Expressive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7] transition-colors"
            aria-label="Stäng kalkylator"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display */}
        <div className="mt-4 rounded-3xl bg-[#E7F3EC] p-4 text-right">
          <div className="text-xs text-[#4E6357] font-mono tabular-nums truncate min-h-[18px]">
            {history[0] ? `${history[0].expr} = ${history[0].result}` : 'Redo att räkna'}
          </div>
          <div className="mt-1 text-2xl font-bold text-[#10281C] font-mono tabular-nums break-all">
            {expression}
          </div>
          <div className="mt-1 text-sm font-medium text-[#21513B] font-mono tabular-nums">
            {liveResult !== null ? `= ${liveResult.toLocaleString('sv-SE')} kr` : ''}
          </div>
        </div>

        {/* Keypad */}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {keys.flat().map((k) => {
            const isOperator = ['÷', '×', '-', '+', '(', ')'].includes(k);
            const isEquals = k === '=';
            const isClear = k === 'C';

            return (
              <button
                key={k}
                onClick={() => handlePress(k)}
                className={`min-h-[52px] rounded-2xl text-base font-bold font-mono tabular-nums flex items-center justify-center active:scale-95 transition-transform ${
                  isEquals
                    ? 'bg-[#183D2C] text-white hover:bg-[#112C20]'
                    : isClear
                    ? 'bg-[#FADAD8] text-[#9E2A2B] hover:bg-[#F5C5C2]'
                    : isOperator
                    ? 'bg-[#D8F3E3] text-[#183D2C] hover:bg-[#C3EBD4]'
                    : 'bg-white text-[#141E18] border border-[#DCEAE1] hover:bg-[#EEF6F1]'
                }`}
              >
                {k === 'DEL' ? <Delete className="h-5 w-5" /> : k}
              </button>
            );
          })}
        </div>

        {/* Use amount in budget */}
        <div className="mt-4 flex items-center gap-2">
          {onUseAmount && liveResult !== null && liveResult > 0 && (
            <button
              onClick={() => {
                onUseAmount(Math.abs(liveResult));
                onClose();
              }}
              className="flex-1 min-h-[44px] rounded-2xl bg-[#183D2C] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0F291E] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Använd {Math.abs(liveResult).toLocaleString('sv-SE')} kr i budget
            </button>
          )}
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-3.5 py-2.5 text-xs font-medium text-[#38493F] hover:bg-[#E7F3EC] flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Rensa historik
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
