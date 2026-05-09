import React from 'react';

interface LegalPageProps {
  language: 'he' | 'en';
}

export default function AccessibilityPage({ language }: LegalPageProps) {
  const t = {
    he: {
      back: '← חזרה לאפליקציה',
      heading: 'הצהרת נגישות',
      lastUpdated: 'עודכן לאחרונה: מאי 2025',
      sections: [
        {
          title: 'מחויבות לנגישות',
          coordinator: false,
          body: (
            <p>
              פלטפורמת Business Chemistry מחויבת לספק שירות נגיש לכלל המשתמשים, לרבות אנשים עם
              מוגבלויות. הפלטפורמה שואפת לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות
              (התאמות נגישות לשירות) תשע"ג-2013, תקנה 35, ובתקן הישראלי IS 5568 ברמת AA (המקביל
              ל-WCAG 2.1 AA). הצהרה זו עודכנה בפעם האחרונה במאי 2025.
            </p>
          ),
        },
        {
          title: 'התאמות נגישות שבוצעו',
          coordinator: false,
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>תמיכה מלאה בכיוון טקסט מימין לשמאל (RTL) לעברית</li>
              <li>פריסה רספונסיבית המותאמת לכל מסך, כולל נייד</li>
              <li>גופן Inter — קריא וברור, מתרחב בהתאם להגדרות המשתמש</li>
              <li>ניווט באמצעות מקלדת: כפתורים ושדות טופס נגישים ב-Tab</li>
              <li>אלמנטים סמנטיים: header, main, button, form, label, input</li>
              <li>שדות טופס עם תוויות (labels) מזוהות</li>
              <li>ניגודיות צבעים: טקסט כהה על רקע בהיר בהתאם לדרישות AA</li>
              <li>אינדיקטורי פוקוס גלויים על אלמנטים אינטראקטיביים</li>
              <li>ללא אודיו או וידאו המופעל אוטומטית</li>
              <li>מתג שפה נגיש (עברית / אנגלית)</li>
            </ul>
          ),
        },
        {
          title: 'מגבלות ידועות',
          coordinator: false,
          body: (
            <>
              <p>
                נכון למאי 2025, הפלטפורמה אינה מיישמת באופן מלא את הפריטים הבאים — אנו עובדים על
                שיפורם:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 mt-2">
                <li>אזורי ARIA live לעדכונים דינמיים</li>
                <li>קישור "דלג לתוכן" בראש הדף</li>
                <li>תיאורי ARIA מלאים לסקציות תוכן שנוצרות על ידי בינה מלאכותית</li>
                <li>בדיקות עם טכנולוגיות מסייעות (NVDA, VoiceOver) — בתהליך</li>
              </ul>
            </>
          ),
        },
        {
          title: 'תקנים וכלי בדיקה',
          coordinator: false,
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>יעד הנגישות: תקן ישראלי IS 5568 רמת AA (WCAG 2.1 AA)</li>
              <li>הבדיקה בוצעה ידנית על Chrome ו-Safari (מחשב ונייד)</li>
              <li>טכנולוגיות מסייעות: בדיקה עם VoiceOver (macOS/iOS) — חלקית</li>
              <li>כלי אוטומטיים: Lighthouse</li>
            </ul>
          ),
        },
        {
          title: 'רכז נגישות ויצירת קשר',
          coordinator: true,
          body: (
            <>
              <p>
                לדיווח על בעיות נגישות, בקשת התאמות, או שאלות — פנו לרכז הנגישות:
              </p>
              <ul className="space-y-1 text-sm text-slate-700 mt-3">
                <li>
                  <span className="font-black text-slate-800">שם:</span> דוד צור
                </li>
                <li>
                  <span className="font-black text-slate-800">תפקיד:</span> רכז נגישות, Just AI It
                </li>
                <li>
                  <span className="font-black text-slate-800">אימייל:</span>{' '}
                  <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                    tsur.david@gmail.com
                  </a>
                </li>
                <li>
                  <span className="font-black text-slate-800">זמן תגובה:</span> נשתדל לאשר קבלת
                  הפנייה תוך 7 ימי עסקים ולטפל בה תוך 60 יום.
                </li>
              </ul>
              <p className="mt-3">
                פנייה שתועבר לרכז הנגישות תיבדק ויינתן מענה בהקדם האפשרי, לרבות חלופות נגישות
                זמניות במידת הצורך.
              </p>
            </>
          ),
        },
      ],
    },
    en: {
      back: '← Back to App',
      heading: 'Accessibility Statement',
      lastUpdated: 'Last updated: May 2025',
      sections: [
        {
          title: 'Commitment to Accessibility',
          coordinator: false,
          body: (
            <p>
              The Business Chemistry platform is committed to providing an accessible service for all
              users, including people with disabilities. The Platform strives to comply with the Equal
              Rights for Persons with Disabilities (Accessibility to Service) Regulations 5773-2013,
              Section 35, and Israeli Standard IS 5568 Level AA (equivalent to WCAG 2.1 AA). This
              statement was last updated in May 2025.
            </p>
          ),
        },
        {
          title: 'Accessibility Implementations',
          coordinator: false,
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Full right-to-left (RTL) text support for Hebrew</li>
              <li>Responsive layout adapted for all screen sizes including mobile</li>
              <li>Inter font — highly legible, scales with user settings</li>
              <li>Keyboard navigation: buttons and form fields accessible via Tab</li>
              <li>Semantic HTML elements: header, main, button, form, label, input</li>
              <li>Form fields with associated labels</li>
              <li>Colour contrast: dark text on light backgrounds meeting AA requirements</li>
              <li>Visible focus indicators on interactive elements</li>
              <li>No auto-playing audio or video</li>
              <li>Accessible language toggle (Hebrew / English)</li>
            </ul>
          ),
        },
        {
          title: 'Known Limitations',
          coordinator: false,
          body: (
            <>
              <p>
                As of May 2025, the following items are not yet fully implemented — we are working on
                improvements:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 mt-2">
                <li>ARIA live regions for dynamic updates</li>
                <li>Skip-to-content link at the top of the page</li>
                <li>Full ARIA descriptions for AI-generated content sections</li>
                <li>Testing with assistive technologies (NVDA, VoiceOver) — in progress</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Standards & Testing',
          coordinator: false,
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Accessibility target: Israeli Standard IS 5568 Level AA (WCAG 2.1 AA)</li>
              <li>Testing performed manually on Chrome and Safari (desktop and mobile)</li>
              <li>Assistive technologies: partial testing with VoiceOver (macOS/iOS)</li>
              <li>Automated tools: Lighthouse</li>
            </ul>
          ),
        },
        {
          title: 'Accessibility Coordinator & Contact',
          coordinator: true,
          body: (
            <>
              <p>
                To report accessibility issues, request accommodations, or ask questions — contact
                our Accessibility Coordinator:
              </p>
              <ul className="space-y-1 text-sm text-slate-700 mt-3">
                <li>
                  <span className="font-black text-slate-800">Name:</span> David Tsur
                </li>
                <li>
                  <span className="font-black text-slate-800">Role:</span> Accessibility Coordinator,
                  Just AI It
                </li>
                <li>
                  <span className="font-black text-slate-800">Email:</span>{' '}
                  <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                    tsur.david@gmail.com
                  </a>
                </li>
                <li>
                  <span className="font-black text-slate-800">Response time:</span> We aim to
                  acknowledge your message within 7 business days and resolve issues within 60 days.
                </li>
              </ul>
              <p className="mt-3">
                Reports submitted to the Accessibility Coordinator will be reviewed and responded to
                as soon as possible, including temporary accessible alternatives where needed.
              </p>
            </>
          ),
        },
      ],
    },
  }[language];

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Back link */}
        <a href="/" className="text-xs font-black text-[#8c50f0] hover:opacity-80">
          {t.back}
        </a>

        {/* Page heading */}
        <div>
          <h1 className="text-3xl font-black gradient-text">{t.heading}</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">{t.lastUpdated}</p>
        </div>

        {/* Sections */}
        {t.sections.map((section) =>
          section.coordinator ? (
            <div
              key={section.title}
              className="bg-[#f3ecff] rounded-[1.75rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-[#e4d7ff] p-6 space-y-2"
            >
              <h2 className="text-base font-black text-slate-800">{section.title}</h2>
              <div className="text-sm text-slate-600 leading-relaxed">{section.body}</div>
            </div>
          ) : (
            <div
              key={section.title}
              className="bg-white rounded-[1.75rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 p-6 space-y-2"
            >
              <h2 className="text-base font-black text-slate-800">{section.title}</h2>
              <div className="text-sm text-slate-600 leading-relaxed">{section.body}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
