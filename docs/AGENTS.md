# AGENTS.md  
**Project:** Fold & Ride — Digital Nomad Travel Tools Hub  
**Version:** 1.0  
**Date:** 2025-10-20  

---

## 🏷️ Overview

**Mission:**  
Fold & Ride provides free, smart online tools for digital nomads and long-term travellers to plan smarter, travel lighter, and move sustainably.

**Tagline:**  
> “Fold your plans. Ride the world.”

**Core Audience:**  
- Digital nomads, freelancers, and remote workers (ages 25–40).  
- Long-term travellers and slow travellers.  
- Environmentally conscious and tech-savvy users.

**Core Value Themes:**  
- Freedom and flexibility  
- Data-driven planning  
- Minimalism and sustainability  
- Reliable, transparent information  

---

## 🎨 Brand Guidelines

**Tone & Voice:**  
- Friendly, practical, trustworthy.  
- Use clear, concise sentences and travel-positive language.  
- Focus on empowerment and sustainability.  
- Avoid corporate jargon; use active verbs (“Plan,” “Compare,” “Discover”).  

**Color Palette (hex):**  
- Primary: `#0D9488` (Teal Green – accent)  
- Secondary: `#1E293B` (Slate – text)  
- Background: `#F8FAFC` (Off-white)  
- Accent: `#EAB308` (Warm Yellow highlights)  
- Neutral: `#94A3B8` (Muted Gray for dividers/icons)

**Typography:**  
- **Headings:** Poppins (600–700 weight)  
- **Body:** Inter (400–500 weight)  
- **Line height:** 1.5–1.7  
- **Max width:** 70ch  

**Imagery & Icons:**  
- Simple vector icons (Lucide / Heroicons)  
- Minimal line illustrations (maps, suitcases, planes, laptops)  
- Avoid cluttered photos or stock models.  

**Logo Usage:**  
- Text-based logo: “Fold & Ride” in Poppins Bold.  
- Teal (#0D9488) primary, white variant for dark backgrounds.

---

## ⚙️ Tech Stack

| Layer | Technology | Notes |
|--------|-------------|-------|
| **Static Site Generator** | Jekyll | Markdown + Liquid templates |
| **CSS Framework** | Tailwind CSS | Utility-first styling |
| **JS Library** | Vanilla JS / Alpine.js | Client-side interactivity |
| **Hosting** | GitHub Pages | Free static hosting |
| **Serverless** | Google Cloud Functions | Dynamic calculations |
| **Data Sources** | exchangerate.host, Numbeo, Atmosfair | API providers |
| **Newsletter** | ConvertKit / Beehiiv | Embedded signup form |
| **Analytics** | Plausible | Lightweight privacy-first analytics |

---

## 🧭 Site Structure

```
/
├── index.html
├── /tools/
│   ├── travel-budget-calculator.html
│   ├── cost-of-living-comparator.html
│   ├── nomad-visa-finder.html
│   ├── remote-work-destination-index.html
│   └── travel-carbon-offset-calculator.html
├── /guides/
│   ├── how-to-plan-your-first-digital-nomad-trip.md
│   ├── eco-travel-offsetting.md
│   └── best-cities-for-remote-workers.md
├── /about/
├── /contact/
└── /join/
```

---

## 🧑‍💻 Agent Roles

| Agent | Responsibility |
|--------|----------------|
| **Frontend Agent** | Build Jekyll templates, layouts, and forms; integrate Tailwind styling and JS interactivity. |
| **Backend Agent** | Develop Google Cloud Functions for budget, visa, cost, and CO₂ calculations. |
| **Content Agent** | Write SEO-optimized Markdown guides and tool descriptions. |
| **Design Agent** | Implement color palette, typography, icons, and consistent UI. |
| **SEO Agent** | Configure metadata, structured data, and sitemap. |
| **Monetization Agent** | Implement newsletter, affiliate links, and future Pro tier. |
| **Testing Agent** | Validate site rendering, Lighthouse scores, and tool accuracy. |

---

## ✅ Deliverables

- [ ] Responsive homepage and `/tools/` hub  
- [ ] Five working tools (Budget, Cost, Visa, Destination, Carbon)  
- [ ] Five blog guides with SEO optimization  
- [ ] Newsletter integration  
- [ ] Google Cloud Functions deployed and connected  
- [ ] Lighthouse score ≥ 90  

---

## 📦 Success Criteria

| Metric | Target |
|--------|---------|
| Page Load Speed | < 1.5s |
| Lighthouse SEO Score | ≥ 90 |
| Monthly Cost | ≤ $1 |
| Newsletter Sign-ups | 100 in 3 months |
| Tools Functionality | All JSON responses under 1s |

---

**End of AGENTS.md**
