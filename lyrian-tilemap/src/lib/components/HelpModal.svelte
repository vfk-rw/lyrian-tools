<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  
  // Control visibility of the modal
  let { isOpen = false, toggleHelp } = $props<{ isOpen?: boolean, toggleHelp: () => void }>();
  
  // Stop propagation to prevent clicks inside the modal from closing it
  function handleContentClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

{#if isOpen}
  <div 
    class="modal-overlay"
    onclick={() => toggleHelp()}
    transition:fade={{ duration: 150 }}
  >
    <div 
      class="modal-content"
      transition:scale={{ duration: 150, start: 0.95 }}
      onclick={handleContentClick}
    >
      <div class="modal-header">
        <h2 class="modal-title">Lyrian Tilemap Instructions</h2>
        <button 
          class="modal-close" 
          onclick={() => toggleHelp()}
        >
          &times;
        </button>
      </div>
      
      <div class="modal-body">
        <div class="instruction-section">
          <h3 class="section-title">Getting Started</h3>
          <p>
            Lyrian Tilemap is a tool for creating maps using terrain tiles. You can select tiles from the sidebar and place them on the grid.
          </p>
        </div>
        
        <div class="instruction-section">
          <h3 class="section-title">Basic Controls</h3>
          <ul class="control-list">
            <li><strong>Select a tile:</strong> Click on a tile in the sidebar</li>
            <li><strong>Place a tile:</strong> Click on a grid cell</li>
            <li><strong>Remove a tile:</strong> Right-click on a grid cell</li>
            <li><strong>Pan the map:</strong> Middle-click and drag</li>
            <li><strong>Zoom:</strong> Scroll wheel</li>
          </ul>
        </div>
        
        <div class="instruction-section">
          <h3 class="section-title">Saving & Loading</h3>
          <p>
            Use the toolbar buttons to save your current map or load a previously saved map. Maps are saved as JSON files.
          </p>
        </div>
        
        <div class="instruction-section">
          <h3 class="section-title">Resizing the Map</h3>
          <p>
            You can adjust the width and height of your map using the controls in the toolbar. Valid sizes are between 1 and 100.
          </p>
        </div>
        
        <div class="instruction-section">
          <h3 class="section-title">Layering Tiles</h3>
          <p>
            You can place multiple tiles in the same grid cell. They will stack on top of each other, with the newest tile on top.
            This is useful for adding features like rivers or buildings on top of terrain.
          </p>
        </div>
        
        <div class="credits">
          <p>
            Art assets by David Baumgart (dgbaumgart.com)
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Regular CSS without Tailwind import */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 42rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    max-height: 80vh;
    overflow: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  .modal-close {
    color: #6b7280;
    font-size: 1.5rem;
    line-height: 1;
  }
  
  .modal-close:hover {
    color: #374151;
  }
  
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: #374151;
  }
  
  .instruction-section {
    margin-bottom: 0.75rem;
  }
  
  .section-title {
    font-weight: 600;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }
  
  .control-list {
    list-style-type: disc;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .credits {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
</style>