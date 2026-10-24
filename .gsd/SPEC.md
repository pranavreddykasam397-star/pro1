# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision
Heritage Restaurant Next is a full-stack digital dining and ordering platform built with Next.js 16, TypeScript, Drizzle ORM, tRPC v11, and Tailwind CSS v4. It modernizes the legacy Vite/Express/Mongo architecture into an end-to-end type-safe, high-performance customer storefront and comprehensive restaurant staff administration portal.

## Goals
1. **End-to-End Type Safety** — Zero-drift type safety across client and server using tRPC, Zod, and Drizzle ORM.
2. **Interactive Customer Experience** — Authentic Indian cuisine browsing, dietary filters, gamified discount mini-games, slide-out cart drawer, and UPI QR code checkout.
3. **Staff & Kitchen Administration** — Secure PIN/Owner authentication, real-time incoming order review and status approvals, full menu CRUD management, customer lookup, and end-of-day sales analytics.
4. **Resilient Local Database** — Structured PostgreSQL / PGlite database layer with pre-seeded authentic Indian menu items, customer accounts, and daily summary metrics.

## Non-Goals (Out of Scope)
- Multi-tenant SaaS platform (engineered specifically for the single Heritage Restaurant location).
- Native iOS/Android app wrappers (optimized as a responsive Progressive Web App).
- Third-party payment gateway callbacks (employing direct UPI QR code generation and merchant reference verification).

## Constraints
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **API & Validation**: tRPC v11 + Zod schemas for all client-server communication.
- **Database & ORM**: Drizzle ORM with PostgreSQL / PGlite.
- **UI & Styling**: Tailwind CSS v4 + Shadcn UI + Lucide React.

## Success Criteria
- [x] Modern Next.js 16 App Router application scaffolded in `restaurant-next/`
- [x] Relational database schema defined with Drizzle ORM for menu, customers, orders, owners, and summaries
- [x] Interactive customer storefront with menu browsing, dietary category filters, and discount mini-game
- [x] Staff administration portal with live order queue, menu editor, and financial analytics
- [ ] Environment variable configuration (`.env.local`) verified with active database connectivity
- [ ] Complete build check passing cleanly with end-to-end order placement and admin approval testing

## User Stories

### As a Customer
- I want to browse authentic dishes with dietary indicators (Veg/Non-Veg) and play discount mini-games
- So that I can place an order quickly and pay seamlessly using UPI QR code.

### As Restaurant Staff / Owner
- I want to review incoming orders, verify UPI payment references, and approve/reject them in real time
- So that the kitchen can prepare dishes promptly and the day's revenue is tracked accurately.

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Next.js 16 + React 19 + tRPC | Must-have | Core full-stack architecture |
| Drizzle ORM + PostgreSQL/PGlite | Must-have | Relational schema with seed data |
| Customer Menu & Cart Drawer | Must-have | Responsive shopping experience |
| UPI QR Checkout & Tracker | Must-have | Indian payment flow with PIN lookup |
| Admin Order Management & Menu CRUD | Must-have | Owner operations and real-time status updates |

---

*Last updated: 2026-10-24*
