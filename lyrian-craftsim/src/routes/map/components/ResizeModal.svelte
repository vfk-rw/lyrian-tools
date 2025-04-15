<script lang="ts">
  import { uiStore, closeModal } from '$lib/map/stores/uiStore';
  import { mapData, generateHexGrid } from '$lib/map/stores/mapStore';
  import { getHexesInRange } from '$lib/map/utils/hexlib';
  
  // Calculate current map dimensions
  $: tiles = Array.from($mapData.tiles.values());
  $: minQ = Math.min(...tiles.map(t => t.q));
  $: maxQ = Math.max(...tiles.map(t => t.q));
  $: minR = Math.min(...tiles.map(t => t.r));
  $: maxR = Math.max(...tiles.map(t => t.r));
  
  // Map width and height (in tiles)
  $: currentWidth = maxQ - minQ + 1;
  $: currentHeight = maxR - minR + 1;
  
  // Get the max dimension (this is the "radius" of the hex grid)
  $: currentRadius = Math.max(
    Math.abs(minQ), 
    Math.abs(maxQ), 
    Math.abs(minR), 
    Math.abs(maxR),
    Math.abs(-minQ-minR),
    Math.abs(-maxQ-maxR)
  );
  
  // Bind to inputs
  let newWidth = currentWidth;
  let newHeight = currentHeight;
  let newRadius = currentRadius;
  
  // Handle map resize
  function handleResize() {
    // Generate new map with updated radius
    generateHexGrid(newRadius);
    closeModal();
  }
  
  // Clear all tiles outside the specified radius
  function handleTrim() {
    // Get all tiles within the new radius
    const validTiles = getHexesInRange(0, 0, newRadius);
    const validTileKeys = new Set(validTiles.map(([q, r]) => `${q},${r}`));
    
    // Update map data by filtering out tiles outside the radius
    $mapData.tiles.forEach((tile, key) => {
      if (!validTileKeys.has(key)) {
        $mapData.tiles.delete(key);
      }
    });
    
    // Also remove these tiles from any regions
    $mapData.regions.forEach(region => {
      region.tiles = region.tiles.filter(([q, r]) => {
        return validTileKeys.has(`${q},${r}`);
      });
    });
    
    // Trigger reactivity
    $mapData = $mapData;
    
    closeModal();
  }
</script>

{#if $uiStore.showModal && $uiStore.modalParams?.type === 'resize'}
  <div class="modal-backdrop">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Resize Map</h2>
        <button class="close-button" on:click={closeModal}>✕</button>
      </div>
      
      <div class="modal-content">
        <div class="info-section">
          <p>Current map dimensions: {currentWidth}×{currentHeight} tiles</p>
          <p>Current map radius: {currentRadius} tiles from center</p>
        </div>
        
        <div class="form-group">
          <label for="radius">Map Radius (from center):</label>
          <input 
            type="number" 
            id="radius" 
            bind:value={newRadius} 
            min="1" 
            max="20"
          />
          <p class="helper-text">This controls how many tiles extend from the center point in all directions.</p>
        </div>
        
        <div class="actions">
          <button class="action-button grow" on:click={handleResize}>
            <span class="icon">↔️</span>
            <span>Regenerate Map</span>
          </button>
          
          <button class="action-button trim" on:click={handleTrim}>
            <span class="icon">✂️</span>
            <span>Trim to Radius</span>
          </button>
        </div>
        
        <div class="info-message">
          <p><strong>Note:</strong></p>
          <ul>
            <li>"Regenerate Map" will create a new map with the specified radius, replacing the current one.</li>
            <li>"Trim to Radius" will remove tiles outside the specified radius, keeping the existing tiles inside that radius.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-container {
    background-color: #2a2a2a;
    color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #333;
    border-bottom: 1px solid #444;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }
  
  .close-button:hover {
    color: white;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .info-section {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background-color: #333;
    border-radius: 6px;
  }
  
  .info-section p {
    margin: 0.5rem 0;
    color: #ddd;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ccc;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #444;
    background-color: #333;
    color: white;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .helper-text {
    font-size: 0.85rem;
    color: #999;
    margin: 0.25rem 0 0;
  }
  
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .action-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-button .icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .grow {
    background-color: #4CAF50;
  }
  
  .grow:hover {
    background-color: #3a8a3e;
  }
  
  .trim {
    background-color: #f44336;
  }
  
  .trim:hover {
    background-color: #d32f2f;
  }
  
  .info-message {
    background-color: #333;
    padding: 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .info-message p {
    margin: 0 0 0.5rem;
  }
  
  .info-message ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  
  .info-message li {
    margin-bottom: 0.5rem;
    color: #ccc;
  }
</style>
