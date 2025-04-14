# GitHub Copilot Instructions for Lyrian Tools

## Project Overview

This project is a SvelteKit application designed to provide tools for the Lyrian TTRPG.

## Technical Stack & Conventions

*   **Framework:** SvelteKit 5
*   **Language:** TypeScript
*   **Svelte Version:** Svelte 5 (utilize Runes for reactivity)
*   **Package Manager:** pnpm
*   **Hosting:** Vercel

## Best Practices & Guidelines

1.  **Svelte 5 Syntax:** Always use the latest Svelte 5 syntax, including Runes (`$state`, `$derived`, `$effect`, etc.) for managing component state and reactivity. Avoid legacy Svelte reactivity patterns unless absolutely necessary.
2.  **TypeScript:** Use TypeScript for all Svelte components (`.svelte` files) and utility modules (`.ts` files). Ensure strong typing wherever possible.
3.  **Componentization:** Break down UI elements into small, reusable Svelte components. Favor creating new components over adding complexity to existing ones. This improves readability and maintainability.
5.  **Data Handling:**
    *   Do **not** inline data directly within Svelte components or TypeScript code.
    *   Load data required for tools (e.g., item lists, character options) from external JSON files located appropriately within the project structure (e.g., `/src/lib/data/`).
    *   For more complex data needs or user-specific data, consider fetching from a database or API endpoint (using SvelteKit's `load` functions in `+page.server.ts` or `+layout.server.ts`).
6.  **SvelteKit Features:** Leverage SvelteKit's features like routing, layouts, server-side rendering (SSR), and API routes (`+server.ts`) appropriately. Use `load` functions for data fetching that needs to run on the server or before the component mounts.
7.  **Vercel Deployment:** Keep Vercel deployment considerations in mind. Utilize environment variables for sensitive information or configuration specific to deployment environments. Be mindful of serverless function limitations if using API routes extensively.
8.  **pnpm:** Use `pnpm` commands for all package management tasks (`pnpm install`, `pnpm add`, `pnpm remove`, `pnpm run dev`, etc.).
9.  **Code Readability:** Write clean, well-commented code. Follow standard TypeScript and Svelte best practices.
10. **File Naming:** Use kebab-case for file and folder names (e.g., `my-component.svelte`, `data-fetching.ts`). SvelteKit route files (`+page.svelte`, `+layout.svelte`, `+server.ts`, etc.) are exceptions.

## Example Component Structure (Illustrative)

```svelte
<!-- filepath: src/lib/components/ExampleComponent.svelte -->
<script lang="ts">
    import { type ExampleData } from '$lib/types'; // Assuming types are defined
    import { ExternalData } from '$lib/data/example.json'; // Example of loading JSON

    let { initialValue }: { initialValue: number } = $props(); // Using $props rune

    let count = $state(initialValue); // Using $state rune
    let doubled = $derived(count * 2); // Using $derived rune

    $effect(() => { // Using $effect rune
        console.log(`Count changed to: ${count}`);
    });

    function increment() {
        count += 1;
    }
</script>

<div class="p-4 border rounded bg-gray-100 dark:bg-gray-800">
    <h2 class="text-xl font-bold mb-2">Example Component</h2>
    <p>Current count: {count}</p>
    <p>Doubled count: {doubled}</p>
    <button class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onclick={increment}>
        Increment
    </button>
    <h3 class="mt-4 font-semibold">Data from JSON:</h3>
    <pre class="text-sm bg-gray-200 dark:bg-gray-700 p-2 rounded">{JSON.stringify(ExternalData, null, 2)}</pre>
</div>
