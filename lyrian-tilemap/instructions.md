# Lyrian Tilemap Tool Instructions

This document outlines the steps to create a tile mapping tool using SvelteKit 5 and Tailwind CSS 4. The package manager is pnpm. Remember to keep code, data, and css in seperate files in the structure for readability and accesibility. Look for well known packages for proven solutions before rolling your own setup.

## Development Steps

1.  **Read Tile Instructions:**
    *   Familiarize yourself with the tile naming conventions and any specific usage instructions provided in `./static/tiles/hex and tile samples readme.txt`

2.  **List Available Tiles:**
    *   Create a `TileRegistry` by scanning the `static/Tile_Samples` directory for `.png` files.
    *   This registry should map tile identifiers (derived from filenames) to their corresponding image paths (e.g., `/Tile_Samples/Tiles_Ground/grass_1.png`).
    *   Use SvelteKit's server-side capabilities (e.g., in a `+page.server.js` or `+layout.server.js` load function) with the Node.js `fs` module to read the directory contents and build the registry. Pass this data to the client.
    *   Display these tiles in the `TileSelector` component, possibly grouped or filtered based on directories or name. Use Tailwind CSS for styling.

3.  **Create Map Grid:**
    *   Create a Svelte component (e.g., `src/lib/components/MapGrid.svelte`).
    *   You can use SVG Canvas for rendering.
    *   Use CSS Grid or Flexbox with Tailwind CSS classes to create a grid structure (e.g., `grid grid-cols-20 gap-0`).
    *   Each cell in the grid should be a placeholder where a tile can be placed.

4.  **Implement Tile Placement:**
    *   Maintain the state of the map grid (e.g., using a Svelte store or component state). This state should store which tile is placed in each grid cell.
        * Multiple tiles can occupy the same place in the cell - since some of the tiles are terrain features (rivers, buildings) that lay on top of the base tile. Make sure the data structure can handle this.
    *   Add event listeners (`on:click`) to the `TileSelector` component to select the active tile.
    *   Add event listeners (`on:click`, `on:dragover`, `on:drop`) to the `MapGrid` cells.
    *   When a grid cell is clicked (or dragged onto), update the map state to place the currently selected tile in that cell.
    *   Render the corresponding tile image in the grid cell based on the map state.

5.  **Save/Load Functionality:**
    *   Implement functions to save the current map state (e.g., as a JSON file) and load a previously saved map state.
    *   **Best Practices for JSON Handling:**
        *   **Import:** When loading map data from a JSON file, always validate its structure and sanitize its content before processing. Use a schema validation library (e.g., Zod, Ajv) or manual checks to ensure the data conforms to the expected format. Sanitize any string data that might be rendered in the UI to prevent Cross-Site Scripting (XSS) attacks. Implement robust error handling for invalid or malformed JSON.
        * Ensure values for numerical values such as grid size, coordinates, etc are within reasonable ranges.
        *   **Export:** Ensure the map state is correctly serialized into well-formed JSON using standard methods like `JSON.stringify`. Maintain a consistent data structure for saved files.


## Running the Application

```bash
pnpm run dev -- --open
```

This will start the development server and open the application in your browser. Build the components iteratively, starting with displaying the tiles, then the grid, and finally implementing the interaction logic.