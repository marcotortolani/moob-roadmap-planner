# **App Name**: Product Roadmap Planner

## Core Features:

- Product Card Creation: Create product cards with fields for product name, operator/country, language, start date, end date, URLs (Productive, Vercel demo, WordPress content (prod/test), chatbot), comments, status, and assigned color.
- Product Card Editing: Enable editing of all fields within a product card.
- Date Management within Product Card: Add, edit, and delete relevant dates/ranges within the product's start and end dates.
- List View: Display product cards in a sortable list, ordered by start date, taking overlaps into account.
- Calendar View: Visualize product timelines on a calendar, with blocks representing each product's duration, using assigned card colors, even when there are overlapping date ranges.
- Supabase Integration: Utilize Supabase as the database to store and manage product roadmap data; Next.js, Tailwind CSS and Typescript are preconfigured; Prisma is used as the ORM. Environment variables are configured and ready to be set up.

## Style Guidelines:

- Primary color: Slate blue (#778899). This evokes a sense of organization, structure, and forward planning. 
- Background color: Light gray (#F0F8FF). The scheme remains professional while being easy on the eyes.
- Accent color: Soft green (#90EE90). As an analogous color it can signal 'go' or 'ready to ship.'
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, 'Inter' (sans-serif) for body text.
- Use clear and intuitive icons to represent different product statuses and actions.
- Maintain a clean and organized layout to ensure easy navigation and readability.
- Use subtle transitions and animations to enhance user experience during actions like card creation/editing or view switching.