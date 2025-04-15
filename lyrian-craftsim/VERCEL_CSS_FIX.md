# CSS Issues and Fixes for Vercel Deployment

This document explains the CSS issues we encountered when deploying the Lyrian Tools app to Vercel and how we fixed them.

## Issues

1. **Incorrect CSS Path References:**
   - In `Toolbar.svelte`, we were using direct source paths like `/src/lib/styles/toolbar.css` which don't work in Vercel's production environment.
   - Button styling was inconsistent between local development and deployed version.
   - Dark/light mode was not properly propagating to all components.

2. **Duplicated CSS:**
   - Similar styles were copy-pasted across multiple components, especially modal and button styles.
   - Dark theme implementations were inconsistent.

3. **A11y Issues:**
   - Clickable `div` elements without proper keyboard event handlers.
   - Missing ARIA roles on interactive elements.
   - Missing href attributes on `a` elements.

## Solutions

### 1. Modular CSS Architecture

Created a layered CSS system:

1. **Root Layer:**
   - `app.css` - CSS variables, theme settings, basic element styling

2. **Building Blocks:**
   - `layouts.css` - Grid systems, containers, structural components
   - `forms.css` - Form controls, inputs, labels
   - `buttons.css` - Button variants and states

3. **Component Layer:**
   - `components.css` - UI components (cards, badges, etc.)
   - `modal.css` - Modal dialog styles

4. **Feature-Specific Layer:**
   - `map-specific.css` - Imports dependencies & map-specific styles
   - `crafting-specific.css` - Imports dependencies & crafting-specific styles

### 2. Proper CSS Import Method

Changed from:
```html
<svelte:head>
  <link rel="stylesheet" href="/src/lib/styles/toolbar.css">
</svelte:head>
```

To:
```js
<script>
  import '$lib/styles/toolbar.css';
</script>
```

This uses Svelte's import system with the `$lib` alias which properly resolves paths in both development and production builds.

### 3. Dark Mode Implementation

1. Centralized CSS variables in `app.css`
2. Improved the theme toggle with proper initialization and persistence
3. Added consistent dark theme selectors across all CSS files
4. Ensured proper dark theme cascading to all components
5. Used `documentElement.setAttribute('data-theme', theme)` for additional CSS targeting options

### 4. Fixed A11y Issues

1. Replaced clickable `div` elements with proper `a` elements with roles
2. Added keyboard event handlers for accessibility
3. Ensured all `a` elements have href attributes

## Results

- **Consistent styling** across development and production environments
- **Improved maintainability** with modular CSS
- **Reduced duplication** by centralizing common styles
- **Better theme support** with consistent dark/light mode
- **Improved accessibility** with proper semantic HTML

## Useful References

- [SvelteKit aliasing documentation](https://kit.svelte.dev/docs/modules#$lib)
- [CSS custom properties (variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
