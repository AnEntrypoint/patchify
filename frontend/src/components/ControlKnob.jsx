import React, { useState } from 'react';
import { formatValue } from '../utils/formatValue';

export function ControlKnob({ label, paramKey, value, min, max, step = 1, onChange, showLcd }) {
  const safeValue = value ?? min;
  const percentage = (safeValue - min) / (max - min);
  const rotation = -135 + (percentage * 270);

  const handleChange = (e) => {
    const v = parseFloat(e.target.value);
    onChange(v);
    if (showLcd) showLcd(`${label}: ${formatValue(v, paramKey)}`);
  };

  return (
    <div className="flex flex-col items-center gap-1 w-14">
      <span className="text-[9px] text-neutral-400 font-bold uppercase text-center h-6 flex items-end tracking-wider">{label}</span>
      <div
        className="relative w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 shadow-xl flex items-center justify-center group"
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? step : -step;
          handleChange({ target: { value: Math.max(min, Math.min(max, safeValue + delta)) } });
        }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div
          className="w-[3px] h-[14px] bg-amber-400 rounded-full absolute top-[4px] pointer-events-none transition-transform"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 16px' }}
        />
      </div>
    </div>
  );
}