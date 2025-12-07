import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-md ${className}`}>
      {title && <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </div>
  );
};