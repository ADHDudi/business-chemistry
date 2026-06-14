import React from 'react';
import { Users } from 'lucide-react';

export function PersonaList({ title, items, icon }: { title: string, items: string[], icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {title && <h4 className="flex items-center gap-2 font-black text-slate-800 text-lg tracking-tight">{icon} {title}</h4>}
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-base text-slate-600 font-medium leading-relaxed">
            <div className="mt-2 w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContextIcon({ profile }: { profile: string | null }) {
  if (!profile) return <Users size={18} className="text-slate-400" />;
  if (profile === 'Guardian') return <span className="text-lg">🛡️</span>;
  if (profile === 'Driver') return <span className="text-lg">🎯</span>;
  if (profile === 'Integrator') return <span className="text-lg">🤝</span>;
  return <span className="text-lg">🚀</span>;
}
