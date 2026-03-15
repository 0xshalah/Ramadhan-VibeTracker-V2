import React, { useState } from 'react';

interface TilawahCounterProps {
  tilawah: number;
  targetTilawah: number;
  tilawahPct: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onUpdateTarget: (val: number) => void;
}

export default function TilawahCounter({ tilawah, targetTilawah, tilawahPct, onIncrement, onDecrement, onUpdateTarget }: TilawahCounterProps) {
  const [scaleAnim, setScaleAnim] = useState<'plus' | 'minus' | false>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<number | string>(targetTilawah || 20);

  const handleSave = () => {
    const val = parseInt(editValue.toString(), 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(val);
    }
    setIsEditing(false);
  };

  const handlePlus = () => {
    onIncrement();
    setScaleAnim('plus');
    setTimeout(() => setScaleAnim(false), 150);
  };

  const handleMinus = () => {
    onDecrement();
    setScaleAnim('minus');
    setTimeout(() => setScaleAnim(false), 150);
  };

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-sage-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-500">menu_book</span>
        Quran Recitation Target
      </h3>
      <div className="text-center py-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl mb-4">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Current Progress</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleMinus}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <span
            className={`text-4xl font-black text-slate-800 dark:text-slate-100 transition-transform duration-150 inline-block ${scaleAnim === 'plus' ? 'scale-[1.3]' : scaleAnim === 'minus' ? 'scale-[0.8]' : 'scale-100'}`}>
            {tilawah}
          </span>
          <button
            onClick={handlePlus}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm text-indigo-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-2">Pages read today</p>
      </div>
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <div className="flex items-center gap-1 animate-fade-in-down">
              <input 
                type="number" 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                className="w-12 text-xs border rounded px-1 bg-transparent text-slate-800 dark:text-slate-200 outline-none" 
                autoFocus 
                onBlur={handleSave} 
                onKeyDown={e => e.key === 'Enter' && handleSave()} 
              />
              <span className="text-xs font-bold text-sage-500 hover:text-primary cursor-pointer" onClick={handleSave}>✔</span>
            </div>
          ) : (
            <p className="text-xs font-bold text-sage-500 flex items-center gap-1 group cursor-pointer" onClick={() => { setIsEditing(true); setEditValue(targetTilawah); }}>
              Target: {targetTilawah} Pages <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
            </p>
          )}
        </div>
        <p className="text-xs font-bold text-primary">{tilawahPct}% Done</p>
      </div>
    </section>
  );
}
