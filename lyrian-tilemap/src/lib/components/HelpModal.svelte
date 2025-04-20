<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import '$lib/styles/help-modal.css';
  
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