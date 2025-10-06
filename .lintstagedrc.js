module.exports = {
  // API TypeScript files - run ESLint with API-specific rules
  'apps/api/**/*.{ts,tsx}': (files) => {
    const relativeFiles = files.map(f => f.replace('apps/api/', '')).join(' ');
    return [
      `cd apps/api && eslint --fix ${relativeFiles}`,
      `prettier --write ${files.join(' ')}`,
    ];
  },

  // Web TypeScript/JavaScript files - run Next.js ESLint
  'apps/web/**/*.{ts,tsx,js,jsx}': (files) => {
    const relativeFiles = files.map(f => f.replace('apps/web/', '')).join(' ');
    return [
      `cd apps/web && eslint --fix ${relativeFiles}`,
      `prettier --write ${files.join(' ')}`,
    ];
  },

  // All other files - just format with Prettier
  '**/*.{json,md,css,scss}': (files) => {
    return `prettier --write ${files.join(' ')}`;
  },
};
