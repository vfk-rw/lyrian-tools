<script lang="ts">
  import { tileCategories, selectedTile, selectTile } from '$lib/stores/tileStore';
  import type { TileInfo } from '$lib/types';
  
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
          <img 
            src={tile.path} 
            alt={tile.name} 
            class="w-full object-contain"
            draggable="true" 
          />
          <div class="tile-name" title={tile.name}>
            {tile.name}
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

<style>
  /* Regular CSS without Tailwind reference */
  .tile-selector {
    height: 100%;
    width: 300px;
    transition: width 0.3s ease;
    background-color: #f3f4f6;
    padding: 1rem;
    overflow: auto;
  }
  
  .tile-selector.collapsed {
    width: 80px;
  }
  
  .text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  
  .font-bold {
    font-weight: 700;
  }
  
  .mb-4 {
    margin-bottom: 1rem;
  }
  
  .flex {
    display: flex;
  }
  
  .flex-wrap {
    flex-wrap: wrap;
  }
  
  .grid {
    display: grid;
  }
  
  .grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  
  .gap-2 {
    gap: 0.5rem;
  }
  
  .category-tab {
    padding: 0.25rem 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    background-color: #e5e7eb;
  }
  
  .category-tab:hover {
    background-color: #d1d5db;
  }
  
  .category-tab.active {
    background-color: #2563eb;
    color: white;
  }
  
  .tile-item {
    position: relative;
    padding: 0.25rem;
    border: 2px solid transparent;
    cursor: pointer;
    aspect-ratio: 1/1;
  }
  
  .tile-item:hover {
    border-color: #d1d5db;
  }
  
  .tile-item.selected {
    border-color: #3b82f6;
  }
  
  .w-full {
    width: 100%;
  }
  
  .object-contain {
    object-fit: contain;
  }
  
  .tile-name {
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 0.25rem;
  }
  
  .text-center {
    text-align: center;
  }
  
  .py-8 {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
</style>