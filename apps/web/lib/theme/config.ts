/**
 * Theme configuration constants
 */
export const themeConfig = {
  radius: {
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
  },
  spacing: {
    section: '2rem',
    container: '8rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * Common container styles
 */
export const containerStyles = {
  default: 'container mx-auto px-4 sm:px-6 lg:px-8',
  tight: 'container mx-auto px-4',
  wide: 'container mx-auto px-8 lg:px-12',
} as const;

/**
 * Common section spacing
 */
export const sectionStyles = {
  default: 'space-y-8',
  tight: 'space-y-4',
  loose: 'space-y-12',
} as const;
