# Niorc Digital - Business Management Platform

## Overview

Niorc Digital is a comprehensive business management solution designed for India-first local businesses such as chai stalls, salons, street vendors, and small shops. The platform provides billing, customer relationship management (CRM), inventory tracking, loyalty programs, and business analytics in a single unified application.

The application follows a multi-tenant architecture where each authenticated vendor has their own isolated data scope. The voice and tone are designed to be local, warm, and Hinglish-friendly to resonate with the target audience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom build script for production
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (warm, India-inspired palette)
- **Animations**: Framer Motion for page transitions and interactions
- **Charts**: Recharts for analytics visualization
- **PDF Generation**: jsPDF with jspdf-autotable for bill receipts

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: express-session with connect-pg-simple for PostgreSQL-backed sessions

### Authentication
- **Method**: Replit OpenID Connect (OIDC) authentication
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **User Management**: Automatic user upsert on login with profile creation flow

### Admin Approval System
- **Onboarding Flow**: New vendors register → profile created with `pending` status → admin approves → status becomes `active`
- **Admin Role**: Profiles have `isAdmin` boolean field - admins can access `/admin` panel
- **Status States**: `pending` (awaiting approval), `active` (can access dashboard), `rejected` (denied)
- **Admin Endpoints**: Protected with `requireAdmin` middleware (returns 403 for non-admins)
  - `GET /api/admin/check` - Check if current user is admin
  - `GET /api/admin/profiles` - List all vendor profiles
  - `PATCH /api/admin/profiles/:id/status` - Update vendor status
- **Pending Vendors**: Redirected to `/pending-approval` page until approved

### Multi-Tenant Data Isolation
- Each vendor has a `profiles` record linked to their auth user ID
- All business data (customers, menu items, bills, inventory) is scoped by `vendorId`
- Protected routes verify profile ownership before data access

### Key Data Models
- **profiles**: Vendor business information and settings
- **customers**: Customer data with visit tracking and spending history
- **menuItems**: Product catalog with pricing and availability
- **inventory**: Stock tracking with minimum level alerts
- **bills**: Transaction records with itemized details
- **loyaltyPoints/loyaltyRewards**: Tiered loyalty program (bronze/silver/gold/platinum)
- **notifications**: In-app notification system

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks for data fetching
│   ├── pages/           # Page components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── replit_integrations/  # Auth, chat, and image AI integrations
│   ├── routes.ts        # API route handlers
│   └── storage.ts       # Database access layer
├── shared/              # Shared code between client/server
│   ├── schema.ts        # Drizzle database schema
│   ├── routes.ts        # API contract definitions with Zod
│   └── models/          # Shared type definitions
└── migrations/          # Drizzle database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and query building
- **drizzle-kit**: Database migration tool (`db:push` command)

### Authentication
- **Replit OIDC**: OpenID Connect provider for user authentication
- **Required Env Vars**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### AI Integrations (Replit AI Integrations)
- **Gemini API**: Used for chat and image generation features
- **Models Available**: gemini-2.5-flash (fast), gemini-2.5-pro (reasoning), gemini-2.5-flash-image (image generation)
- **Required Env Vars**: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

### Third-Party Libraries
- **jsPDF/jspdf-autotable**: PDF bill generation
- **Framer Motion**: Animation library
- **Recharts**: Analytics charts
- **Radix UI**: Headless UI component primitives
- **Zod**: Runtime type validation for API contracts