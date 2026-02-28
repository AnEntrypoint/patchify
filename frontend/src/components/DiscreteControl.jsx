import React from 'react';

export function DiscreteControl({ label, options, value, onChange, showLcd }) {
  const safeValue = value ?? options[0];
  const currentIndex = options.indexOf(safeValue);

  const triggerChange = (newVal) => {
    onChange(newVal);
    if (showLcd) showLcd(`${label}: ${newVal.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <span className="text-[9px] text-neutral-400 font-bold uppercase text-center h-6 flex items-end tracking-wider">{label}</span>
      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-1 py-1 shadow-inner w-full justify-between">
        <button
          onClick={() => triggerChange(options[(currentIndex - 1 + options.length) % options.length])}
          className="text-neutral-500 hover:text-amber-500 font-bold px-1 text-xs"
        >
          ◀
        </button>
        <span className="text-amber-500 font-mono text-[10px] uppercase overflow-hidden">{safeValue.substring(0, 4)}</span>
        <button
          onClick={() => triggerChange(options[(currentIndex + 1) % options.length])}
          className="text-neutral-500 hover:text-amber-500 font-bold px-1 text-xs"
        >
          ▶
        </button>
      </div>
    </div>
  );
}