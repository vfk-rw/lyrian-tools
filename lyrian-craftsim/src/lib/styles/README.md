# CSS Organization for Lyrian Tools

This directory contains modular CSS files that provide consistent styling across the application. By extracting common styles into separate files, we eliminate duplication and ensure a consistent look and feel.

## CSS Files Overview

| Filename | Purpose | Used By |
|----------|---------|---------|
| **buttons.css** | Common button styles and variants | All pages with buttons |
| **common.css** | Global app layout, navigation, and theme styles | Imported in +layout.svelte |
| **modal.css** | Common modal dialog styles | All modal components |
| **toolbar.css** | Styles for the map toolbar | Toolbar.svelte |

## Best Practices

### Importing CSS

Always import CSS files in the script section of Svelte components:

```js
<script>
  // Import CSS at the top of your script section
  import '$lib/styles/modal.css';
  import '$lib/styles/buttons.css';
  
  // Component code...
</script>
```

**NEVER** use direct path references like `/src/lib/styles/...` as these won't work in production builds on Vercel.

### Component-Specific Styles

When a component needs to override or extend the common styles, define those overrides in a component-specific `<style>` block:

```html
<style>
  /* Component-specific modifications */
  .icon-grid {
    grid-template-columns: repeat(7, 1fr);  /* Override the default from modal.css */
  }
</style>
```

### Adding New CSS Files

When creating new CSS files:

1. Focus on a single concern (e.g., forms, typography, layout)
2. Use clear, descriptive names
3. Document the purpose at the top of the file
4. Update this README.md

## Themes and Dark Mode

The application supports light and dark themes. Dark theme styles are designated with the `.dark-theme` class prefix in `common.css`. 

## Vercel Deployment Considerations

Vercel builds have a different structure than the development environment. Always use proper imports with the `$lib` alias rather than direct `/src/` path references.

See `VERCEL_CSS_FIX.md` and `VERCEL_SVG_FIX.md` for more details on how we fixed issues with path references.
