# משתלת המושבה גן יבנה · אתר

אתר סטטי (HTML/CSS/JS) למשתלת המושבה, רחוב העצמאות בגן יבנה, בפנייה לקיבוץ חצור.

כתובת חיה: https://oriantoledano-ship-it.github.io/moshava-nursery/

## מבנה
- `index.html` - העמוד הראשי (פתיחה, המשתלה, מה יש אצלנו, שאלון צמחים, גלריה, איך מגיעים, מדריכים, שאלות נפוצות)
- `blog/` - דף המדריכים ו-7 מאמרים
- `privacy.html`, `terms.html`, `accessibility.html` - עמודים משפטיים
- `sitemap.xml`, `robots.txt` - לגוגל
- `assets/site.css`, `assets/site.js` - עיצוב והתנהגות
- `assets/a11y.css`, `assets/a11y.js` - תפריט נגישות
- `assets/fonts/` - גופנים מקומיים (Fredoka, Assistant, Playpen Sans Hebrew)
- `assets/img/`, `assets/media/` - תמונות, לוגו, אייקונים וסרטון

## אחרי חיבור דומיין
1. לעדכן את הכתובת `https://oriantoledano-ship-it.github.io/moshava-nursery/` לדומיין החדש (canonical, og, sitemap, JSON-LD).
2. להגיש את `sitemap.xml` ב-Google Search Console.

## העלאה ידנית ל-GitHub (אם צריך)
1. יוצרים ריפו חדש (שם קצר באנגלית, אותיות קטנות).
2. נכנסים לתיקייה, מסמנים הכל (Ctrl+A) וגוררים את התוכן עצמו ולא את התיקייה.
3. מוודאים שקבצים מוסתרים מוצגים (View → Show → Hidden items) כדי ש-`.nojekyll` יעלה.
4. Settings → Pages → Branch: main, תיקייה: / (root).

## אם משהו לא עובד
- הכתובת חייבת להסתיים ב-`/`.
- הקבצים צריכים לשבת בשורש הריפו ולא בתוך תיקייה נוספת.
- לוודא ש-Pages מופעל.
