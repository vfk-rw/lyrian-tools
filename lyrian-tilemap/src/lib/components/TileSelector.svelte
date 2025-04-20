<script lang="ts">
  import { tileCategories, selectedTile, selectTile } from '$lib/stores/tileStore';
  import type { TileInfo } from '$lib/types';
  import '$lib/styles/tile-selector.css';
  
  // Prop to control whether the selector is expanded (for mobile views)
  let { expanded = true } = $props();
  
  // State for managing the active category
  let activeCategory = $state<string | null>(null);

  // When component mounts, select first category if available
  $effect(() => {
    if ($tileCategories.length > 0 && !activeCategory) {
      activeCategory = $tileCategories[0].name;
    }
  });
  
  // Handler for selecting a tile
  function handleTileClick(tile: TileInfo) {
    selectTile(tile);
  }
  
  // Handler for selecting a category
  function handleCategoryClick(name: string) {
    activeCategory = name;
  }
  
  // Check if a tile is a decoration (small) tile that should be displayed centered
  function isDecorationTile(tile: TileInfo): boolean {
    // Use the isSmall property if available (from server)
    if (tile.isSmall !== undefined) {
      return tile.isSmall;
    }
    
    // Fallback to checking the path or name for indicators that it's a small tile
    return tile.path.toLowerCase().includes('decoration') || 
           tile.path.toLowerCase().includes('house') ||
           (tile.name.length > 0 && (
             tile.name.toLowerCase().startsWith('house') || 
             tile.name.toLowerCase().includes('decoration')
           ));
  }
</script>

<div class="tile-selector {expanded ? 'expanded' : 'collapsed'} bg-gray-100 p-4 overflow-auto">
  <h2 class="text-xl font-bold mb-4">Tile Selector</h2>
  
  <!-- Categories tabs -->
  <div class="flex flex-wrap mb-4">
    {#each $tileCategories as category}
      <button 
        class="category-tab {activeCategory === category.name ? 'active' : ''}"
        onclick={() => handleCategoryClick(category.name)}
      >
        {category.name}
      </button>
    {/each}
  </div>
  
  <!-- Tiles grid -->
  <div class="grid grid-cols-3 gap-2">
    {#each $tileCategories.filter(c => c.name === activeCategory) as category}
      {#each category.tiles as tile}
        <div 
          class="tile-item {$selectedTile?.id === tile.id ? 'selected' : ''}"
          onclick={() => handleTileClick(tile)}
          role="button"
          tabindex="0"
        >
          <div class="tile-image-container {isDecorationTile(tile) ? 'decoration-tile' : ''}">
            <img 
              src={tile.path} 
              alt={tile.name}
              class="tile-image" 
              draggable="false"
              title={tile.width && tile.height ? `${tile.width}x{tile.height}px` : ''}
            />
          </div>
          <div class="tile-name" title={tile.name}>
            {tile.name}
            {#if tile.width && tile.height && tile.width !== 256 && isDecorationTile(tile)}
              <span class="tile-size">{tile.width}x{tile.height}</span>
            {/if}
          </div>
        </div>
      {/each}
    {/each}
  </div>
  
  <!-- No tiles message -->
  {#if $tileCategories.length === 0}
    <div class="text-center py-8 text-gray-500">
      No tiles available
    </div>
  {/if}
</div>