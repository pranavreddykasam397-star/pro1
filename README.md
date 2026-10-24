# 🍽️ Heritage Indian Restaurant & Culinary Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?style=for-the-badge&logo=greensock)](https://greensock.com/gsap/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render_Cloud-4169E1?style=for-the-badge&logo=postgresql)](https://render.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge)](https://orm.drizzle.team/)
[![tRPC](https://img.shields.io/badge/tRPC-v11-2596BE?style=for-the-badge&logo=trpc)](https://trpc.io/)

A modern, high-performance web application and digital dining platform for an authentic Indian restaurant. Designed with cinematic 3D GSAP animations, end-to-end type safety, real-time order tracking, comprehensive admin operations, and cloud database persistence.

---

## ✨ Features

### 🌟 Immersive Customer Storefront
- **Cinematic 3D Hero Landing**: Holographic 3D mouse-tracking tilt cards with dynamic glass reflections, responsive smooth scrolling, and warm ambient lighting.
- **Progressive Dietary Preference Unfold**: Smooth GSAP 3D emergence of **Pure Vegetarian** and **Non-Vegetarian** dining sections.
- **3D Cascading Menu Catalog**: Automatic default to signature **Curries**, with fluid 3D card flips and cascade entrances when toggling categories (Biryani, Tandoori, Curries, Appetizers, Breads, Desserts, Beverages).
- **Gamified Discount Mini-Game**: Interactive Fortune Wheel mini-game offering dynamic discounts (5% to 25% off) directly applied to checkout.
- **Smart Cart & Checkout**: Slide-out drawer with dynamic quantity adjusters, tax calculation, delivery/takeout modes, and coupon application.
- **Customer Authentication**: Frictionless mobile OTP authentication with customer profile and order history.
- **Live Order Tracker**: Multi-step visual tracking modal (Pending ➔ In Kitchen ➔ Out for Delivery ➔ Delivered).

### 🛠️ Executive Admin Dashboard (`/admin`)
- **Menu Catalog Management**: Full CRUD operations for dishes, real-time price updates, category assignments, and Chef's Special toggles.
- **Instant Photo Search**: Automated web image search to effortlessly attach dish photos.
- **Live Order Control Station**: Real-time incoming orders feed with status pipeline transitions, customer contact details, and fulfillment tracking.
- **Customer CRM**: Phone number lookup for customer loyalty records, lifetime order values, and visit counts.
- **Analytics & Restaurant Settings**: Revenue metrics, tax percentage, delivery fee settings, and operational toggles.

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack, App Router) | Fast SSR, ISR, and dynamic edge rendering |
| **Language** | TypeScript 5 | Strict static typing throughout client and server |
| **Styling** | Tailwind CSS v4 & Lucide Icons | Custom palette (Gold, Emerald, Deep Maroon, Parchment) |
| **Animations** | GSAP 3.15 + Custom 3D CSS | 3D tilt perspective, keyframe shimmers, spring physics |
| **API Layer** | tRPC v11 & TanStack React Query 5 | End-to-end type-safe RPC endpoints without schemas duplication |
| **Database** | Render Cloud PostgreSQL | Managed cloud database with resilient connection pooling |
| **ORM** | Drizzle ORM & Drizzle Kit | Type-safe migrations, schemas, and query execution |
| **UI Components** | Radix UI / Shadcn UI Primitives | Accessible modals, sheets, dialogs, badges, and tabs |

---

## 📁 Repository Directory Structure

```text
├── restaurant-next/                # Main Next.js Full-Stack Application
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── admin/page.tsx      # Admin management console
│   │   │   ├── api/                # API routes (auth, tRPC handlers)
│   │   │   ├── globals.css         # Design tokens, 3D CSS perspectives, keyframes
│   │   │   ├── layout.tsx          # Root layout & providers
│   │   │   └── page.tsx            # Progressive 3D storefront customer flow
│   │   ├── components/             # Reusable UI components
│   │   │   ├── admin/              # Admin tabs (Menu, Orders, CRM, Settings)
│   │   │   ├── CartSidebar.tsx     # Slide-out cart drawer
│   │   │   ├── CategoryFilter.tsx  # Dietary tabs & category navigation
│   │   │   ├── DiscountMiniGame.tsx# Wheel mini-game
│   │   │   ├── Hero.tsx            # 3D interactive hero section
│   │   │   ├── MenuCard.tsx        # 3D animated dish card
│   │   │   ├── Navbar.tsx          # Sticky navigation header
│   │   │   └── OrderTrackerModal.tsx# Live order status modal
│   │   ├── lib/
│   │   │   ├── db/                 # Drizzle schemas, connection pool, seed data
│   │   │   ├── trpc/               # tRPC client & React Query provider
│   │   │   └── validators/         # Zod schemas for input validation
│   │   └── server/
│   │       ├── routers/            # tRPC routers (menu, order, customer, settings)
│   │       └── trpc.ts             # tRPC procedure initialization
│   ├── drizzle/                    # Generated SQL migration files
│   ├── public/                     # Static assets & icons
│   ├── package.json                # Dependencies & scripts
│   └── next.config.ts              # Next.js configuration
├── backend/                        # Legacy Express & MongoDB API service
├── .gsd/                           # Specification, roadmap, and architecture docs
└── README.md                       # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18.0 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A PostgreSQL database instance (or use the configured Render Cloud PostgreSQL)

### 1. Clone the Repository
```bash
git clone https://github.com/pranavreddykasam397-star/pro1.git
cd pro1/restaurant-next
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file inside the `restaurant-next/` directory:

```env
# PostgreSQL Database Connection URL (e.g. Render Cloud PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"

# Next Auth / Better Auth Secret
BETTER_AUTH_SECRET="your-secure-random-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Fast2SMS or Twilio API keys for real SMS notifications
SMS_API_KEY=""
```

### 4. Setup the Database
Push the schema to your PostgreSQL database and seed the 124-dish menu catalog:

```bash
# Push database schemas
npm run db:push

# Seed authentic dishes, prices, categories, and default settings
npm run db:seed
```

### 5. Launch the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

- **Customer Storefront**: `http://localhost:3000`
- **Admin Control Center**: `http://localhost:3000/admin`

---

## 📜 Available Scripts

Inside `restaurant-next/`:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the optimized production application with typechecking |
| `npm run start` | Starts the production Next.js server |
| `npm run lint` | Runs ESLint analysis across the project |
| `npm run db:push` | Pushes Drizzle ORM schema directly to PostgreSQL |
| `npm run db:generate` | Generates SQL migration snapshots |
| `npm run db:seed` | Seeds database with 124 authentic dishes and initial settings |

---

## 🚢 Deployment

### Deploying to Vercel
1. Link your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `restaurant-next`.
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`: Your Render PostgreSQL connection string (`...sslmode=require`).
   - `BETTER_AUTH_SECRET`: A secure 32+ character random string.
   - `BETTER_AUTH_URL`: Your production Vercel deployment URL.
4. Deploy! Next.js will build and serve your application globally with edge caching.

---

## 📄 License
This project is private and proprietary. All rights reserved.
