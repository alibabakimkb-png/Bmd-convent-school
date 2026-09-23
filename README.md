# SchoolOS – School Management System

Advanced school ERP demo: web dashboard + installable Android PWA (APK-ready).

## Modules
- Students (add / search / delete)
- Teachers
- Attendance (students + teachers, date-wise Present/Absent)
- Salary (entries, paid/due, printable slip)
- Bills / Fees (create, paid/due, printable receipt)
- Library books (stock, issue, return)
- Reports + JSON backup

## Demo login
- Admin: `admin` / `admin123`
- Teacher: `teacher` / `teach123`

Data browser ke LocalStorage mein save hota hai.

## Web par chalane ke liye
Folder open karke `index.html` browser mein kholo.
Agar service worker block ho to local server use karo:

```bash
python3 -m http.server 8080
```

Phir browser: http://localhost:8080

## Android app (APK) kaise banaye
1. Site ko HTTPS par host karo (GitHub Pages / Netlify / any hosting).
2. Phone Chrome mein site kholo → menu → **Add to Home screen** / Install app.
3. Official APK chahiye to [PWABuilder](https://www.pwabuilder.com) par URL daalo aur Android package generate karo.

Yeh demo offline-capable PWA hai, backend/server database nahi hai.
Production school use ke liye next step: real login, cloud database, parent app, SMS/WhatsApp receipts.
