<script lang="ts">
  import { onMount } from 'svelte';
  import { loadHexAssets, type HexAssetCategory, type HexAsset } from '$lib/hexUtils/assets';

  let categories: HexAssetCategory[] = [];
  let loading = true;
  let error = '';
  let selectedCategory: string | null = null;

  onMount(async () => {
    try {
      loading = true;
      categories = await loadHexAssets();
      if (categories.length > 0) {
        selectedCategory = categories[0].name;
      }
    } catch (err) {
      error = 'Failed to load hex assets: ' + (err instanceof Error ? err.message : String(err));
      console.error(err);
    } finally {
      loading = false;
    }
  });

  function selectCategory(categoryName: string) {
    selectedCategory = categoryName;
  }

  function getAssetsForSelectedCategory(): HexAsset[] {
    if (!selectedCategory) return [];
    const category = categories.find(c => c.name === selectedCategory);
    return category?.assets || [];
  }
</script>

<svelte:head>
  <title>Hex Assets Viewer</title>
</svelte:head>

<div class="container">
  <h1>Hex Assets Viewer</h1>

  {#if loading}
    <div class="loading">Loading hex assets...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if categories.length === 0}
    <div class="error">No hex assets found.</div>
  {:else}
    <div class="layout">
      <div class="categories">
        <h2>Categories</h2>
        <ul>
          {#each categories as category}
            <li class:selected={selectedCategory === category.name}>
              <button on:click={() => selectCategory(category.name)}>
                {category.name} ({category.assets.length})
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <div class="assets">
        <h2>{selectedCategory || 'Select a category'}</h2>
        <div class="grid">
          {#each getAssetsForSelectedCategory() as asset}
            <div class="asset-card">
              <div class="image-container">
                <img src={asset.path} alt={asset.name} loading="lazy" />
              </div>
              <div class="asset-info">
                <div class="asset-name" title={asset.name}>{asset.name}</div>
                <div class="asset-id" title={asset.id}>{asset.id}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
  }

  .error {
    color: #d32f2f;
  }

  .layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }

  .categories {
    border-right: 1px solid #ccc;
  }

  .categories ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .categories li {
    margin-bottom: 0.5rem;
  }

  .categories li button {
    width: 100%;
    text-align: left;
    padding: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .categories li button:hover {
    background-color: #f5f5f5;
  }

  .categories li.selected button {
    background-color: #e0f7fa;
    font-weight: bold;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .asset-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
  }

  .asset-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  .image-container {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
  }

  .image-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .asset-info {
    padding: 0.75rem;
  }

  .asset-name {
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .asset-id {
    font-size: 0.8rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.25rem;
  }
</style>