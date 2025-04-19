# Hex Grid Alignment System Documentation

This document details the improvements made to the hex grid alignment system in the Lyrian Hexmap editor. It covers the technical challenges faced, solutions implemented, and recommendations for future development.

## Key Features Added

1. **Projection Angle Control** - Added continuous angle adjustment (0-60 degrees) for the hex grid
2. **Fine-Tuning Controls** - Added sliders for precise control of:
   - Hex Size (100-180px)
   - X/Y Offset positioning (-20 to +20px)
   - Hex PNG Image Size (200-300px) 
   - X/Y Gaps between tiles (-32 to +32px)
3. **Back-to-Front Rendering** - Implemented proper rendering order so tiles at the top of the map appear behind tiles at the bottom
4. **Custom Selection System** - Created a selection system that matches visual alignment rather than mathematical grid

## Technical Implementation

### Projection Angle System

The projection angle controls the vertical squashing of hexes to create different viewing perspectives:
- **0 degrees**: Standard top-down equilateral hexes
- **45 degrees**: Moderate squashing typical for isometric-style maps
- **60 degrees**: More extreme perspective

We implemented this by calculating a y-factor that depends on the projection angle:
```typescript
// For 0 degrees (top-down), yRadius = xRadius (equilateral)
// For 45 degrees, use the formula: yRadius = xRadius * (2 * Math.sqrt(3/8)) / Math.sqrt(3)
// For 60 degrees, use the formula: yRadius = xRadius * (2 * Math.sqrt(3/4)) / Math.sqrt(3)
// For angles in between, interpolate
```

### Tile Spacing System

The X and Y gap controls add increasing spacing between tiles as they get further from the origin:
```typescript
const gapX = xGap * Math.abs(tile.q) / 1.25;
const gapY = yGap * Math.abs(tile.r) / 1.25;

const gapDirX = tile.q >= 0 ? 1 : -1;
const gapDirY = tile.r >= 0 ? 1 : -1;
```

This allows hex PNG tiles to be properly positioned for 45-degree isometric-style maps where vertical overlap needs to be adjusted.

### Custom Selection System

The biggest challenge was making the selection system match the visual appearance of tiles. We replaced Honeycomb's built-in pointToHex with a custom implementation:

```typescript
function customPointToHex(x: number, y: number): { q: number, r: number } | null {
  // Search nearby hexes, apply all the same offsets as rendering, and find closest
  // ...
}
```

This function:
1. Searches a radius around the clicked point
2. Applies the same gap/offset adjustments as rendering
3. Calculates the adjusted position of each hex
4. Returns the closest hex to the clicked point

## Optimal Settings

After extensive testing, these settings create the best alignment for the included hex PNG tiles:

- **Projection Angle**: 45°
- **Hex Size**: 138px
- **X Offset**: 0px
- **Y Offset**: 0px
- **Image Size**: 239px
- **X Gap**: 0px
- **Y Gap**: -32px

## Issues Encountered and Solutions

### 1. Grid/PNG Misalignment

**Problem**: The mathematical hex grid and the hex PNG tiles could never perfectly align, especially at map edges.

**Root Cause**: The mathematical grid uses perfect hexes, while the PNG artwork has custom proportions optimized for isometric view.

**Solution**: We created a custom selection system that matches visual tile positions rather than the mathematical grid.

### 2. Binding to Store Values

**Problem**: Error `store.set is not a function` when using the projection angle slider.

**Root Cause**: Using `bind:value={$uiStore.hexProjectionAngle}` tried to directly update the Svelte store.

**Solution**: Changed to use event handlers:
```svelte
<input 
  value={$uiStore.hexProjectionAngle} 
  on:input={(e) => uiStore.setHexProjectionAngle(Number(e.currentTarget.value))}
/>
```

### 3. Tile Rendering Order

**Problem**: Tiles in the foreground (bottom of the map) were being drawn behind tiles in the background.

**Root Cause**: Tiles were being rendered in arbitrary order based on the map store's iteration order.

**Solution**: Sort tiles by r-coordinate before rendering to ensure back-to-front drawing order:
```typescript
const tileArray = Array.from($mapStore.tiles.entries()).map(([key, tile]) => tile);
tileArray.sort((a, b) => a.r - b.r); // Sort by r coordinate, so top tiles render first
```

## Recommendations for Future Development

### 1. Consider a Custom Hex System

While our modifications to the Honeycomb grid library work well, if more complex customizations are needed, consider creating a custom hex grid system that's specifically designed for isometric-style maps.

### 2. Optimize the Selection Algorithm

The current `customPointToHex` implementation searches through nearby hexes, which works well but could be optimized for large maps. Consider a more direct mathematical approach if performance becomes an issue.

### 3. Persistence of Alignment Settings

The alignment settings (projection, gaps, etc.) should be stored with each map, as different maps might need different settings depending on their hex artwork.

### 4. Support for Stacked Tiles

The current implementation doesn't support stacking tiles in the same hex coordinate. This could be a useful feature for creating more complex maps (e.g., a bridge over water).

## Conclusion

The key insight from this development process is that isometric-style hex maps require a compromise between mathematical grid precision and visual aesthetics. Rather than trying to force one to match the other, we created a flexible system that allows fine-tuning of the visual appearance while maintaining the underlying hex grid structure for game mechanics.

The current implementation successfully aligns hex PNG tiles with each other while providing a consistent selection interface that matches what the user sees visually.