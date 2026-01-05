# Kilo Code Instructions

## 🧠 Role & Behavior
- Act as a Senior Full Stack Engineer expert in **Next.js 15**, **React 19**, and **MongoDB (Mongoose)**.
- Be concise. Focus on code. Minimize explanations unless asked.
- Always think step-by-step before implementing complex logic.
- Answer in [Russian/English].

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router).
- **Frontend:** React 19, TailwindCSS, React Icons.
- **Backend:** Next.js API Routes (Serverless), MongoDB, Mongoose.
- **State Management:** Zustand.
- **Authentication:** NextAuth.js (v5 beta).
- **Validation:** Zod.
- **Date Handling:** date-fns.
- **Types:** TypeScript (Strict mode enabled).

## 📝 Coding Standards
- **Functional Style:** Prefer functional components and immutability.
- **Naming:** Use PascalCase for components, camelCase for functions/variables.
- **Type Safety:** Avoid `any`. Define interfaces for all props and API responses in `/src/app/interfaces`.
- **Error Handling:** Always wrap async calls in try/catch or use a result pattern. Use `console.error` for debugging only in development.
- **Imports:** Use absolute imports configured in `tsconfig.json` (e.g., `@/components/...` mapped to `./src/components`).
- **Styling:** Use TailwindCSS utility classes. Avoid inline styles.

## 📂 Project Structure
### Core
- `/src/app` - Main application logic (App Router), pages, and API routes.
- `/src/app/api` - Backend API endpoints.
- `/src/app/components` - Application-specific components (Header, Authorization, etc.).
- `/src/app/components/ui` - Reusable UI components (Loader, Modals).
- `/src/app/(pages)` - Route groups for organizing pages.

### Logic & Data
- `/src/actions` - Server Actions for form handling and mutations.
- `/src/lib` - Core libraries and configurations (e.g., `mongodb.ts` for DB connection).
- `/src/models` - Mongoose data models and schemas.
- `/src/store` - Global state management (Zustand).
- `/src/utils` - Utility functions.
- `/src/db` - Static data or seed files (e.g., categories).

### Configuration
- `next.config.ts` - Next.js configuration.
- `tailwind.config.ts` - Tailwind CSS configuration.
- `package.json` - Dependencies and scripts.

## ✅ Testing & Quality
- Ensure all new components handle loading and error states (use `Loader.tsx` or Skeletons).
- Validate all incoming API data using **Zod** schemas (`/src/app/schema`).
- Use **ESLint** rules as configured in `eslint.config.mjs`.

## 🚀 Key Files to Check First
1. `package.json` - To verify dependencies and scripts.
2. `src/lib/mongodb.ts` - Database connection logic.
3. `src/app/layout.tsx` - Root layout and providers.
4. `src/app/api` - To understand existing backend endpoints.
5. `src/models` - To understand the database schema structure.