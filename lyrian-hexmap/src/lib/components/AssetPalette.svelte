<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore, EditMode } from '$lib/stores/uiStore';
  import { loadHexAssets, type HexAssetCategory, type HexAsset } from '$lib/hexUtils/assets';
  
  // State for asset categories and loading status
  let assetCategories: HexAssetCategory[] = [];
  let selectedCategory: string | null = null;
  let isLoading = true;
  let searchQuery = '';
  
  // Load assets when component mounts
  onMount(async () => {
    try {
      console.log("Loading hex assets...");
      // Load and organize assets
      assetCategories = await loadHexAssets();
      console.log("Asset categories loaded:", assetCategories);
      
      isLoading = false;
      
      // Select first category by default if available
      if (assetCategories.length > 0) {
        selectedCategory = assetCategories[0].name;
        console.log("Selected category:", selectedCategory);
      } else {
        console.warn("No asset categories found!");
      }
    } catch (error) {
      console.error("Error loading assets:", error);
      isLoading = false;
    }
  });
  
  // Handle asset selection
  function selectAsset(asset: HexAsset) {
    uiStore.setSelectedAsset(asset.id);
    uiStore.setMode(EditMode.PAINT);
  }
  
  // Filter assets by search query
  $: filteredAssets = searchQuery.trim() 
    ? assetCategories.flatMap(category => category.assets)
        .filter(asset => 
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          asset.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];
  
  // Get assets for the currently selected category
  $: categoryAssets = selectedCategory 
    ? assetCategories.find(c => c.name === selectedCategory)?.assets || [] 
    : [];
  
  // Whether to show search results or category view
  $: showSearchResults = searchQuery.trim() !== '';
</script>

<div class="asset-palette">
  <div class="palette-header">
    <h3>Assets</h3>
    <div class="search">
      <input 
        type="text" 
        placeholder="Search assets..." 
        bind:value={searchQuery}
      />
    </div>
  </div>
  
  {#if isLoading}
    <div class="loading">Loading assets...</div>
  {:else}
    <!-- Category tabs -->
    {#if !showSearchResults}
      <div class="category-tabs">
        {#each assetCategories as category}
          <button 
            class="category-tab" 
            class:active={selectedCategory === category.name}
            on:click={() => selectedCategory = category.name}
          >
            {category.name}
          </button>
        {/each}
      </div>
      
      <!-- Category assets -->
      <div class="asset-grid">
        {#each categoryAssets as asset}
          <div 
            class="asset-tile" 
            class:selected={$uiStore.selectedAssetId === asset.id}
            on:click={() => selectAsset(asset)}
            title={asset.name}
          >
            <img src={asset.path} alt={asset.name} />
          </div>
        {/each}
      </div>
    {:else}
      <!-- Search results -->
      <div class="search-results">
        <h4>Search Results ({filteredAssets.length})</h4>
        <div class="asset-grid">
          {#each filteredAssets as asset}
            <div 
              class="asset-tile" 
              class:selected={$uiStore.selectedAssetId === asset.id}
              on:click={() => selectAsset(asset)}
              title={`${asset.category}: ${asset.name}`}
            >
              <img src={asset.path} alt={asset.name} />
              <div class="asset-name">{asset.name}</div>
            </div>
          {/each}
        </div>
        
        {#if filteredAssets.length === 0}
          <div class="no-results">No assets match your search.</div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .asset-palette {
    background-color: #f5f5f5;
    border-left: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  
  .palette-header {
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
  }
  
  h4 {
    margin: 10px;
    font-size: 14px;
  }
  
  .search {
    width: 100%;
  }
  
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .loading {
    padding: 20px;
    text-align: center;
    color: #666;
  }
  
  .category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    overflow-x: auto;
  }
  
  .category-tab {
    background-color: #e0e0e0;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }
  
  .category-tab.active {
    background-color: #fff;
    border-color: #999;
  }
  
  .asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
    gap: 10px;
    padding: 10px;
    overflow-y: auto;
    flex-grow: 1;
  }
  
  .asset-tile {
    background-color: #fff;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .asset-tile:hover {
    border-color: #999;
  }
  
  .asset-tile.selected {
    border-color: #0066cc;
  }
  
  .asset-tile img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .asset-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 10px;
    padding: 2px 4px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .no-results {
    padding: 20px;
    text-align: center;
    color: #666;
  }
  
  .search-results {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow: hidden;
  }
</style>