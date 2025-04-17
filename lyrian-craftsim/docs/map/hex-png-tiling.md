# Hex PNG Tile Tiling Guide

This document explains how to correctly tile hex PNG images (256x384 pixels) on a pointy-topped hex grid, ensuring perfect alignment and seamless map rendering.

---

## Tile Image Details

- **Image Size:** 256 pixels wide by 384 pixels tall.
- **Hex Portion:** The bottom 256x256 pixels represent the actual hex tile shape.
- **Top Portion:** The top 128 pixels are reserved for large features such as mountains, trees, or other decorations that extend above the hex tile.

---

## Anchor Point

- The **anchor point** for each tile is the **bottom center** of the PNG image.
- This point corresponds exactly to the center of the hex tile on the grid.
- When positioning tiles, this anchor point is used to align the image correctly on the map.

---

## Grid Layout Calculations

### Horizontal Spacing

- The horizontal distance between the centers of adjacent hex tiles is exactly **256 pixels** (the width of the PNG).
- For every other row (odd rows), tiles are horizontally offset by **128 pixels** (half the tile width) to create the staggered hex pattern.

### Vertical Spacing

- The vertical distance between the centers of hex tiles in adjacent rows is approximately:

  ```
  256 * sqrt(3) / 2 ≈ 221.7 pixels
  ```

- However, because the PNG image extends 128 pixels above the hex tile, the vertical spacing between the **top edges** of the images is reduced by **64 pixels** to avoid gaps.

---

## Positioning Formula

For a tile at grid coordinates `(q, r)`:

- **X position:**

  ```
  x = q * 256 + (r % 2) * 128
  ```

- **Y position:**

  ```
  y = r * 221.7 + 128  - 64
  ```

  Where:
  - `221.7` is the vertical spacing between hex centers.
  - `128` is half the PNG height (to position the anchor point).
  - `64` is the vertical gap adjustment to reduce spacing between tiles.

---

## Drawing the Tile

- Draw the PNG image at:

  ```
  drawX = x
  drawY = y - 384 + 128
  ```

- This positions the image so that the **bottom center** (anchor point) aligns with `(x, y)`.

---

## Visual Aids

- The **red dot** marks the hex tile center (anchor point).
- The **blue rectangle** outlines the full 256x384 PNG image.
- These guides help verify correct alignment during development.

---

## Summary

- Use exact pixel values for spacing and offsets (no percentages).
- Anchor point is bottom center of the PNG.
- Horizontal spacing = 256px.
- Vertical spacing = 221.7px (hex center to center).
- Adjust vertical position by subtracting 64px to close gaps.
- Offset odd rows horizontally by 128px.

---

This method ensures seamless tiling of hex PNG images on a pointy-topped hex grid with correct alignment and no gaps or overlaps.
