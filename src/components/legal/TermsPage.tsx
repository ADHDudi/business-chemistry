import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LegalPageProps {
  language: 'he' | 'en';
}

export default function TermsPage({ language }: LegalPageProps) {
  const t = {
    he: {
      back: '← חזרה לאפליקציה',
      heading: 'תנאי שימוש',
      lastUpdated: 'עודכן לאחרונה: מאי 2025',
      sections: [
        {
          title: 'מבוא',
          body: (
            <p>
              פלטפורמת Bond (להלן: "הפלטפורמה") מופעלת על ידי Just AI It (דוד צור).
              השימוש בפלטפורמה מהווה הסכמה לתנאי שימוש אלו. אם אינך מסכים לתנאים, אנא הפסק את
              השימוש בפלטפורמה.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'הגדרות',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>"פלטפורמה" — אתר Bond וכל שירותיו.</li>
              <li>"משתמש" — כל אדם המשתמש בפלטפורמה.</li>
              <li>"הערכה" — שאלון 35 השאלות ותוצאותיו.</li>
              <li>
                "פרסונה" — אחד מ-4 סגנונות התנהגות עסקיים: Pioneer, Driver, Integrator, Guardian.
              </li>
            </ul>
          ),
          disclaimer: false,
        },
        {
          title: 'הרשמה ושימוש',
          body: (
            <>
              <p>
                המשתמש מאשר שהמידע שמסר (שם, אימייל) מדויק. השימוש בפלטפורמה מותר למטרות אישיות
                ועסקיות בלבד. אין להשתמש בפלטפורמה לצרכים בלתי חוקיים, להפיץ את תוכנה ללא אישור,
                או לגרד (scrape) את המידע ממנה.
              </p>
            </>
          ),
          disclaimer: false,
        },
        {
          title: 'הצהרת אחריות',
          body: (
            <p>
              <strong>חשוב:</strong> תוצאות ההערכה ניתנות למטרות מידע כללי בלבד. הן אינן מהוות
              אבחון פסיכולוגי, ייעוץ מקצועי, המלצה לקבלת החלטות עסקיות, או תחליף לטיפול מקצועי.
              Just AI It אינה אחראית להחלטות שיתקבלו על בסיס התוצאות. תוצאות ההערכה עשויות
              להשתנות לאורך זמן ואינן מחייבות.
            </p>
          ),
          disclaimer: true,
        },
        {
          title: 'קניין רוחני',
          body: (
            <p>
              כל תוכן הפלטפורמה — שאלות, אלגוריתמים, טקסט, עיצוב ולוגואים — הוא רכוש Just AI It
              או ניתן לה ברישיון. חל איסור להעתיק, להפיץ או לעשות שימוש מסחרי בתכנים ללא אישור
              מפורש בכתב.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'פרטיות',
          body: (
            <p>
              איסוף ועיבוד המידע האישי מתואר במדיניות הפרטיות שלנו. בשימוש בפלטפורמה, המשתמש
              מסכים גם למדיניות הפרטיות.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'הגבלת אחריות',
          body: (
            <p>
              הפלטפורמה מוצעת "כמות שהיא" (AS IS). Just AI It אינה מתחייבת לדיוק, שלמות, או
              התאמה לצורך מסוים של התכנים. החברה לא תישא באחריות לנזקים ישירים, עקיפים, או
              תוצאתיים הנובעים מהשימוש בפלטפורמה. מאחר שהשירות ניתן ללא תשלום, אחריות החברה
              מוגבלת לאפס.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'שינויים',
          body: (
            <p>
              Just AI It שומרת לעצמה את הזכות לשנות תנאים אלו בכל עת. שינויים מהותיים יפורסמו
              בפלטפורמה. המשך השימוש לאחר פרסום השינויים מהווה הסכמה להם.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'דין ושיפוט',
          body: (
            <p>
              תנאים אלו כפופים לדיני מדינת ישראל. סמכות השיפוט הבלעדית לכל מחלוקת תהא בבתי
              המשפט המוסמכים בתל אביב-יפו.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'יצירת קשר',
          body: (
            <p>
              לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו:{' '}
              <a
                href="mailto:tsur.david@gmail.com"
                className="text-[#8c50f0] underline font-bold"
              >
                tsur.david@gmail.com
              </a>
            </p>
          ),
          disclaimer: false,
        },
      ],
    },
    en: {
      back: '← Back to App',
      heading: 'Terms of Use',
      lastUpdated: 'Last updated: May 2025',
      sections: [
        {
          title: 'Introduction',
          body: (
            <p>
              The Bond platform (the "Platform") is operated by Just AI It (David
              Tsur). Using the Platform constitutes acceptance of these Terms of Use. If you do not
              agree, please stop using the Platform.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Definitions',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>"Platform" — the Bond website and all its services.</li>
              <li>"User" — any person using the Platform.</li>
              <li>"Assessment" — the 35-question quiz and its results.</li>
              <li>
                "Persona" — one of 4 business behaviour styles: Pioneer, Driver, Integrator,
                Guardian.
              </li>
            </ul>
          ),
          disclaimer: false,
        },
        {
          title: 'Registration & Use',
          body: (
            <p>
              The User confirms that information provided (name, email) is accurate. Use of the
              Platform is permitted for personal and professional purposes only. Prohibited:
              unlawful use, distributing Platform content without permission, or scraping data from
              the Platform.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Content Disclaimer',
          body: (
            <p>
              <strong>Important:</strong> Assessment results are provided for general information
              purposes only. They do not constitute a psychological diagnosis, professional advice,
              a recommendation for business decisions, or a substitute for professional treatment.
              Just AI It is not responsible for decisions made based on results. Results may change
              over time and are non-binding.
            </p>
          ),
          disclaimer: true,
        },
        {
          title: 'Intellectual Property',
          body: (
            <p>
              All Platform content — questions, algorithms, text, design, and logos — is the
              property of Just AI It or licensed to it. Copying, distributing, or making commercial
              use of the content without explicit written permission is prohibited.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Privacy',
          body: (
            <p>
              The collection and processing of personal data is described in our Privacy Policy. By
              using the Platform, the User also agrees to the Privacy Policy.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Limitation of Liability',
          body: (
            <p>
              The Platform is provided "as is". Just AI It makes no warranties as to the accuracy,
              completeness, or fitness for a particular purpose of its content. The company shall
              not be liable for direct, indirect, or consequential damages arising from use of the
              Platform. As the service is free, the company's maximum liability is zero.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Modifications',
          body: (
            <p>
              Just AI It reserves the right to modify these terms at any time. Material changes
              will be published on the Platform. Continued use after publication of changes
              constitutes acceptance of them.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Governing Law',
          body: (
            <p>
              These terms are governed by the laws of the State of Israel. Exclusive jurisdiction
              for any dispute shall be vested in the competent courts of Tel Aviv-Jaffa.
            </p>
          ),
          disclaimer: false,
        },
        {
          title: 'Contact',
          body: (
            <p>
              For questions regarding these Terms of Use, contact us:{' '}
              <a
                href="mailto:tsur.david@gmail.com"
                className="text-[#8c50f0] underline font-bold"
              >
                tsur.david@gmail.com
              </a>
            </p>
          ),
          disclaimer: false,
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
          section.disclaimer ? (
            <div
              key={section.title}
              className="bg-amber-50 rounded-[1.75rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-amber-200 p-6 space-y-2"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-base font-black text-amber-800">{section.title}</h2>
              </div>
              <div className="text-sm text-amber-800 leading-relaxed">{section.body}</div>
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
