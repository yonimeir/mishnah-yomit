# לימוד יומי - Daily Torah Study Tracker

אפליקציית PWA לניהול לימוד יומי במשנה, גמרא ורמב"ם.

## מה האפליקציה עושה

- **תוכניות לימוד מותאמות** - יצירת תוכנית לימוד אישית: לפי ספר (עם תאריך יעד) או לפי קצב (כמה ליום)
- **משנה** - כל 63 מסכתות ששה סדרי משנה, לימוד לפי משניות או פרקים
- **גמרא** (בפיתוח) - תלמוד בבלי, 37 מסכתות, לימוד לפי דפים או עמודים
- **רמב"ם** (בפיתוח) - משנה תורה, 83 חלקים, 1,000 פרקים
- **לימוד חופשי** - גלישה חופשית בכל התכנים, עם אפשרות לסמן "כבר למדתי"
- **תדירות גמישה** - ימים בשבוע, ימים ספציפיים, או ימים בחודש
- **מעקב התקדמות** - אחוזי השלמה, דילוגים, והשלמות
- **טקסט מ-Sefaria API** - טעינת טקסט מקורי עם פירושים (ברטנורא, תוי"ט, רמב"ם למשנה; רש"י ותוספות לגמרא)
- **PWA** - ניתן להתקנה, עובד אופליין

## ערמת טכנולוגיה (Tech Stack)

- **React 18** + **TypeScript** - פריימוורק UI
- **Vite** - כלי בנייה
- **Tailwind CSS** - עיצוב
- **Zustand** - ניהול מצב (state management) עם persist ל-localStorage
- **React Router DOM** - ניווט SPA
- **@hebcal/core** - לוח עברי
- **Sefaria API** - טקסטים יהודיים

## מבנה הפרויקט

```
mishnah-yomit/
├── public/
│   ├── favicon.svg          # אייקון הדפדפן
│   ├── icon-192.png         # אייקון PWA
│   ├── icon-512.png         # אייקון PWA
│   ├── manifest.json        # הגדרות PWA
│   └── sw.js                # Service Worker לעבודה אופליין
├── src/
│   ├── data/
│   │   ├── mishnah-structure.ts   # מבנה המשנה + טיפוסים משותפים + פונקציות עזר
│   │   ├── gemara-structure.ts    # מבנה הגמרא (37 מסכתות בבלי)
│   │   └── rambam-structure.ts    # מבנה הרמב"ם (14 ספרים, 83 חלקים)
│   ├── services/
│   │   ├── scheduler.ts      # לוגיקת תזמון, חישוב כמויות, גימטריה
│   │   └── sefaria.ts        # API של ספריא - טקסטים ופירושים
│   ├── store/
│   │   └── usePlanStore.ts   # Zustand store - תוכניות, התקדמות, פרקים שנלמדו
│   ├── pages/
│   │   ├── HomePage.tsx       # דף ראשי - רשימת תוכניות
│   │   ├── NewPlanPage.tsx    # אשף יצירת תוכנית (בחירת סוג תוכן, היקף, הגדרות)
│   │   ├── PlanDetailPage.tsx # פרטי תוכנית - סטטיסטיקות וטבלת התקדמות
│   │   ├── LearningPage.tsx   # עמוד הלימוד עצמו - טקסט ופירושים
│   │   └── FreeLearningPage.tsx # לימוד חופשי - גלישה וסימון
│   ├── components/
│   │   ├── Layout.tsx         # שלד האפליקציה - header + nav
│   │   ├── PlanCard.tsx       # כרטיס תוכנית בדף הראשי
│   │   ├── ProgressTable.tsx  # טבלת התקדמות למסכת
│   │   ├── MishnahText.tsx    # תצוגת טקסט (משנה/גמרא/רמב"ם) + פירושים
│   │   ├── PlanSettingsModal.tsx    # עריכת הגדרות תוכנית
│   │   ├── AlreadyLearnedModal.tsx  # סימון "כבר למדתי"
│   │   ├── NextMasechetModal.tsx    # בחירת מסכת הבאה
│   │   ├── CompletionCelebration.tsx # חגיגת סיום
│   │   └── HebrewDatePicker.tsx     # בורר תאריך עברי
│   ├── App.tsx               # ניתוב ראשי
│   └── main.tsx              # נקודת כניסה + רישום SW
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.js
└── postcss.config.js
```

## מבנה נתונים

### סוגי תוכן (ContentType)

האפליקציה תומכת בשלושה סוגי תוכן:

| סוג | ID prefix | מבנה | יחידות |
|-----|-----------|------|--------|
| משנה | (ללא) | סדר → מסכת → פרקים → משניות | `mishnah` / `perek` |
| גמרא | `g_` | סדר → מסכת → דפים → עמודים | `mishnah`=עמוד / `perek`=דף |
| רמב"ם | `r_` | ספר → הלכות → פרקים | `perek` בלבד |

### ממשק Masechet

כל "יחידת לימוד" (מסכת, מסכת גמרא, או חלק ברמב"ם) משתמשת באותו ממשק:

```typescript
interface Masechet {
  id: string;           // מזהה ייחודי (עם prefix לגמרא/רמב"ם)
  name: string;         // שם בעברית
  sefariaName: string;  // שם ל-API של ספריא
  chapters: number[];   // מספר יחידות בכל פרק/דף
  startDaf?: number;    // (גמרא בלבד) דף התחלה, ברירת מחדל 2
}
```

### LearningPlan

```typescript
interface LearningPlan {
  id: string;
  contentType: ContentType;      // 'mishnah' | 'gemara' | 'rambam'
  masechetIds: string[];         // רשימת מזהי מסכתות
  unit: LearningUnit;            // 'mishnah' | 'perek'
  mode: 'by_book' | 'by_pace';
  currentPosition: number;       // מיקום גלובלי
  skippedChapters: SkippedChapter[];     // חורים שלא נלמדו
  preLearnedChapters: SkippedChapter[];  // פרקים שנלמדו מראש
  // ... עוד שדות
}
```

## התקנה ופיתוח

### דרישות מקדימות

- Node.js 18+
- npm או yarn
- Git

### התקנה

```bash
git clone https://github.com/yonimeir/mishnah-yomit.git
cd mishnah-yomit
npm install
```

### פיתוח מקומי

```bash
npm run dev
```

האפליקציה תרוץ ב-`http://localhost:5173`

### בנייה

```bash
npm run build
```

### בדיקת TypeScript

```bash
npx tsc --noEmit
```

## ענפי Git

- **`main`** - גרסה יציבה, מופעלת ב-Vercel
- **`feature/gemara-rambam`** - פיתוח תמיכה בגמרא ורמב"ם (עדיין לא מוזג)

### עבודה עם branches

```bash
# מעבר לענף הפיתוח
git checkout feature/gemara-rambam

# חזרה ל-main
git checkout main

# עדכון מ-remote
git pull origin main
git pull origin feature/gemara-rambam
```

## Deployment

האפליקציה מופעלת ב-**Vercel** עם continuous deployment מ-branch `main`.

- כל push ל-`main` מפעיל deploy אוטומטי
- branches אחרים לא משפיעים על האפליקציה החיה
- ה-URL של האפליקציה: (בדוק ב-Vercel dashboard)

## Sefaria API

האפליקציה משתמשת ב-Sefaria API v3 לטעינת טקסטים:

```
GET https://www.sefaria.org/api/v3/texts/{ref}?version=hebrew|all
```

### פורמט references

| סוג | דוגמה | URL |
|-----|--------|-----|
| משנה | `Mishnah Berakhot 1:1` | `Mishnah_Berakhot.1.1` |
| גמרא | `Berakhot 2a` | `Berakhot.2a` |
| רמב"ם | `Mishneh Torah, Foundations of the Torah 1:1` | `Mishneh_Torah,_Foundations_of_the_Torah.1.1` |

### פירושים

- **משנה**: ברטנורא, תוספות יום טוב, רמב"ם
- **גמרא**: רש"י, תוספות
- **רמב"ם**: כסף משנה

## הערות לפיתוח

### הוספת סוג תוכן חדש

1. צור קובץ data חדש ב-`src/data/` (ראה `gemara-structure.ts` כדוגמה)
2. ייבא אותו ב-`mishnah-structure.ts` (בתוך `getAllStructures()`)
3. הוסף את ה-prefix ב-`getContentType()`
4. הוסף labels ב-`getContentTypeLabels()`
5. הוסף commentators ב-`sefaria.ts`
6. עדכן UI ב-`NewPlanPage.tsx` ו-`FreeLearningPage.tsx`

### State persistence

ה-state נשמר ב-localStorage תחת המפתח `mishnah-yomit-plans`. פונקציית ה-`merge` ב-store מטפלת ב-backward compatibility (למשל, תוכניות ישנות ללא `contentType` מקבלות אוטומטית `'mishnah'`).

### PWA

- **Service Worker** (`public/sw.js`) - מטמן את שלד האפליקציה ותגובות API
- **Manifest** (`public/manifest.json`) - מגדיר שם, אייקונים, וצבעים
- ניתן להתקנה על מסך הבית במכשירים ניידים

## רישיון

פרויקט אישי - כל הזכויות שמורות.
