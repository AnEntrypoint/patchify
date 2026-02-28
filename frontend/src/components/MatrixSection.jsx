import React from 'react';

export function MatrixSection({ title, children, rightHeader }) {
  return (
    <div className="border border-neutral-600 p-2 rounded relative flex flex-col justify-end min-h-[60px] bg-neutral-800/80 shadow-inner col-span-1">
      <span className="absolute -top-[10px] left-2 bg-neutral-800 px-1 text-[8px] text-amber-500 font-bold uppercase tracking-widest border border-neutral-600 rounded-sm">{title}</span>
      {rightHeader && <div className="absolute -top-[10px] right-2">{rightHeader}</div>}
      <div className="flex justify-around items-end w-full gap-0.5 mt-2 h-full">{children}</div>
    </div>
  );
}