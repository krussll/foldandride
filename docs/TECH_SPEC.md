# TECH_SPEC.md
**Project:** Fold & Ride — Digital Nomad Travel Tools Hub  
**Version:** 1.0  
**Date:** 2025-10-20  

---

## 🧠 Purpose

This document outlines the full technical architecture for the Fold & Ride platform, expanding on the MVP to enable scalability, user accounts, and premium features in later phases.

---

## 🧱 Architectural Overview

| Layer | Current MVP | Future Upgrade |
|--------|--------------|----------------|
| Frontend | Jekyll static site | Next.js / Astro |
| Dynamic Tools | Cloud Functions | Dedicated API microservice (Cloud Run) |
| Database | None | Supabase (PostgreSQL) |
| Auth | None | Supabase Auth (email + OAuth) |
| Payments | None | Stripe / Lemon Squeezy |
| Hosting | GitHub Pages | Vercel or Cloudflare Pages |
| Analytics | Plausible | Supabase or PostHog |
| Newsletter | ConvertKit | Custom in-app email integration |

---

## 🧮 API Schema (Future)

| Endpoint | Method | Purpose |
|-----------|---------|----------|
| `/api/budget` | GET | Calculate estimated travel budget |
| `/api/cost` | GET | Compare city costs |
| `/api/visa` | GET | Return digital nomad visa data |
| `/api/destination` | GET | Rank destination metrics |
| `/api/offset` | GET | Return CO₂ offset info |

All endpoints to return structured JSON with caching headers and error handling.

---

## 🧩 Future Database Models (Supabase)

| Table | Columns |
|--------|----------|
| `users` | id, email, created_at |
| `saved_trips` | id, user_id, destination, cost, created_at |
| `newsletter` | id, email, created_at |
| `subscriptions` | id, user_id, tier, status, created_at |

---

## ⚙️ CI/CD Pipeline (Future)

| Stage | Tool | Function |
|--------|------|-----------|
| Version Control | GitHub | Source control |
| Build | GitHub Actions | Test and build Jekyll site |
| Deploy | Vercel / Cloudflare Pages | Continuous deployment |
| Test | Playwright | Automated UI testing |

---

## 🧠 Migration Path Summary

1. Add Supabase for user management  
2. Port tools into modular React components  
3. Introduce Pro dashboard  
4. Move Cloud Functions → Cloud Run APIs  
5. Enable paid subscription plans

---

**End of TECH_SPEC.md**
