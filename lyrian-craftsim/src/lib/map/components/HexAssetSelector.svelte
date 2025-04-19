<script lang="ts">
  import { onMount } from 'svelte';
  import { loadHexAssets, type HexAssetCategory, type HexAssetTile } from '../utils/assets';
  
  export let onSelectTile: (tile: HexAssetTile) => void = () => {};
  
  let hexCategories: HexAssetCategory[] = [];
  let selectedCategory: string | null = null;
  let searchTerm: string = '';
  let loading: boolean = true;
  let error: string | null = null;
  
  onMount(async () => {
    loading = true;
    try {
      hexCategories = await loadHexAssets();
      if (hexCategories.length > 0) {
        selectedCategory = hexCategories[0].name;
      }
    } catch (e) {
      error = 'Failed to load hex assets';
      console.error(error, e);
    } finally {
      loading = false;
    }
  });
  
  function handleSelectTile(tile: HexAssetTile) {
    onSelectTile(tile);
  }
  
  $: filteredTiles = selectedCategory 
    ? hexCategories
        .find(c => c.name === selectedCategory)?.tiles
        .filter(tile => !searchTerm || tile.name.toLowerCase().includes(searchTerm.toLowerCase())) || []
    : [];
</script>

<div class="hex-asset-selector">
  <div class="controls">
    <select bind:value={selectedCategory} disabled={loading}>
      {#each hexCategories as category}
        <option value={category.name}>{category.name}</option>
      {/each}
    </select>
    
    <input 
      type="text" 
      placeholder="Search tiles..." 
      bind:value={searchTerm}
      disabled={loading}
    />
  </div>
  
  {#if loading}
    <div class="loading">Loading hex assets...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if filteredTiles.length === 0}
    <div class="no-results">No tiles found</div>
  {:else}
    <div class="tiles-grid">
      {#each filteredTiles as tile}
        <div class="tile" on:click={() => handleSelectTile(tile)}>
          <img src={tile.path} alt={tile.name} loading="lazy" />
          <span class="tile-name">{tile.name}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hex-asset-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    height: 100%;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
  
  .controls select, .controls input {
    padding: 0.5rem;
  }
  
  .controls select {
    flex: 1;
  }
  
  .controls input {
    flex: 2;
  }
  
  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    max-height: 400px;
    padding: 0.5rem;
  }
  
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .tile:hover {
    background-color: rgba(0, 0, 0, 0.1);
    border-color: #aaa;
  }
  
  .tile img {
    width: 100%;
    height: auto;
    object-fit: contain;
  }
  
  .tile-name {
    font-size: 0.8rem;
    margin-top: 0.5rem;
    text-align: center;
    word-break: break-word;
    max-width: 100%;
  }
  
  .loading, .error, .no-results {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.2rem;
    color: #666;
  }
  
  .error {
    color: #e74c3c;
  }
</style>