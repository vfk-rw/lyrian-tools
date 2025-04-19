# Tile Alignment Guide

This document explains how to properly align and space the terrain tiles in the Lyrian Tilemap tool, particularly focusing on vertical alignment which can be tricky with terrain features like mountains.

## Optimal Tile Spacing

After careful testing, we determined the following optimal values for tile spacing:

- **Horizontal Spacing**: 256px (original tile size)
- **Vertical Spacing**: 171px (exactly 2/3 or 0.6679... of the original tile height)

These values ensure the bottom terrain of each tile lines up perfectly with the top features (mountains, sky) of the tiles below it.

## Technical Implementation

### Grid Cell Configuration

The grid cells are configured as follows:
- Cell width: 256px
- Cell height: 171px
- Tiles are positioned with the bottom edge of the PNG aligned to the bottom edge of the grid cell

### PNG Positioning

The key to proper alignment is positioning the 256px tall PNG images relative to the 171px tall grid cells:

```javascript
// Calculate vertical position offset for image in cell
function calculateVerticalOffset(): string {
  // originalTileSize (256) - optimalVerticalSpacing (171) = -85px offset from top
  // This aligns the bottom of the 256px tall PNG with the bottom of the 171px tall grid cell
  return `${optimalVerticalSpacing - originalTileSize}px`;
}
```

This places the PNG image at a negative offset of -85px from the top of each grid cell, making the bottom of the PNG align with the bottom of the grid cell.

## Gotchas and Solutions

### 1. PNG Overlapping Issue

**Problem**: Initially, the terrain tiles appeared to have their top portions (mountains, trees) cut off by the grid cells above them.

**Solution**: 
- Changed the grid cell's `overflow` property from `hidden` to `visible` to allow content to extend beyond the cell boundaries
- Made grid borders semi-transparent to better see the alignment issues

### 2. Finding the Exact Vertical Spacing Value

**Problem**: Finding the precise vertical spacing value for proper terrain alignment was difficult with the coarse slider.

**Solution**:
- Added fine-grained control with a 1px step size on the vertical spacing slider
- Through testing, we determined 171px (2/3 of 256px) is the mathematically optimal value

### 3. Tile Positioning

**Problem**: Initially, tiles were vertically centered in their grid cells, causing misalignment between terrain features.

**Solution**:
- Instead of centering, we position tiles so their bottom edges align with the bottom of their grid cells
- This ensures consistent terrain connections, as the bottom of one tile connects with the top of the tile below

### 4. Visual Debugging

To help with alignment debugging:
- We made the grid cells transparent with visible border lines
- Added coordinate display in grid cells for reference
- Set `overflow: visible` on grid cells to see the full extent of the PNG files

## Visual Guide

When tiles are properly aligned:
1. The bottom terrain of each tile should perfectly meet the tops of tiles below
2. Mountains and tall features from lower tiles should extend upward into the tiles above
3. No horizontal gaps should appear between adjacent tiles

## Browser Compatibility Note

Different browsers may render pixel-precise layouts slightly differently. If you notice alignment issues:

1. Try zooming your browser to 100% (standard zoom)
2. Ensure your browser is up to date
3. Check for any CSS transforms or scaling that might affect rendering