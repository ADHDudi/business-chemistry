import React from 'react';
import { Language } from '../types';

const YEAR = new Date().getFullYear();

const labels = {
  he: {
    copyright: `© ${YEAR} Business Chemistry`,
    by: 'מאת Just AI It',
    terms: 'תנאי שימוש',
    privacy: 'מדיניות פרטיות',
    accessibility: 'הצהרת נגישות',
  },
  en: {
    copyright: `© ${YEAR} Business Chemistry`,
    by: 'by Just AI It',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    accessibility: 'Accessibility',
  },
};

export default function Footer({ language }: { language: Language }) {
  const t = labels[language];
  return (
    <footer
      dir={language === 'he' ? 'rtl' : 'ltr'}
      className="border-t border-slate-100 mt-10 py-5 px-4"
    >
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
        <p className="text-[11px] text-slate-400 font-bold">
          {t.copyright}{' '}
          <span className="text-slate-300 mx-1">·</span>{' '}
          {t.by}
        </p>
        <nav className="flex gap-5 text-[11px]">
          <a href="#terms" className="text-slate-400 hover:text-[#8c50f0] font-bold transition-colors">
            {t.terms}
          </a>
          <a href="#privacy" className="text-slate-400 hover:text-[#8c50f0] font-bold transition-colors">
            {t.privacy}
          </a>
          <a href="#accessibility" className="text-slate-400 hover:text-[#8c50f0] font-bold transition-colors">
            {t.accessibility}
          </a>
        </nav>
      </div>
    </footer>
  );
}
