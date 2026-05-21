import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;       // initial open state (default false)
  forceOpen?: boolean;         // when defined, overrides open state (for ADHD lens)
  isAdhd?: boolean;            // renders a purple "ADHD" badge next to the title
  children: ReactNode;
}

export function CollapsibleSection({ title, icon, defaultOpen = false, forceOpen, isAdhd, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(forceOpen ?? defaultOpen);
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen); }, [forceOpen]);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
      >
        <span className="flex items-center gap-2 font-black text-slate-800 text-sm text-left">
          {icon}
          <span>{title}</span>
          {isAdhd && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#f3ecff] text-[#8c50f0]">ADHD</span>}
        </span>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
