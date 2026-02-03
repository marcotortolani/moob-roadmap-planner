# UI Patterns and Utilities

This document describes the reusable UI patterns and utilities available in the Roadmap Planner application.

## Table of Contents

1. [Tailwind Config Extensions](#tailwind-config-extensions)
2. [CSS Utilities (@apply)](#css-utilities-apply)
3. [TypeScript Utilities](#typescript-utilities)
4. [Usage Examples](#usage-examples)

---

## Tailwind Config Extensions

### Custom Colors

The following design system colors are available:

```tsx
// Usage in className
className="bg-slate-blue text-white"
className="bg-light-gray-bg"
className="bg-soft-green"
```

- `slate-blue`: #778899 - Primary brand color
- `light-gray-bg`: #F0F8FF - Light background color
- `soft-green`: #90EE90 - Accent/success color

### Custom Animations

```tsx
// Available animations
className="animate-fade-in"
className="animate-fade-out"
className="animate-slide-in-right"
className="animate-slide-in-left"
className="animate-scale-in"
```

### Custom Spacing

```tsx
// Consistent spacing values
className="p-card-padding"     // 1rem (16px)
className="space-y-section-gap" // 1.5rem (24px)
```

---

## CSS Utilities (@apply)

These utilities are available in `globals.css` using `@apply` directives.

### Card Utilities

```tsx
// Base card
<div className="card-base">...</div>

// Card with hover effect
<div className="card-hover">...</div>

// Interactive card (scales on hover)
<div className="card-interactive">...</div>

// Card with border
<div className="card-bordered">...</div>
```

### Badge Utilities

```tsx
// Basic badge
<span className="badge-base">Label</span>

// Outlined badge
<span className="badge-outline">Label</span>

// Pill-shaped badge
<span className="badge-pill">Label</span>

// Status badges
<span className="badge-planned">Planned</span>
<span className="badge-in-progress">In Progress</span>
<span className="badge-demo-ok">Demo OK</span>
<span className="badge-live">Live</span>
```

### Layout Utilities

```tsx
// Container with responsive padding
<div className="container-app">...</div>

// Section with consistent gap
<div className="section-spacing">...</div>

// Responsive grid (1/2/3 columns)
<div className="grid-responsive">...</div>

// Dashboard grid (2/4 columns)
<div className="grid-dashboard">...</div>

// Flex layouts
<div className="flex-center">...</div>
<div className="flex-between">...</div>
<div className="flex-start">...</div>
```

### Typography Utilities

```tsx
// Headings
<h1 className="heading-1">Title</h1>
<h2 className="heading-2">Subtitle</h2>
<h3 className="heading-3">Section Title</h3>
<h4 className="heading-4">Subsection Title</h4>

// Muted text
<p className="text-muted">Secondary information</p>
```

### Input Utilities

```tsx
// Input with icon
<Input className="input-with-icon" />

// Input with error state
<Input className="input-error" />
```

### Animation Utilities

```tsx
// Smooth transitions
<div className="animate-smooth">...</div>
<div className="animate-smooth-fast">...</div>
<div className="animate-smooth-slow">...</div>
```

---

## TypeScript Utilities

The `src/lib/ui-utils.ts` file provides TypeScript utilities and helper functions.

### Importing

```tsx
import {
  cn,
  cardStyles,
  badgeStyles,
  iconStyles,
  getStatusBadgeClasses,
  getCardClasses,
  getIconSize,
} from '@/lib/ui-utils'
```

### Usage Examples

#### Using Style Objects

```tsx
import { cardStyles, badgeStyles } from '@/lib/ui-utils'

// Card with custom classes
<Card className={cardStyles.hover}>...</Card>

// Badge with base styles
<Badge className={badgeStyles.pill}>New</Badge>
```

#### Helper Functions

```tsx
import { getStatusBadgeClasses, getCardClasses } from '@/lib/ui-utils'

// Get status-specific badge classes
<Badge className={getStatusBadgeClasses('IN_PROGRESS')}>
  In Progress
</Badge>

// Get card classes with custom additions
<div className={getCardClasses('hover', 'border-l-4 border-primary')}>
  ...
</div>
```

#### Icon Sizes

```tsx
import { getIconSize, getButtonIconSize } from '@/lib/ui-utils'

// Responsive icon size
<Search className={getIconSize('sm')} />

// Button icon size
<Button size="icon" className={getButtonIconSize('base')}>
  <MoreVertical className="h-4 w-4" />
</Button>
```

#### Animation Styles

```tsx
import { animationStyles } from '@/lib/ui-utils'

// Fade in animation
<div className={animationStyles.fadeIn}>...</div>

// Custom transition
<div className={animationStyles.transition.slow}>...</div>
```

---

## Usage Examples

### Complete Component Example

```tsx
import { getCardClasses, getStatusBadgeClasses, iconStyles } from '@/lib/ui-utils'
import { TrendingUp } from 'lucide-react'

function MetricCard({ title, value, status }) {
  return (
    <div className={getCardClasses('hover')}>
      <div className="flex-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={iconStyles.sm} />
          <h3 className="heading-4">{title}</h3>
        </div>
        <Badge className={getStatusBadgeClasses(status)}>
          {status}
        </Badge>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  )
}
```

### Migration Example

**Before:**

```tsx
<div className="rounded-lg p-4 shadow-sm hover:shadow-lg transition-shadow bg-card text-card-foreground">
  ...
</div>
```

**After (using @apply):**

```tsx
<div className="card-hover">
  ...
</div>
```

**Or (using TypeScript utility):**

```tsx
import { cardStyles } from '@/lib/ui-utils'

<div className={cardStyles.hover}>
  ...
</div>
```

### Combining Utilities

```tsx
import { cn, cardStyles, animationStyles } from '@/lib/ui-utils'

<div className={cn(
  cardStyles.interactive,
  animationStyles.fadeIn,
  "border-l-4 border-primary"
)}>
  ...
</div>
```

---

## Best Practices

1. **Use @apply utilities** for simple, static patterns
2. **Use TypeScript utilities** for dynamic patterns or when you need type safety
3. **Use `cn()` helper** to combine multiple class names and avoid conflicts
4. **Extend, don't override** - Add custom classes to base utilities instead of rewriting
5. **Keep consistency** - Use these utilities across the codebase for maintainability

---

## Adding New Patterns

### To add a new @apply utility:

1. Open `src/app/globals.css`
2. Add your utility in the `@layer components` section
3. Document it in this file

### To add a new TypeScript utility:

1. Open `src/lib/ui-utils.ts`
2. Add your pattern to the appropriate category
3. Export helper functions if needed
4. Document it in this file

### To add a new Tailwind extension:

1. Open `tailwind.config.ts`
2. Add your extension in the `theme.extend` section
3. Document it in this file
