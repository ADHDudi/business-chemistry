import React from 'react';

interface LegalPageProps {
  language: 'he' | 'en';
}

export default function PrivacyPage({ language }: LegalPageProps) {
  const thAlign = language === 'he' ? 'text-right' : 'text-left';

  const t = {
    he: {
      back: '← חזרה לאפליקציה',
      heading: 'מדיניות פרטיות',
      lastUpdated: 'עודכן לאחרונה: מאי 2025',
      sections: [
        {
          title: 'מבוא',
          body: (
            <p>
              מדיניות פרטיות זו מתארת כיצד Just AI It (דוד צור) אוספת, משתמשת ומגנה על המידע
              האישי שלך בעת שימוש בפלטפורמת Bond. שימוש בפלטפורמה מהווה הסכמה
              למדיניות זו.
            </p>
          ),
        },
        {
          title: 'מידע שאנו אוספים',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>שם מלא ואימייל (מוזנים ידנית או מחשבון Google)</li>
              <li>תשובות לשאלון (35 ערכים מספריים)</li>
              <li>ציונים מחושבים ופרסונה</li>
              <li>תובנה שנוצרה על ידי בינה מלאכותית</li>
              <li>נתוני סשן (למצב Live בלבד — זמניים)</li>
              <li>כתובת IP ופרטי דפדפן (דרך Firebase Analytics)</li>
              <li>חותמות זמן</li>
            </ul>
          ),
        },
        {
          title: 'שימוש במידע',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>הפעלת שירות ההערכה ויצירת דוח אישי</li>
              <li>ניהול חשבון והתחברות</li>
              <li>ניתוח ושיפור השירות</li>
              <li>מחקר אנונימי ולא מזוהה על דפוסי התנהגות עסקית</li>
              <li>מניעת שימוש לרעה ואבטחת המערכת</li>
            </ul>
          ),
        },
        {
          title: 'שירותי צד שלישי',
          body: (
            <>
              <p className="mb-3">
                הפלטפורמה משתמשת בשירותי הצד השלישי הבאים. כל שירות כפוף למדיניות הפרטיות שלו.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>שירות</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>מטרה</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>מידע שמועבר</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200`}>מיקום שרתים</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Authentication</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">כניסת משתמשים (Google OAuth + אימייל)</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">אימייל, שם, מזהה Google</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Analytics</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">ניתוח שימוש</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">אירועי שימוש פסאודו-אנונימיים, IP</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Firestore</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">מסד נתונים — נתוני סשן חי</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">מזהה סשן, שם, אימייל, תשובות, ציונים</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Cloud Functions</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">עיבוד AI בשרת</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">תשובות שאלון, פרסונה</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google Gemini AI</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">יצירת תובנות מותאמות אישית</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">ציונים אנונימיים ופרסונה</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google Apps Script / Sheets</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">איסוף תוצאות למחקר</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">שם, אימייל, ציונים, פרסונה, תשובות, חותמת זמן</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google OAuth 2.0</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">כניסה עם Google</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">שם, אימייל</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, ארה"ב</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 align-top pr-3">Google Fonts</td>
                      <td className="py-2 text-slate-600 align-top pr-3">גופנים (Inter, Space Grotesk, JetBrains Mono)</td>
                      <td className="py-2 text-slate-600 align-top pr-3">כתובת IP (בקשת גופן)</td>
                      <td className="py-2 text-slate-600 align-top">Google, ארה"ב</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          title: 'אבטחת מידע',
          body: (
            <p>
              אנו נוקטים באמצעי אבטחה טכניים סבירים: העברת נתונים מוצפנת באמצעות TLS, ניהול
              הרשאות מוגבלות, וסיסמאות מגובבות על ידי Firebase (bcrypt). אין מערכת מאובטחת ב-100%;
              עם זאת, נוטיע אותך בהקדם על כל פרצת אבטחה מהותית.
            </p>
          ),
        },
        {
          title: 'שמירת מידע',
          body: (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className={`${thAlign} font-black text-slate-700 pb-2 border-b border-slate-200 pr-3`}>סוג מידע</th>
                      <th className={`${thAlign} font-black text-slate-700 pb-2 border-b border-slate-200`}>תקופת שמירה</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">נתוני סשן (מצב Live)</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">7 ימים</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">פרטי משתמש ותוצאות הערכה</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">עד מחיקת החשבון</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">לוגים אנליטיים</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">90 יום</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 align-top pr-3">רשומות המחקר (Sheets)</td>
                      <td className="py-2 text-slate-600 align-top">שנתיים</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                לאחר מחיקת חשבון, המידע האישי המזוהה יימחק תוך 30 ימי עסקים.
              </p>
            </>
          ),
        },
        {
          title: 'זכויות המשתמש',
          body: (
            <>
              <p className="mb-2">
                בהתאם לחוק הגנת הפרטיות התשמ"א-1981, עומדות לך הזכויות הבאות:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>זכות עיון — לבקש לראות את המידע שנאסף עליך</li>
                <li>זכות תיקון — לבקש תיקון מידע שגוי</li>
                <li>זכות מחיקה — לבקש מחיקת פרטיך (בכפוף לחובות חוקיות)</li>
                <li>זכות ניוד — לבקש קובץ מידע אישי בפורמט נגיש</li>
                <li>זכות התנגדות — לסרב לקבלת תקשורת שיווקית</li>
              </ul>
              <p className="mt-2">
                לבקשות בנוגע לזכויותיך, פנה/י אל{' '}
                <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                  tsur.david@gmail.com
                </a>
                . זמן התגובה: עד 30 ימי עסקים.
              </p>
            </>
          ),
        },
        {
          title: 'עוגיות (Cookies)',
          body: (
            <p>
              הפלטפורמה משתמשת בעוגיות פונקציונליות לניהול הסשן (Firebase Auth) ועוגיות אנליטיות
              אנונימיות (Firebase Analytics). ניתן לחסום עוגיות בהגדרות הדפדפן, אך הדבר עשוי
              לפגוע בפונקציונליות.
            </p>
          ),
        },
        {
          title: 'שינויים במדיניות',
          body: (
            <p>
              נעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו בפלטפורמה. המשך השימוש מהווה
              הסכמה לגרסה המעודכנת.
            </p>
          ),
        },
        {
          title: 'יצירת קשר',
          body: (
            <p>
              לשאלות בנוגע לפרטיות:{' '}
              <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                tsur.david@gmail.com
              </a>
            </p>
          ),
        },
      ],
    },
    en: {
      back: '← Back to App',
      heading: 'Privacy Policy',
      lastUpdated: 'Last updated: May 2025',
      sections: [
        {
          title: 'Introduction',
          body: (
            <p>
              This Privacy Policy describes how Just AI It (David Tsur) collects, uses, and protects
              your personal information when you use the Bond platform. Using the
              Platform constitutes consent to this policy.
            </p>
          ),
        },
        {
          title: 'Information We Collect',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Full name and email (manually entered or from Google account)</li>
              <li>Quiz answers (35 numeric values)</li>
              <li>Calculated scores and persona type</li>
              <li>AI-generated insight</li>
              <li>Session data (Live mode only — temporary)</li>
              <li>IP address and browser info (via Firebase Analytics)</li>
              <li>Timestamps</li>
            </ul>
          ),
        },
        {
          title: 'How We Use Your Information',
          body: (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Operating the assessment service and generating personalised reports</li>
              <li>Account management and authentication</li>
              <li>Service analysis and improvement</li>
              <li>Anonymous, non-identified research on business behaviour patterns</li>
              <li>Preventing misuse and securing the system</li>
            </ul>
          ),
        },
        {
          title: 'Third-Party Services',
          body: (
            <>
              <p className="mb-3">
                The Platform uses the following third-party services. Each service is subject to its
                own privacy policy.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>Service</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>Purpose</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200 pr-3`}>Data shared</th>
                      <th className={`${thAlign} font-black text-slate-600 pb-2 border-b border-slate-200`}>Server location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Authentication</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">User login (Google OAuth + email/password)</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Email, name, Google account ID</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Analytics</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Usage analytics</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Pseudonymous usage events, IP address</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Firestore</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Database — live session pairing data</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Session ID, name, email, quiz answers, scores</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Firebase Cloud Functions</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Server-side AI processing</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Quiz answers, persona type</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google Gemini AI</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Generates personalised insights</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Anonymised quiz scores and persona type</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google Apps Script / Sheets</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Collects quiz results for research</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Name, email, scores, persona, answers, timestamp</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google OAuth 2.0</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Google sign-in</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Name, email</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Google, USA</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 align-top pr-3">Google Fonts</td>
                      <td className="py-2 text-slate-600 align-top pr-3">Typography (Inter, Space Grotesk, JetBrains Mono)</td>
                      <td className="py-2 text-slate-600 align-top pr-3">IP address (font request)</td>
                      <td className="py-2 text-slate-600 align-top">Google, USA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          title: 'Data Security',
          body: (
            <p>
              We implement reasonable technical security measures: TLS-encrypted data transfer,
              restricted access controls, and passwords hashed by Firebase (bcrypt). No system is
              100% secure; however, we will notify you promptly of any material security breach.
            </p>
          ),
        },
        {
          title: 'Data Retention',
          body: (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className={`${thAlign} font-black text-slate-700 pb-2 border-b border-slate-200 pr-3`}>Data type</th>
                      <th className={`${thAlign} font-black text-slate-700 pb-2 border-b border-slate-200`}>Retention period</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Session data (Live mode)</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">7 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">User profile &amp; assessment results</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">Until account deletion</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top pr-3">Analytics logs</td>
                      <td className="py-2 text-slate-600 border-b border-slate-100 align-top">90 days</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 align-top pr-3">Research records (Sheets)</td>
                      <td className="py-2 text-slate-600 align-top">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                After account deletion, identifiable personal data will be deleted within 30 business
                days.
              </p>
            </>
          ),
        },
        {
          title: 'Your Rights',
          body: (
            <>
              <p className="mb-2">
                Under the Israeli Privacy Protection Law 5741-1981, you have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Right of access — request to view data collected about you</li>
                <li>Right of correction — request correction of inaccurate data</li>
                <li>Right of deletion — request deletion of your data (subject to legal obligations)</li>
                <li>Right of portability — request your personal data in an accessible format</li>
                <li>Right to object — opt out of marketing communications</li>
              </ul>
              <p className="mt-2">
                To exercise your rights, contact{' '}
                <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                  tsur.david@gmail.com
                </a>
                . Response time: up to 30 business days.
              </p>
            </>
          ),
        },
        {
          title: 'Cookies',
          body: (
            <p>
              The Platform uses functional cookies for session management (Firebase Auth) and
              anonymous analytics cookies (Firebase Analytics). You can block cookies in browser
              settings, though this may impair functionality.
            </p>
          ),
        },
        {
          title: 'Policy Changes',
          body: (
            <p>
              We update this policy from time to time. Material changes will be published on the
              Platform. Continued use constitutes acceptance of the updated version.
            </p>
          ),
        },
        {
          title: 'Contact',
          body: (
            <p>
              For privacy enquiries:{' '}
              <a href="mailto:tsur.david@gmail.com" className="text-[#8c50f0] underline font-bold">
                tsur.david@gmail.com
              </a>
            </p>
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
        {t.sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-[1.75rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 p-6 space-y-2"
          >
            <h2 className="text-base font-black text-slate-800">{section.title}</h2>
            <div className="text-sm text-slate-600 leading-relaxed">{section.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
