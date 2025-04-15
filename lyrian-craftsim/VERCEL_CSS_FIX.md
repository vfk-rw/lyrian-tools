# CSS Styling Fix for Vercel Deployment

## Problem

The map application's buttons were styled correctly during local development but appeared with incorrect/missing styling when deployed to Vercel.

## Root Cause

The issue was in how CSS was imported in the Toolbar component. In `Toolbar.svelte`, CSS was imported using a source path reference:

```html
<svelte:head>
  <link rel="stylesheet" href="/src/lib/styles/toolbar.css">
</svelte:head>
```

This works during local development because Vite can resolve these source paths, but after building and deploying to Vercel, the `/src` directory structure no longer exists in the same way.

## Solution

The fix involved changing how the CSS is imported, using Svelte's module import system instead of a direct path reference:

```js
// In Toolbar.svelte script section
import '$lib/styles/toolbar.css';
```

And removing the svelte:head link tag:

```html
<!-- Removed this -->
<svelte:head>
  <link rel="stylesheet" href="/src/lib/styles/toolbar.css">
</svelte:head>
```

## Why This Works

In SvelteKit:

- Using `import '$lib/styles/toolbar.css'` in the script section allows the CSS to be properly processed by Vite's build system
- The `$lib` alias is maintained throughout the build process and correctly maps to the proper location
- This approach ensures the styles are consistently applied in both development and production environments
- Unlike direct source references with paths like `/src/...`, the import approach will be correctly processed and bundled

## Related Issues

This is similar to the SVG icon loading issue previously fixed (documented in VERCEL_SVG_FIX.md). Both involve paths that work locally but break in production builds on Vercel because the source directory structure is different.

## Best Practices for CSS in SvelteKit

1. **Always use import statements** for CSS files rather than `<link>` tags with direct paths
2. **Use the `$lib` alias** rather than `/src/lib` paths
3. **Component-scoped styles** using `<style>` tags inside components are preferred when possible
4. **Global styles** should be imported in layout components (typically `+layout.svelte`)
