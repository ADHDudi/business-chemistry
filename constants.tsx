import React from 'react';
import { 
  Rocket, Users, Zap, Shield, 
  Brain, Sparkles, Award, User, Mail, 
  ArrowLeft, ArrowRight, CheckCircle, 
  Grid, List, Target, Hash, Play, 
  Loader2, Lightbulb, ExternalLink, 
  Copy, Check, Youtube, Facebook, 
  Instagram, Calendar, MessageCircle, 
  BrainCircuit, Star, Globe, FlaskConical,
  Linkedin, Info, AlertCircle, TrendingDown,
  Layers, Gift
} from 'lucide-react';
import { AxisType, Trait, Persona } from './types';

/**
 * REUSABLE BACKEND CONFIGURATION
 * Replace this URL with your newly deployed Google Apps Script Web App URL
 */
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwiCjNYNDXlpdAimsI-vOeyLLW4YMR-uFeacXrqba8Mr7eYYuY5tfa31jCQO4uGiiqXiQ/exec"; 

export const APP_ID = "ADHDudi-Chemistry";

export const SOCIAL_LINKS = {
  website: "https://adhtalentd.com/",
  linkedin: "https://www.linkedin.com/in/davidtsur/",
  facebook: "https://www.facebook.com/ADHDudi.D",
  youtube: "https://www.youtube.com/@ADHDudiDO"
};

export const TEXT = {
  he: {
    title: "ADHDudi",
    steps: { details: "פרטים", quiz: "שאלון", report: "דוח" },
    welcome_title: "גלו את הכימיה העסקית שלכם",
    welcome_subtitle: "אבחון קצר שישנה את הדרך בה אתם עובדים ומתקשרים.",
    sections: {
      pain: { 
        title: "מרגישים שאתם מדברים בשפה אחרת?", 
        desc: "קצרים בתקשורת בתוך הצוות יוצרים מתח, אי-הבנות ותחושת תסכול מתמדת.",
        icon: "AlertCircle"
      },
      cost: { 
        title: "זה עולה לכם ביוקר", 
        desc: "איבוד זמן יקר על 'פינג-פונג' מיותר, שחיקה רגשית ופספוס של הזדמנויות עסקיות משמעותיות.",
        icon: "TrendingDown"
      },
      method: { 
        title: "שיטת ה-Business Chemistry", 
        desc: "מודל מחקרי המזהה 4 דפוסי התנהגות: מקדמים, משימתיים, מנתחים ותומכים.",
        icon: "Layers"
      },
      wiifm: { 
        title: "המוטו והערך שלכם", 
        desc: "גלו מה מניע אתכם באמת וקבלו דוח אסטרטגיות מותאם אישית (WIIFM) לניהול תקשורת עם ADHD.",
        icon: "Gift"
      }
    },
    form: {
      name_label: "שם מלא",
      name_placeholder: "איך לקרוא לך?",
      email_label: "אימייל לקבלת הדוח המלא",
      email_placeholder: "your@email.com",
      submit_btn: "בואו נתחיל"
    },
    demo: {
      title: "מצב הדגמה (למפתחים/בודקים)",
      subtitle: "דלג ישירות לתוצאה:",
      pioneer: "מקדם (Pioneer)",
      driver: "משימתי (Driver)",
      guardian: "מנתח (Guardian)",
      integrator: "תומך (Integrator)"
    },
    quiz: {
      instructions_title: "איך זה עובד?",
      instructions_desc: "לפניך 35 צמדי תכונות. מקם/י את עצמך על הסקאלה.",
      no_wrong_answer: "האמת שלך היא התשובה הנכונה ביותר",
      progress: "התקדמות",
      finish_btn: "סיימתי!",
      processing: "מעבד נתונים...",
      ai_thinking: "ה-AI מנתח את הפרופיל שלך..."
    },
    report: {
      ready_badge: "התוצאות שלך מוכנות!",
      greeting: "היי,",
      subtitle: "הנה המפה האישיותית שלך",
      restart_btn: "התחל אבחון חדש",
      copy_btn: "העתק תוצאות למייל",
      copied_btn: "הועתק!",
      tabs: { matrix: "המטריצה", details: "פירוט מלא" },
      matrix_title: "המיקום שלך ביחס לטיפוסים האחרים",
      your_type: "הטיפוס שלך",
      strengths_title: "חוזקות בולטות",
      tips_title: "טיפים להצלחה",
      adhd_title: "הזווית של ה-ADHD",
      axis_dominant: "דומיננטיות",
      axis_formal: "רשמיות",
      labels: {
        passive: "פאסיבי",
        dominant: "דומיננטי",
        informal: "בלתי רשמי",
        formal: "רשמי/שיטתי"
      },
      personas: {
        driver: "משימתי (Driver)",
        analyzer: "מנתח (Guardian)",
        promoter: "מקדם (Pioneer)",
        supporter: "תומך (Integrator)"
      },
      cta: {
        title: "מרגישים שיש קצר בתקשורת?",
        btn: "לקביעת מפגש יעוץ בעלות 440 ש״ח",
        more_details: "שירותי ADHD נוספים",
        follow: "עקבו אחריי:"
      }
    }
  },
  en: {
    title: "ADHDudi",
    steps: { details: "Details", quiz: "Quiz", report: "Report" },
    welcome_title: "Discover Your Business Chemistry",
    welcome_subtitle: "A short assessment to transform how you work and communicate.",
    sections: {
      pain: { 
        title: "Feel Like You're Speaking a Different Language?", 
        desc: "Communication gaps within the team create tension, misunderstandings, and constant frustration.",
        icon: "AlertCircle"
      },
      cost: { 
        title: "It's Costing You More Than You Think", 
        desc: "Wasted time on needless 'ping-pong', emotional burnout, and missing out on significant business opportunities.",
        icon: "TrendingDown"
      },
      method: { 
        title: "The Business Chemistry Method", 
        desc: "A research-based model identifying 4 behavioral patterns: Pioneers, Drivers, Guardians, and Integrators.",
        icon: "Layers"
      },
      wiifm: { 
        title: "Your Motto & Value (WIIFM)", 
        desc: "Discover what truly drives you and get a personalized strategies report tailored for ADHD communication.",
        icon: "Gift"
      }
    },
    form: {
      name_label: "Full Name",
      name_placeholder: "What should we call you?",
      email_label: "Email for the Full Report",
      email_placeholder: "your@email.com",
      submit_btn: "Let's Start"
    },
    demo: {
      title: "Demo Mode (Dev/Test)",
      subtitle: "Jump to result:",
      pioneer: "Pioneer",
      driver: "Driver",
      guardian: "Guardian",
      integrator: "Integrator"
    },
    quiz: {
      instructions_title: "How it works?",
      instructions_desc: "You will see 35 pairs of traits. Place yourself on the scale.",
      no_wrong_answer: "Your truth is the most correct answer!",
      progress: "Progress",
      finish_btn: "I'm Done!",
      processing: "Processing...",
      ai_thinking: "AI is analyzing your profile..."
    },
    report: {
      ready_badge: "Your results are ready!",
      greeting: "Hi,",
      subtitle: "Here is your personality map",
      restart_btn: "Start New Assessment",
      copy_btn: "Copy Results for Email",
      copied_btn: "Copied!",
      tabs: { matrix: "Matrix", details: "Full Details" },
      matrix_title: "Your position relative to other personas",
      your_type: "Your Type",
      strengths_title: "Key Strengths",
      tips_title: "Tips for Success",
      adhd_title: "The ADHD Angle",
      axis_dominant: "Dominance",
      axis_formal: "Formality",
      labels: {
        passive: "Passive",
        dominant: "Dominant",
        informal: "Informal",
        formal: "Formal/Systematic"
      },
      personas: {
        driver: "Driver",
        analyzer: "Guardian",
        promoter: "Pioneer",
        supporter: "Integrator"
      },
      cta: {
        title: "Feeling a disconnect?",
        btn: "Schedule a Consultation Session - 440 NIS",
        more_details: "More ADHD Services",
        follow: "Follow me:"
      }
    }
  }
};

export const PERSONA_DATA: Record<string, Persona> = {
  PIONEER: {
    key: 'PIONEER',
    title: { he: "מקדם (Pioneer)", en: "Pioneer" },
    role: { he: "בואו ננסה את זה!", en: "Let's try it!" },
    icon: 'Rocket',
    color: "yellow",
    description: {
      he: "אתם מעריכים אפשרויות וידועים כמי שמציתים אנרגיה ודמיון. כמקדמים, אתם מוחצנים, ספונטניים ובעלי כושר הסתגלות. אתם רואים את התמונה הגדולה ומאמינים שעם סיכון גדול מגיע תגמול גדול.",
      en: "You value possibilities and spark energy and imagination. As Pioneers, you are outgoing, spontaneous, and adaptable. You see the big picture and believe that great risk brings great reward."
    },
    strengths: {
      he: ["חשיבה יצירתית וראיית התמונה הגדולה", "קבלת החלטות אמיצה וחיפוש הרפתקאות", "אנרגיה בלתי נדלית לנוע קדימה", "הסתגלות מהירה לשינויים"],
      en: ["Creative thinking & big picture view", "Bold decision making & adventure seeking", "Boundless energy to move forward", "Quick adaptation to change"]
    },
    tips: {
      he: ["תנו דרור ליצירתיות שלכם בסיעורי מוחות", "היעזרו בטיפוס ה'מנתח' לטיפול בפרטים הקטנים", "נסו לא להשתעמם כשדברים הופכים לשגרתיים"],
      en: ["Unleash your creativity in brainstorming", "Partner with a 'Guardian' for details", "Try to stay engaged during routine tasks"]
    },
    communication_challenge: {
      he: "כמקדמים, הראש שלכם רץ קדימה, והמפגש עם טיפוסים שמתעקשים על פרטים ונהלים (כמו ה'מנתח') יכול להרגיש כמו נסיעה עם בלם יד מורם. בישיבות צוות, ייתכן שאתם קופצים מנושא לנושא לפני שהשאר עיכלו את הרעיון הראשון.",
      en: "As a Pioneer, your mind races ahead. Encountering types who insist on details (like 'Guardians') can feel like driving with the handbrake on. In meetings, you might jump between three different topics before the team has even digested the first one."
    },
    adhd_challenge: {
      he: "עם הפרעת קשב, האימפולסיביות בתקשורת עלולה לגרום לכם לקטוע אחרים באמצע משפט או לזרוק רעיונות לא אפויים שמבלבלים את הצד השני. הקושי בוויסות קשב גורם לכך שאתם 'מאבדים' אנשים באמצע מצגות ארוכות.",
      en: "With ADHD, conversational impulsivity might cause you to interrupt others mid-sentence. You might throw out half-baked ideas that confuse colleagues, and your difficulty with attention regulation means you easily 'lose' people during long presentations."
    },
    consultation_benefit: {
      he: "במפגש נלמד איך להימנע מיצירת 'סחרחורת' (Whiplash) בצוות מרוב שינויים, וכיצד לבנות 'אח' לאש היצירתית שלכם שתאפשר יישום פרקטי.",
      en: "In the session, we'll learn how to avoid creating team 'Whiplash' from constant pivots and build a 'fireplace' for your creative fire that allows for practical execution."
    }
  },
  INTEGRATOR: {
    key: 'INTEGRATOR',
    title: { he: "תומך (Integrator)", en: "Integrator" },
    role: { he: "בואו נעשה את זה ביחד.", en: "Let's do it together." },
    icon: 'Users',
    color: "green",
    description: {
      he: "אתם מעריכים חיבור ומקרבים צוותים זה לזה. כתומכים, אתם מונעים ממערכות יחסים, אמפתיים ודיפלומטיים.",
      en: "You value connection and bring teams together. As Integrators, you are relationship-driven, empathetic, and diplomatic."
    },
    strengths: {
      he: ["אמפתיה, דיפלומטיה ומיקוד ביחסים", "יכולת הקשבה והערכת נקודות מבט שונות", "ראיית ניואנסים וגוונים של אפור", "יצירת קונצנזוס וגיבוש הצוות"],
      en: ["Empathy, diplomacy & relationship focus", "Deep listening & valuing perspectives", "Seeing nuances and shades of gray", "Building consensus and team unity"]
    },
    tips: {
      he: ["אל תחששו להביע דעה גם אם היא מנוגדת לאחרים", "השתמשו ביכולת החיבור שלכם כדי לקדם שיתופי פעולה", "זכרו לדאוג גם לצרכים שלכם"],
      en: ["Voice your opinion even if it differs", "Use your connecting skills for collaboration", "Remember to prioritize your own needs too"]
    },
    communication_challenge: {
      he: "כתומכים, הרגישות שלכם לדינמיקה האנושית עלולה להיפגע מול טיפוסים ישירים ותכליתיים. לעיתים אתם נמנעים מעימותים הכרחיים באימיילים או ב-Slack כדי 'לא להעכיר את האווירה', מה שמעכב קבלת החלטות.",
      en: "As an Integrator, your sensitivity to human dynamics can be a double-edged sword. You might avoid necessary confrontations in emails or Slack to 'keep the peace,' which ironically can delay critical team decisions."
    },
    adhd_challenge: {
      he: "עם הפרעת קשב, הרגישות הגבוהה לניואנסים (RSD) גורמת לכם לעיתים לפרש טון ענייני ככעס או דחייה. בנוסף, הצפת גירויים חברתית עלולה לגרום לכם לשחיקה מהירה בצוותים אינטנסיביים.",
      en: "With ADHD, Rejection Sensitive Dysphoria (RSD) often causes you to interpret a factual or blunt tone as personal anger. Social overstimulation can also lead to quick burnout in high-intensity team environments."
    },
    consultation_benefit: {
      he: "הפגישה תעזור לכם לצאת מ'מלכודת ההססנות' (Trap of Indecision), ללמוד לתקשר צרכים בצורה אסרטיבית ולנהל את האנרגיה החברתית.",
      en: "The session will help you escape the 'Trap of Indecision,' learn to communicate needs assertively, and manage your social battery effectively."
    }
  },
  DRIVER: {
    key: 'DRIVER',
    title: { he: "משימתי (Driver)", en: "Driver" },
    role: { he: "בואו נגרום לזה לקרות.", en: "Let's make it happen." },
    icon: 'Zap',
    color: "red",
    description: {
      he: "אתם מעריכים את האתגר ומייצרים מומנטום. כמשימתיים, אתם החלטיים, שאפתניים וממוקדי-תוצאות.",
      en: "You value challenge and generate momentum. As Drivers, you are decisive, ambitious, and results-oriented."
    },
    strengths: {
      he: ["קבלת החלטות מהירה ומיקוד בתוצאות", "התמודדות ישירה עם בעיות ואתגרים", "חשיבה כמותית, טכנית ולוגית", "לקיחת פיקוד והובלה נחושה"],
      en: ["Quick decision making & results focus", "Tackling problems head-on", "Quantitative, technical & logical thinking", "Taking command and leading decisively"]
    },
    tips: {
      he: ["זכרו לעצור ולהקשיב גם לדעות של ה'תומך'", "הסבירו את הרציונל מאחורי ההחלטות שלכם", "נסו לגלות סבלנות כלפי תהליכים"],
      en: ["Pause to listen to 'Integrator' perspectives", "Explain the rationale behind decisions", "Practice patience with slower processes"]
    },
    communication_challenge: {
      he: "כמשימתיים, המיקוד שלכם בתוצאות תכליתיות עלול להתפרש ככוחני. בהתכתבויות קצרות, אתם עלולים להישמע 'בוטים' מדי, מה שיוצר התנגדות לא מודעת אצל הקולגות שלכם.",
      en: "As a Driver, your focus on efficiency can be misinterpreted as aggression. In short messages or quick check-ins, you might sound overly blunt, creating unintended friction with your colleagues."
    },
    adhd_challenge: {
      he: "עם הפרעת קשב, חוסר הסבלנות הטבעי שלכם מוקצן. אתם עלולים 'להתנתק' (Zone out) כשמישהו מסביר משהו באריכות, או להגיב בעצבנות כשתהליכים בירוקרטיים מעכבים אתכם.",
      en: "With ADHD, your natural impatience is amplified. You might zone out during long explanations or react with visible frustration when bureaucratic processes slow down your momentum."
    },
    consultation_benefit: {
      he: "במפגש נתמקד ב'נקודה העיוורת' שלכם: איך להניע את הצוות בלי לשרוף גשרים, ואיך לרתום את ההיפר-פוקוס למשימות הנכונות.",
      en: "We'll focus on your 'Blind Spot': How to drive the team without burning bridges, and how to harness your hyperfocus for the highest-impact tasks."
    }
  },
  GUARDIAN: {
    key: 'GUARDIAN',
    title: { he: "מנתח (Guardian)", en: "Guardian" },
    role: { he: "בואו נעשה את זה נכון.", en: "Let's do it right." },
    icon: 'Shield',
    color: "blue",
    description: {
      he: "אתם מעריכים יציבות ומביאים סדר וקפדנות. כמנתחים, אתם פרגמטיים, מתודיים וממוקדים בפרטים.",
      en: "You value stability and bring order and rigor. As Guardians, you are pragmatic, methodical, and detail-oriented."
    },
    strengths: {
      he: ["שמירה על סדר, איכות ופרטים", "פרגמטיות וגישה מתודית", "מזעור סיכונים ובדיקת עובדות", "נאמנות ויציבות בקבלת החלטות"],
      en: ["Maintaining order, quality & details", "Pragmatism & methodical approach", "Risk minimization & fact-checking", "Loyalty and stability in decisions"]
    },
    tips: {
      he: ["קחו זמן לעבד מידע לפני קבלת החלטות", "ספקו מבנה וסדר לצוות שלכם", "נסו להיות פתוחים לגמישות של ה'מקדם'"],
      en: ["Take time to process info before deciding", "Provide structure to your team", "Try to be open to the 'Pioneer's' flexibility"]
    },
    communication_challenge: {
      he: "כמנתחים, הצורך שלכם בוודאות עלול ליצור חיכוך. אתם נוטים ל'הסברת יתר' (Over-explaining) במיילים ארוכים מאוד, מה שגורם לאחרים לאבד את השורה התחתונה.",
      en: "As a Guardian, your need for certainty can create friction. You might fall into 'over-explaining' in extremely long emails, causing others to lose sight of the bottom line."
    },
    adhd_challenge: {
      he: "עם הפרעת קשב, הקושי לארגן את המחשבות בזמן אמת עלול להוביל ל'שיתוק אנליטי'. אתם עלולים להיתקע על פרט קטן בדוח במשך שעות (פרפקציוניזם) ולפספס דדליין חשוב.",
      en: "With ADHD, organizing thoughts in real-time can lead to 'Analysis Paralysis.' You might get stuck on a minor detail for hours due to perfectionism, risking major deadlines."
    },
    consultation_benefit: {
      he: "נלמד איך לייצר 'מינימום הכרחי' של סדר, איך לתקשר בצורה תמציתית ואיך לשחרר פרפקציוניזם מעכב.",
      en: "We'll learn how to establish a 'Minimum Viable Order,' communicate concisely, and release the perfectionism that holds you back."
    }
  }
};

export const traitsList: Trait[] = [
  { id: 0, left: { he: "אקראי", en: "Random" }, right: { he: "שיטתי", en: "Systematic" }, axis: AxisType.FORMAL, reverse: false },
  { id: 1, left: { he: "זורם", en: "Flowing" }, right: { he: "מחושב", en: "Calculated" }, axis: AxisType.FORMAL, reverse: false },
  { id: 2, left: { he: "מבולל", en: "Confused" }, right: { he: "מפוקס", en: "Focused" }, axis: AxisType.FORMAL, reverse: false },
  { id: 3, left: { he: "מבולגן", en: "Messy" }, right: { he: "מאורגן", en: "Organized" }, axis: AxisType.FORMAL, reverse: false },
  { id: 4, left: { he: "מבטא", en: "Expressive" }, right: { he: "חוסם", en: "Reserved" }, axis: AxisType.DOMINANT, reverse: true }, 
  { id: 5, left: { he: "מתמקד ביחסי אנוש", en: "People-oriented" }, right: { he: "מתמקד במשימה", en: "Task-oriented" }, axis: AxisType.FORMAL, reverse: false },
  { id: 6, left: { he: "שרירותי", en: "Arbitrary" }, right: { he: "בוחן", en: "Examining" }, axis: AxisType.FORMAL, reverse: false },
  { id: 7, left: { he: "קרוב", en: "Close" }, right: { he: "מרוחק", en: "Distant" }, axis: AxisType.FORMAL, reverse: false },
  { id: 8, left: { he: "מלא חיים", en: "Lively" }, right: { he: "מאופק", en: "Restrained" }, axis: AxisType.DOMINANT, reverse: true },
  { id: 9, left: { he: "נינוח/משוחרר", en: "Relaxed" }, right: { he: "נוקשה/רשמי", en: "Formal" }, axis: AxisType.FORMAL, reverse: false },
  { id: 10, left: { he: "פאסיבי", en: "Passive" }, right: { he: "דומיננטי", en: "Dominant" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 11, left: { he: "מהיר", en: "Fast" }, right: { he: "איטי/שקול", en: "Slow/Deliberate" }, axis: AxisType.DOMINANT, reverse: true },
  { id: 12, left: { he: "ספונטני", en: "Spontaneous" }, right: { he: "מתוכנן", en: "Planned" }, axis: AxisType.FORMAL, reverse: false },
  { id: 13, left: { he: "גמיש", en: "Flexible" }, right: { he: "קבוע", en: "Fixed" }, axis: AxisType.FORMAL, reverse: false },
  { id: 14, left: { he: "אינטואיטיבי", en: "Intuitive" }, right: { he: "לוגי", en: "Logical" }, axis: AxisType.FORMAL, reverse: false },
  { id: 15, left: { he: "רגוע", en: "Calm" }, right: { he: "נמרץ", en: "Vigorous" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 16, left: { he: "מתבונן", en: "Observing" }, right: { he: "משתתף", en: "Participating" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 17, left: { he: "פרטי", en: "Private" }, right: { he: "חברותי", en: "Social" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 18, left: { he: "עדין", en: "Gentle" }, right: { he: "ישיר", en: "Direct" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 19, left: { he: "מקשיב", en: "Listening" }, right: { he: "מדבר", en: "Speaking" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 20, left: { he: "מסורתי", en: "Traditional" }, right: { he: "חדשני", en: "Innovative" }, axis: AxisType.FORMAL, reverse: true },
  { id: 21, left: { he: "זהיר", en: "Cautious" }, right: { he: "נועז", en: "Daring" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 22, left: { he: "סבלני", en: "Patient" }, right: { he: "חסר סבלנות", en: "Impatient" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 23, left: { he: "רגיש", en: "Sensitive" }, right: { he: "מעשי", en: "Practical" }, axis: AxisType.FORMAL, reverse: false },
  { id: 24, left: { he: "מתחשב", en: "Considerate" }, right: { he: "החלטי", en: "Decisive" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 25, left: { he: "משתף פעולה", en: "Cooperative" }, right: { he: "תחרותי", en: "Competitive" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 26, left: { he: "צנוע", en: "Humble" }, right: { he: "בטוח בעצמו", en: "Self-confident" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 27, left: { he: "פתוח", en: "Open" }, right: { he: "ממוקד", en: "Focused" }, axis: AxisType.FORMAL, reverse: false },
  { id: 28, left: { he: "סלחן", en: "Forgiving" }, right: { he: "תובעני", en: "Demanding" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 29, left: { he: "מתון", en: "Moderate" }, right: { he: "קיצוני", en: "Extreme" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 30, left: { he: "נאמן", en: "Loyal" }, right: { he: "עצמאי", en: "Independent" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 31, left: { he: "מנומס", en: "Polite" }, right: { he: "בוטה", en: "Blunt" }, axis: AxisType.DOMINANT, reverse: false },
  { id: 32, left: { he: "סקרן", en: "Curious" }, right: { he: "יודע", en: "Knowing" }, axis: AxisType.FORMAL, reverse: true },
  { id: 33, left: { he: "חולם", en: "Dreamer" }, right: { he: "ביצועיסט", en: "Doer" }, axis: AxisType.FORMAL, reverse: false },
  { id: 34, left: { he: "מתלבט", en: "Hesitant" }, right: { he: "נחוש", en: "Determined" }, axis: AxisType.DOMINANT, reverse: false }
];

export const getIconComponent = (name: string, size: number = 24, className: string = "") => {
  const icons: Record<string, any> = {
    Rocket, Users, Zap, Shield, Brain, Sparkles, Award, User, Mail, Star, Globe, FlaskConical, Target, Hash, Info, Linkedin, Facebook, Youtube,
    AlertCircle, TrendingDown, Layers, Gift
  };
  const Icon = icons[name] || Star;
  return <Icon size={size} className={className} />;
};