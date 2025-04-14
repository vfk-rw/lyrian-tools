# Lyrian TTRPG Tools

A collection of tools for tabletop role-playing games, including a hex map editor, crafting simulator, and character sheet manager.

## Hex Map Editor

The hex map editor allows you to create isometric hex-based maps with different biomes, points of interest, and regions. It features:

- Isometric 3D view with hexagonal grid
- Multiple terrain types/biomes
- Placeable points of interest with custom names and descriptions
- Region grouping with colored outlines
- Import/export to JSON for saving and sharing maps

### Using the Map Editor

1. **Tools**
   - **Biome Brush**: Paint hexes with different terrain types
   - **POI Tool**: Add points of interest like cities, dungeons, forests
   - **Region Tool**: Group hexes into named regions
   - **Resize Tool**: Grow or shrink the map grid

2. **Keyboard Shortcuts**
   - `B`: Biome brush tool
   - `P`: POI tool
   - `R`: Region tool
   - `Z`: Resize tool
   - `Escape`: Cancel current selection

3. **Export/Import**
   - Use the Export button to save your map as a JSON file
   - Use the Import button to load a previously saved map

## Features Coming Soon

- **Crafting Simulator**: Simulate crafting items using different materials and techniques
- **Character Sheet Manager**: Create and manage character sheets for your campaigns

## Development

This project is built with SvelteKit 5, Threlte (Svelte + Three.js), and Honeycomb for hex grid management.

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/lyrian-tools.git
   cd lyrian-tools/lyrian-craftsim
   ```

2. Install dependencies:
   ```
   npm install
   # or with pnpm
   pnpm install
   ```

3. Run the development server:
   ```
   npm run dev
   # or with pnpm
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to see the application.

### Building for Production

```
npm run build
# or with pnpm
pnpm build
```

## Technologies Used

- [SvelteKit 5](https://kit.svelte.dev/)
- [Threlte](https://threlte.xyz/) (Svelte components for Three.js)
- [Three.js](https://threejs.org/) (3D rendering)
- [Honeycomb](https://github.com/flauwekeul/honeycomb) (Hex grid utilities)

## Project Structure

```
src/
├── lib/
│   ├── map/
│   │   ├── stores/           # Map data and UI state stores
│   │   └── utils/            # Utility functions for hex grid and rendering
│   └── styles/               # Global styles
└── routes/
    ├── map/                  # Map editor route
    │   ├── components/       # Map editor components
    │   └── +page.svelte      # Map editor page
    └── +page.svelte          # Landing page
