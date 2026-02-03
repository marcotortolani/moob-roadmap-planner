# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Roadmap Planner** is a product roadmap management application built with Next.js 15 (App Router), TypeScript, and React 19. It allows users to plan, organize, and track product roadmaps with dual views (list and calendar), advanced filtering, and a statistics dashboard. All data is stored in localStorage for this demo version.

The app is designed for internal use at Media-Moob to manage multiple product roadmaps across different operators, countries, and languages.

## Common Commands

### Development

```bash
npm run dev              # Start dev server with Turbopack on port 9002
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Type check without emitting files
```

### Genkit AI (Optional)

```bash
npm run genkit:dev       # Start Genkit development UI
npm run genkit:watch     # Start Genkit with file watching
```

Note: AI features are configured but not actively used in the current implementation.

## Architecture

### App Structure (Next.js App Router)

- **Route Groups**: The app uses `(main)` route group for authenticated pages
  - `/` → Main page with product list/calendar views
  - `/dashboard` → Statistics and analytics dashboard
  - `/profile` → User profile management
  - `/login` → Authentication page (outside route group)

### Data Flow & State Management

**LocalStorage-based Architecture**: All data persistence happens through localStorage with custom storage event handling for real-time updates across components.

- `src/lib/actions.ts` → All CRUD operations for products and holidays
- `src/context/auth-context.tsx` → Authentication state using React Context
- Storage events are dispatched manually (`window.dispatchEvent(new Event('storage'))`) to trigger re-renders

**Important**: When modifying data, always:

1. Use the action functions from `src/lib/actions.ts`
2. Components listen to `storage` events for automatic updates
3. Date objects are serialized/deserialized when reading from localStorage

### Key Data Models

Located in `src/lib/types.ts`:

- **Product**: Core entity with:
  - Basic info (name, operator, country, language)
  - Date range (startDate, endDate)
  - Status enum: PLANNED, IN_PROGRESS, DEMO_OK, LIVE
  - URLs (productive, demo, WordPress content, chatbot)
  - Milestones array (with their own status)
  - Custom URLs array
  - Audit fields (createdBy, updatedBy, timestamps)

- **Milestone**: Sub-entity of Product with date range and status (PENDING, IN_PROGRESS, COMPLETED)

- **Holiday**: Standalone entity for calendar view

- **User**: Simple user model for mock authentication

All forms use Zod schemas for validation (`ProductSchema`, `MilestoneSchema`, `HolidaySchema`, `UserProfileSchema`).

### Component Architecture

**Presentation Components** (`src/components/`):

- `product-list.tsx` → Grouped by year/quarter display
- `product-calendar.tsx` → Monthly calendar view with holiday support
- `product-card.tsx` → Individual product card in list view
- `product-form.tsx` → Complex form with dynamic milestone/URL arrays
- `product-detail-modal.tsx` → Modal for viewing/editing products
- `holiday-management-modal.tsx` → CRUD for holidays
- `header.tsx` → Navigation with view switcher
- `view-switcher.tsx` → Toggle between list/calendar views

**Charts** (`src/components/charts/`):

- Uses Recharts for dashboard visualizations
- Data aggregation happens in dashboard page

**UI Components** (`src/components/ui/`):

- ShadCN/UI components (pre-configured, don't modify unless necessary)

### Styling & Design System

- **Tailwind CSS** with custom configuration in `tailwind.config.ts`
- **Color Scheme** (from blueprint):
  - Primary: Slate blue (#778899)
  - Background: Light gray (#F0F8FF)
  - Accent: Soft green (#90EE90)
- **Typography**: Space Grotesk (headlines), Inter (body)
- **Animations**: Framer Motion for view transitions and slide effects

### Authentication

Mock authentication system in `src/context/auth-context.tsx`:

- Demo credentials: `prueba@memoob.com` / `prueba`
- User data stored in localStorage
- Auto-redirect to `/login` if not authenticated
- `useAuth()` hook provides: user, login, logout, updateUser, loading

### View Management

The main page supports two views via URL query parameter `?view=list|calendar`:

- View preference is synced to localStorage
- Framer Motion handles slide transitions between views
- Each view receives the same filtered/sorted products array

### Filtering & Sorting

All filtering happens in `src/app/(main)/page.tsx`:

- **Filters**: search term, status, operator, country, language, year, quarter
- **Sorting**: name (asc/desc), date (asc/desc)
- Filter state is component-local (not in URL)
- Mobile: filters in a Sheet, Desktop: inline selects
- Active filters shown as dismissible badges

### Country Data

`src/lib/countries.ts` contains a comprehensive list of country codes, names, flags, and languages. This is used for:

- Country select dropdown with flag emojis
- Validation in ProductSchema
- Filtering by country

### Initial Data

- `src/lib/initial-products.json` → Seed data loaded on first run
- `src/lib/holidays.json` → Default holidays (can be managed via UI)

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Build errors are ignored in `next.config.ts` (consider fixing for production)

## Genkit AI Integration

Google AI (Gemini 2.5 Flash) is configured in `src/ai/genkit.ts` but not actively used in the current UI. This may be for future AI-powered features.

## Best Practices When Modifying This Codebase

1. **Forms**: Always use React Hook Form + Zod schemas defined in `types.ts`
2. **Dates**: All dates are Date objects in memory, strings in localStorage
3. **IDs**: Use `crypto.randomUUID()` for generating IDs
4. **Storage updates**: After modifying localStorage, dispatch storage event
5. **Responsive design**: Use Tailwind breakpoints (sm, md, lg, xl, 2xl)
6. **Spanish UI**: All user-facing text is in Spanish
7. **Color assignments**: Products have customizable `cardColor` for visual distinction
8. **View persistence**: Save view preference to localStorage for UX consistency

## Environment Variables

None required for development (uses mock authentication and localStorage).

For Genkit AI features, set:

```text
GOOGLE_API_KEY=your_key_here
```

## Notes

- The app is a demo/prototype using localStorage
- No backend server or database in current implementation
- Authentication is mocked for development purposes
- The calendar view highlights holidays and product timelines
- Products can overlap in time (handled in calendar rendering)
