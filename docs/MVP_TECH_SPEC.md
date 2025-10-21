# MVP_TECH_SPEC.md
**Project:** Fold & Ride — Digital Nomad Tools Hub (MVP)  
**Version:** 1.0  
**Date:** 2025-10-20  

---

## ⚙️ Stack Overview

| Layer | Technology | Purpose |
|--------|-------------|----------|
| Static Site Generator | Jekyll 4.3+ | Build pages and blog |
| CSS Framework | Tailwind CSS | Styling |
| JS | Vanilla JS / Alpine.js | Client-side tool logic |
| Hosting | GitHub Pages | Free static hosting |
| Serverless | Google Cloud Functions | Dynamic calculations |
| Analytics | Plausible | Lightweight privacy-first tracking |

---

## 🗂️ Folder Structure

```
/
├── _layouts/
│   ├── default.html
│   ├── tool.html
│   └── guide.html
├── _includes/
│   ├── header.html
│   ├── footer.html
│   ├── newsletter.html
│   └── seo.html
├── tools/
│   ├── travel-budget-calculator.html
│   ├── cost-of-living-comparator.html
│   ├── nomad-visa-finder.html
│   ├── remote-work-destination-index.html
│   └── travel-carbon-offset-calculator.html
├── _posts/
│   └── *.md
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── functions/
    ├── calcBudget.js
    ├── compareCities.js
    ├── findVisa.js
    ├── destinationIndex.js
    └── carbonOffset.js
```

---

## 🔗 Google Cloud Functions

Each tool calls a Cloud Function via `fetch()` and displays JSON.

**Example:**
```js
fetch("https://region-project.cloudfunctions.net/calcBudget?destination=lisbon&days=30")
  .then(r => r.json())
  .then(data => document.getElementById('result').innerText = data.total_cost);
```

---

## 🚀 Deployment Steps

1. **Build site**
   ```bash
   bundle exec jekyll build
   ```
2. **Push to GitHub**
   - Pages auto-deploys `_site/` output  
3. **Deploy functions**
   ```bash
   gcloud functions deploy calcBudget --runtime nodejs18 --trigger-http --allow-unauthenticated
   ```

---

**End of MVP_TECH_SPEC.md**
