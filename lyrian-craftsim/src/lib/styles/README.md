# CSS Organization for Lyrian Tools

This directory contains modular CSS files that provide consistent styling across the application. By extracting common styles into separate files, we eliminate duplication and ensure a consistent look and feel.

## CSS Files Overview

| Filename | Purpose | Used By |
|----------|---------|---------|
| **app.css** | Root-level styles, theme variables, basic elements | Imported in +layout.svelte |
| **buttons.css** | Common button styles and variants | All pages with buttons |
| **common.css** | Global app layout, navigation, and theme styles | Imported in +layout.svelte |
| **components.css** | Reusable UI component styles (cards, badges, logs, etc.) | Imported by feature-specific CSS |
| **crafting-specific.css** | Crafting simulator specific styles | Imported in craftsim-blacksmithing/+page.svelte |
| **forms.css** | Input controls, labels, and form layouts | Imported by feature-specific CSS |
| **layouts.css** | Grid systems, containers, and structural components | Imported by feature-specific CSS |
| **map-specific.css** | Map editor specific styles | Imported in map/+page.svelte |
| **modal.css** | Common modal dialog styles | All modal components |
| **toolbar.css** | Styles for the map toolbar | Toolbar.svelte |

## Style Architecture

Our CSS is now organized in a modular, layered approach:

1. **Root Styles** (`app.css`): Basic setup, theme variables
2. **Core Building Blocks** (`layouts.css`, `forms.css`, `buttons.css`): Primitive components
3. **Reusable Components** (`components.css`, `modal.css`): Complex, composable elements
4. **Feature-Specific Styles** (`map-specific.css`, `crafting-specific.css`): Page-specific styles

This architecture follows the principle of increasing specificity, with more general styles at the bottom of the cascade and more specific ones at the top.

## Importing CSS

Always import CSS files in the script section of Svelte components:

```js
<script>
  // For component-specific imports:
  import '$lib/styles/modal.css';
  import '$lib/styles/buttons.css';
  
  // For feature-specific imports that bundle multiple stylesheets:
  import '$lib/styles/map-specific.css';
  
  // Component code...
</script>
```

**NEVER** use direct path references like `/src/lib/styles/...` as these won't work in production builds on Vercel.

## CSS Import Tree

Feature-specific CSS files already import their dependencies, so you only need to import the top-level CSS for your feature:

```
map-specific.css
├── layouts.css
├── forms.css
├── components.css
└── buttons.css

crafting-specific.css
├── layouts.css
├── forms.css
├── components.css
└── buttons.css
```

## Component-Specific Styles

When a component needs to override or extend the common styles, define those overrides in a component-specific `<style>` block:

```html
<style>
  /* Component-specific modifications */
  .icon-grid {
    grid-template-columns: repeat(7, 1fr);  /* Override the default from modal.css */
  }
</style>
```

## Adding New CSS Files

When creating new CSS files:

1. Focus on a single concern (e.g., forms, typography, layout)
2. Use clear, descriptive names
3. Document the purpose at the top of the file
4. Update this README.md

## Themes and Dark Mode

The application supports light and dark themes. The themes are managed in `app.css` using CSS variables and the `.dark-theme` class applied to the body.

### Dark Theme Implementation

1. The theme toggle in `+layout.svelte` adds/removes the `.dark-theme` class on the body element
2. CSS variables in `app.css` provide light/dark values
3. Component styles use these variables or have specific `.dark-theme` override selectors

### Using Dark Theme in Components

To support dark theme, either:

1. Use CSS variables for colors:
   ```css
   .my-element {
     background-color: var(--background-color);
     color: var(--text-color);
   }
   ```

2. Or provide specific dark theme overrides:
   ```css
   .dark-theme .my-element {
     background-color: #333;
     color: #fff;
   }
   ```

## Vercel Deployment Considerations

Vercel builds have a different structure than the development environment. Always use proper imports with the `$lib` alias rather than direct `/src/` path references.

See `VERCEL_CSS_FIX.md` and `VERCEL_SVG_FIX.md` for more details on how we fixed issues with path references.
