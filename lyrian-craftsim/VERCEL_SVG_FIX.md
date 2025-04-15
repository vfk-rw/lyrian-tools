# SVG Icon Loading Fix for Vercel Deployment

## Problem

The map application works locally but SVG icons fail to load when deployed to Vercel, resulting in 404 errors like:

```
Failed to load resource: the server responded with a status of 404 ()
village.svg:1
```

## Root Cause

The issue was in how SVG icons were referenced in the application. In `iconRegistry.ts`, icon paths were set to:

```ts
path: `/src/assets/icons/category/${file}`
```

This works during local development because Vite can resolve these source paths, but after building and deploying to Vercel, the `/src` directory structure no longer exists in the same way.

## Solution

The fix involved moving all SVG icons to the `static` directory, which is served directly from the root URL in both development and production builds:

1. Created a parallel directory structure in the `static` folder:
   ```
   /static/icons/animal/
   /static/icons/building/
   /static/icons/civilization/
   /static/icons/nature/
   ```

2. Copied all SVG files from their source location to the corresponding directories in `static`

3. Updated `iconRegistry.ts` to use paths that start with `/icons/` instead of `/src/assets/icons/`

## Why This Works

In SvelteKit:
- Files in the `static` directory are copied as-is to the build output and served from the root URL
- The path structure remains consistent between development and production environments
- Unlike source files in `src`, static assets maintain their original paths when deployed

## Testing

Created a test HTML file (`/static/test.html`) that loads SVGs directly from the static path to verify the fix works.

## Alternatives Considered

Other approaches that could have worked:

1. Using Vite's asset handling through imports:
   ```ts
   import animalSkullIcon from '$lib/assets/icons/animal/animal-skull.svg';
   ```

2. Adding SVG-specific configuration to `vite.config.ts` 

3. Using SvelteKit's `$app/paths` module for base URL resolution

The static directory approach was chosen for simplicity and reliability.
