# Hex Map Implementation & Brush Size Bug Fix

## Overview
This project implements an isometric hex map editor for TTRPGs using Svelte. The map is rendered as a grid of hex tiles, each with properties like biome, height, POIs, and icons. The editor supports painting biomes, heights, and icons with a variable-radius brush, as well as region and POI management.

## Hex Math & Coordinate System
- **Hex Coordinates:** Uses axial coordinates `(q, r)` for each hex tile.
- **Pixel Conversion:**
  - `hexToPixel(q, r)`: Converts hex coordinates to flat-topped pixel positions.
  - `hexToIsometric(q, r)`: Projects the pixel position into isometric view by squashing the y-axis.
- **Hex Key:** Each tile is uniquely identified by a string key `"q,r"`.
- **Brush Area:**
  - `getHexesInRange(centerQ, centerR, radius)`: Returns all hexes within a given radius (using cube distance) from a center tile.
- **Mouse Picking:**
  - `isometricPointToHexKey(x, y)`: Converts a pixel position (from a mouse event) to the nearest hex key, using both approximate math and a precise point-in-hex test.

## Rendering
- The map is rendered as an SVG, with each tile as a `<g>` group containing a `<polygon>` for the hex shape and optional overlays (icons, POIs, etc).
- The map supports pan and zoom, with camera offset and zoom stored in the UI store.

## Brush Size Bug (and Fix)
### The Bug
- The brush size slider was present, but only a single tile was painted or previewed on hover/click.
- Sometimes, clicking the background (not a tile) would paint a brush area, but at the wrong location.
- The brush preview (highlight) only showed on the hovered tile, not the full brush area.
- The root cause: The brush logic (multi-tile paint and preview) was implemented in the canvas click handler, which uses mouse coordinates, not tile coordinates. The hex tile click handler only painted one tile.

### The Fix
- **Moved all brush logic to the hex tile click handler** (`HexTile.svelte`). Now, clicking any tile with a brush size > 1 applies the tool to all tiles in the brush area centered on the clicked tile.
- **Brush preview logic**: The highlight for the brush area is calculated in each tile's component, based on the currently hovered tile and brush radius. Each tile checks if it is within the brush area and applies a visual effect if so.
- **Canvas click handler**: Now only handles background/deselect actions, not painting.
- **Debug output**: Added console logs to show which tiles are affected by the brush on hover and click, to verify correct behavior.

## Remaining Issue
- The brush preview highlight currently only appears on the hovered tile, not the full brush area. This is because the hover state is only set for a single tile at a time. (To fix: propagate the hovered tile to all tiles in the brush area for preview.)

## References
- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)
- See `src/lib/map/utils/hexlib.ts` for all hex math utilities.

---
*This document summarizes the current implementation and the recent brush size bug fix as of April 2025.*
