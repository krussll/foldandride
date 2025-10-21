# COMPONENTS.md
**Project:** Fold & Ride — Digital Nomad Travel Tools Hub  
**Version:** 1.0  
**Date:** 2025-10-20  

---

## 🧩 Overview

Defines reusable UI and structural components for the Fold & Ride MVP (Jekyll + Tailwind + JS).  
Each component is static or client-side interactive, written in HTML, Liquid, and lightweight JS.

---

## 🧱 Layout Components

### Header
- Located in `_includes/header.html`
- Contains logo, navigation, and mobile menu
- Links: Tools, Guides, Join, About
- Sticky top navigation, white background, subtle shadow

### Footer
- Located in `_includes/footer.html`
- Includes quick links, brand tagline, social icons, and newsletter partial
- Dark slate background (`#1E293B`), white text

### Newsletter Partial
- `_includes/newsletter.html`
- ConvertKit or Beehiiv embedded signup form
- Reused across pages

### Page Layouts
| Layout | File | Purpose |
|---------|------|----------|
| Default | `_layouts/default.html` | Wrapper for standard pages |
| Tool | `_layouts/tool.html` | Used for tool pages |
| Guide | `_layouts/guide.html` | Used for blog posts |

---

## 🎛️ UI Components

### Tool Card
Used on `/tools/` page and homepage.

**Structure:**
```html
<div class="border rounded-xl p-5 hover:shadow-lg">
  <img src="/assets/icons/tool.svg" alt="Tool icon" class="w-8 h-8 mb-2">
  <h3 class="font-semibold text-lg">Travel Budget Calculator</h3>
  <p class="text-slate-600 text-sm">Estimate your travel costs by destination.</p>
</div>
```

### Guide Card
Used on homepage and `/guides/`.

**Structure:**
```html
<div class="rounded-xl border p-5 hover:shadow-md">
  <img src="/assets/images/guide-thumb.jpg" alt="Guide image" class="rounded-lg mb-2">
  <h3 class="font-semibold">How to Plan Your First Digital Nomad Trip</h3>
  <p class="text-sm text-slate-600">A simple step-by-step guide.</p>
</div>
```

### Button
Reusable Tailwind button classes:
```html
<a href="#" class="bg-teal-600 text-white px-5 py-2 rounded-full hover:bg-teal-700">Explore Tools</a>
```

### FAQ Accordion (Optional)
Implemented using Alpine.js for interactivity.

---

## 🧮 Tool Components

Each tool page uses a static form + JS logic block.

### Example: Travel Budget Calculator

```html
<form id="budget-form" class="space-y-4">
  <input type="text" id="destination" placeholder="Enter destination" class="input">
  <input type="number" id="days" placeholder="Days" class="input">
  <button type="submit" class="btn-primary">Calculate</button>
</form>
<div id="budget-result"></div>
<script src="/assets/js/budget.js"></script>
```

`budget.js` calls a Google Cloud Function and displays JSON output.

---

## 🎨 Styling Conventions

- Tailwind utility classes for layout and spacing  
- `rounded-xl`, `shadow-md`, `hover:shadow-lg` for cards  
- Font: Inter for body, Poppins for headings  
- Colors: teal (`#0D9488`), slate (`#1E293B`), off-white (`#F8FAFC`)

---

**End of COMPONENTS.md**
