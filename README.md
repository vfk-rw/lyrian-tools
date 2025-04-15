# Lyrian TTRPG Tools

Lyrian Chronicles TTRPG fan-created tools suite. This repository contains a collection of interactive tools to enhance your tabletop role-playing game experience with Lyrian Chronicles.

## Live Application

https://lyrian-tools-craftsim.vercel.app/

## Available Tools

The application provides several specialized tools:

### 1. Hex Map Editor 🗺️
Create isometric hex maps with customizable features:
- Define regions and territories
- Add points of interest
- Use multiple terrain types
- Export and import maps as JSON

### 2. Crafting Simulator ⚒️
Simulate crafting items with detailed mechanics:
- Use different materials and techniques for various crafting classes
- Calculate success chances
- Determine material requirements
- Test various crafting strategies

### 3. Adventure Calendar 📅
Manage game timelines effectively:
- View and manage adventure routes on a calendar
- Track adventurers and their status
- Record play history
- Plan upcoming events

### 4. Character Sheet (Coming Soon) 📝
Future tool that will allow players to:
- Manage character stats, inventory, and abilities
- Track character progression
- Share character sheets with your party

## Technical Overview

### Landing Page Component Structure

The main landing page (`src/routes/+page.svelte`) serves as the entry point to the application and presents users with the available tools in a card-based layout.

#### Navigation Implementation

Each tool card uses Svelte's `goto` function for client-side navigation:

```typescript
<a href="/tool-path" on:click|preventDefault={() => goto('/tool-path')}>
```

With keyboard accessibility support:

```typescript
on:keydown={e => e.key === 'Enter' && goto('/tool-path')}
```

#### Theme Support

The application implements a comprehensive theming system supporting both light and dark modes:

```css
/* Dark mode styles */
:global(.dark-theme) .element {
  background-color: var(--background-color, #1a1a1a);
  color: var(--text-color, white);
}

/* Light mode styles */
:global(body:not(.dark-theme)) .element {
  background-color: var(--background-color, #f8f9fa);
  color: var(--text-color, #333);
}
```

The UI automatically adapts to the user's theme preference with smooth transitions between themes.

#### Responsive Design

The tool card layout uses CSS Grid for responsive design:

```css
.tools-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

This ensures the interface adapts smoothly to different screen sizes while maintaining visual consistency.

## Project Structure

The application is built using Svelte with TypeScript, organized around feature-based directories:

```
lyrian-tools/lyrian-craftsim/
├── src/
│   ├── lib/                # Shared library code
│   │   ├── components/     # Reusable components
│   │   ├── data/           # Data management
│   │   ├── map/            # Map-related functionality
│   │   └── styles/         # Global styling
│   ├── routes/             # Application routes
│   │   ├── calendar/       # Calendar tool
│   │   ├── character-sheet/# Character Sheet tool
│   │   ├── craftingsimulator/     # Crafting simulator
│   │   ├── map/            # Map editor tool
│   │   ├── +layout.svelte  # Root layout
│   │   └── +page.svelte    # Landing page
│   └── app.html            # HTML template
└── static/                 # Static assets
    ├── data/               # Static data files
    └── icons/              # SVG icons
```

## Getting Started

To run this project locally:

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Start the development server: `npm run dev` or `pnpm dev`
4. Open your browser to the URL shown in the terminal

## Contributing

Contributions to enhance or expand these tools are welcome. Please feel free to submit pull requests or open issues to suggest improvements.
