# Component Library Documentation

This document describes the reusable component system built on top of shadcn/ui.

## Architecture

The component library is organized into three layers:

### 1. UI Primitives (`components/ui/`)

Base components from shadcn/ui with minimal customization:

- **Button**: Standard button with variants (default, secondary, destructive, outline, ghost, link)
- **Card**: Container with header, content, and footer sections

### 2. Common Components (`components/common/`)

Reusable composite components for common patterns:

#### PageContainer

Provides consistent page-level layout with proper spacing and containment.

```tsx
import { PageContainer } from '@/components/common';

<PageContainer variant="default" spacing="default">
  {/* Your content */}
</PageContainer>;
```

**Props:**

- `variant`: 'default' | 'tight' | 'wide' - Controls horizontal padding
- `spacing`: 'default' | 'tight' | 'loose' - Controls vertical spacing
- `className`: Additional CSS classes

#### SectionHeader

Standardized section titles with optional descriptions.

```tsx
import { SectionHeader } from '@/components/common';

<SectionHeader
  title="Page Title"
  description="Optional description"
  level={1}
/>;
```

**Props:**

- `title`: string - The heading text
- `description`: string (optional) - Subheading text
- `level`: 1 | 2 | 3 - Heading level (h1, h2, h3)
- `className`: Additional CSS classes

#### ButtonGroup

Flex layout for button collections with consistent spacing.

```tsx
import { ButtonGroup } from '@/components/common';

<ButtonGroup orientation="horizontal" align="start">
  <Button>First</Button>
  <Button>Second</Button>
</ButtonGroup>;
```

**Props:**

- `orientation`: 'horizontal' | 'vertical' - Layout direction
- `align`: 'start' | 'center' | 'end' | 'between' - Alignment
- `className`: Additional CSS classes

#### StatCard

Display metrics and statistics with optional trends.

```tsx
import { StatCard } from '@/components/common';

<StatCard
  title="Total Users"
  value="12,543"
  description="Active users this month"
  trend={{ value: 12.5, direction: 'up' }}
/>;
```

**Props:**

- `title`: string - Card title
- `value`: string | number - The main metric value
- `description`: string (optional) - Additional context
- `icon`: ReactNode (optional) - Icon to display
- `trend`: object (optional) - Trend indicator with value and direction
- `className`: Additional CSS classes

### 3. Feature Components (`components/features/`)

Feature-specific compositions organized by domain:

#### Airdrop Components (`components/features/airdrop/`)

##### AirdropForm

Form for requesting SOL airdrops.

```tsx
import { AirdropForm } from '@/components/features/airdrop';

<AirdropForm
  onSubmit={async (address, amount) => {
    // Handle airdrop request
  }}
/>;
```

**Props:**

- `onSubmit`: (address: string, amount: number) => Promise<void>

##### AirdropHistory

Display list of recent airdrop transactions.

```tsx
import { AirdropHistory } from '@/components/features/airdrop';

<AirdropHistory
  transactions={[
    {
      signature: '...',
      address: '...',
      amount: 2.5,
      timestamp: new Date(),
      status: 'success',
    },
  ]}
/>;
```

**Props:**

- `transactions`: Array of transaction objects

## Theme System

### Theme Colors (`lib/theme/colors.ts`)

Centralized theme color tokens that map to CSS variables:

- `themeColors`: Complete color palette
- `semanticColors`: Common use case mappings (success, warning, error, info)

### Theme Config (`lib/theme/config.ts`)

Configuration constants for consistent theming:

- `themeConfig`: Radius, spacing, and breakpoint values
- `containerStyles`: Predefined container class strings
- `sectionStyles`: Predefined section spacing class strings

### Using Theme Tokens

```tsx
import { themeColors, semanticColors } from '@/lib/theme/colors';
import { containerStyles, sectionStyles } from '@/lib/theme/config';

// In Tailwind classes
<div className="bg-primary text-primary-foreground" />;

// In component styling
const customCard = cn(
  containerStyles.default,
  sectionStyles.loose,
  'custom-class',
);
```

## CSS Variables

All colors are defined as HSL values in `app/globals.css`:

### Light Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  /* ... */
}
```

### Dark Mode

```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  /* ... */
}
```

## Adding New Components

### 1. UI Primitives

Use shadcn CLI to add new primitives:

```bash
cd apps/web && npx shadcn@latest add <component-name>
```

### 2. Common Components

Create in `components/common/` following these patterns:

- Accept `className` prop for extensibility
- Use `cn()` utility for class merging
- Export from `components/common/index.ts`
- Document props with TypeScript interfaces

### 3. Feature Components

Create in `components/features/<domain>/`:

- Keep feature-specific logic isolated
- Use common components for layout
- Export from domain-specific index file
- Include 'use client' directive if using hooks/state

## Examples

See `/test-components` for a comprehensive showcase of all components and their variants.

See `/airdrop` for a real-world feature implementation using the component system.
