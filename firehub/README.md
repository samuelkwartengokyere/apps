# FireHub

Personal portfolio website for **Samuel** — a full-stack developer showcase built with vanilla HTML, CSS, and JavaScript.

Design inspired by the [Portfolio Design (Community) Figma template](https://www.figma.com/design/MDBUqTiJeUR1ah0g9naNQS/Portfolio-Design--Community-?node-id=16-6&m=dev).

---

## 1. Project Overview

| | |
|---|---|
| **Name** | FireHub |
| **Type** | Personal portfolio website |
| **Pitch** | A modern, dark-themed portfolio that showcases full-stack projects, skills, and experience — built to impress recruiters and potential clients at a glance. |
| **Portfolio goal** | Demonstrate UI craft, responsive design, accessibility awareness, and clean vanilla front-end skills alongside real project work (Pastry Shop, MC Foods & Cocktails). |

---

## 2. Scope

### Must-have (MVP) ✅

- Hero section with intro, role animation, and CTAs
- About Me with bio and availability badge
- Skills & Tools grouped by category
- Featured Projects grid with tech tags and links
- Experience timeline
- Contact form with validation (mailto fallback)
- Fixed sidebar navigation with active scroll state
- Fully responsive (desktop sidebar → mobile drawer)
- Scroll reveal animations
- Accessible markup (skip link, ARIA labels, focus states)

### Nice-to-haves (v2)

- Light/dark theme toggle
- Backend contact form (Formspree, Netlify Forms, etc.)
- Individual project case-study pages
- Blog section
- Downloadable resume PDF
- CMS or JSON-driven content

### Data

- **Demo content** — placeholder copy, stats, and links you can swap for your own
- **No backend** — static site, contact opens email client via `mailto:`

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| **Markup** | HTML5 (semantic, accessible) |
| **Styles** | CSS3 (custom properties, Grid, Flexbox, animations) |
| **Scripts** | Vanilla JavaScript (ES5-compatible IIFE) |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) + [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via Google Fonts |
| **Database** | None |
| **Auth / Payments** | None |
| **Hosting target** | GitHub Pages, Netlify, Vercel (static), or any web server |

---

## 4. Design & Branding

| | |
|---|---|
| **Visual direction** | Dark, modern, fire-accented — inspired by Figma community portfolio templates |
| **Primary accent** | Orange fire gradient (`#FF6B2B` → `#FF3D00`) |
| **Background** | Deep charcoal (`#0A0A0B`) |
| **Typography** | Space Grotesk (headings) + Inter (body) |
| **Layout** | Left sidebar nav (desktop), single-page scroll sections |
| **Reference** | [Figma — Portfolio Design (Community)](https://www.figma.com/design/MDBUqTiJeUR1ah0g9naNQS/Portfolio-Design--Community-?node-id=16-6&m=dev) |

### Customize branding

Edit CSS variables at the top of `css/style.css`:

```css
:root {
  --color-fire: #ff6b2b;
  --color-bg: #0a0a0b;
  /* ... */
}
```

Replace placeholder profile initials (`S`) in `index.html` with your photo in `assets/images/ =`.

---

## 5. Content & Personal Info

Update these placeholders in `index.html`:

| Placeholder | What to change |
|---|---|
| `Samuel` | Your name |
| `samfine278@gmail.com` | Your email |
| GitHub / LinkedIn URLs | Your social links |
| Project demo & source links | Real URLs for Pastry Shop, MC Foods, etc. |
| Experience timeline | Your work history |
| Hero stats | Your numbers |
| About bio | Your story |

Profile photos: add images to `assets/images/` and update the `.profile-placeholder` and `.about-photo` elements.

---

## 6. Project Setup

### Folder structure

```
firehub/
├── index.html          # Single-page site
├── admin.html          # Admin dashboard (content, projects, messages)
├── css/
│   ├── style.css       # All styles + design tokens
│   └── admin.css       # Admin layout & components
├── js/
│   ├── main.js         # Nav, scroll, animations, form
│   ├── admin.js        # Admin auth, CRUD, inbox
│   ├── analytics.js    # Portfolio visit tracking (day / month / year)
│   └── content.js      # Applies saved content on the portfolio
├── assets/
│   ├── favicon.svg
│   └── images/         # Your photos & project screenshots
├── README.md
└── .gitignore
```

### Run locally

**Option A — Python**

```bash
cd firehub
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080)

**Admin:** [http://localhost:8080/admin.html](http://localhost:8080/admin.html) — default email and password `samfine278@gmail.com` (must match; change in Settings).

**Visitor stats:** Opening `index.html` records a visit (once per browser session per day). The admin Dashboard shows **Today**, **This Month**, **This Year**, and **All Time** counts. When online, totals sync globally via CountAPI; otherwise counts are stored locally for preview.

**Live sync:** With the portfolio (`index.html`) open in one tab and admin in another, site content and projects update automatically—no refresh needed. Site content also auto-saves as you type.

**Option B — Node (npx)**

```bash
cd firehub
npx serve .
```

**Option C — VS Code / Cursor**

Use the **Live Server** extension and open `index.html`.

### Deploy

**GitHub Pages**

1. Push `firehub/` to a GitHub repo
2. Settings → Pages → Source: `main` branch, root `/`
3. Site live at `https://<username>.github.io/<repo>/`

**Netlify**

1. Drag the `firehub` folder to [app.netlify.com/drop](https://app.netlify.com/drop), or connect the repo
2. No build command needed — publish directory is `.`

**Any static host**

Upload all files; ensure `index.html` is the entry point.

---

## License

Personal portfolio — customize freely for your own use.
