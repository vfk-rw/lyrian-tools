<script lang="ts">
  import { uiStore, EditMode } from '$lib/stores/uiStore';
  import { historyStore } from '$lib/stores/historyStore';
  
  // Tool definitions with icons and tooltips
  const tools = [
    { 
      mode: EditMode.SELECT, 
      icon: '👆', 
      label: 'Select',
      tooltip: 'Select tiles (S)'
    },
    { 
      mode: EditMode.PAINT, 
      icon: '🖌️', 
      label: 'Paint',
      tooltip: 'Paint tiles with selected asset (P)'
    },
    { 
      mode: EditMode.ERASE, 
      icon: '🧹', 
      label: 'Erase',
      tooltip: 'Erase tiles (E)'
    },
    { 
      mode: EditMode.REGION, 
      icon: '🏞️', 
      label: 'Region',
      tooltip: 'Create/edit regions (R)'
    },
    { 
      mode: EditMode.POI, 
      icon: '📍', 
      label: 'POI',
      tooltip: 'Add points of interest (I)'
    }
  ];
  
  // Toggle visibility options
  const toggleOptions = [
    {
      key: 'showGrid',
      label: 'Grid',
      tooltip: 'Toggle grid visibility (G)',
      toggle: () => uiStore.toggleGrid()
    },
    {
      key: 'showRegions',
      label: 'Regions',
      tooltip: 'Toggle region visibility',
      toggle: () => uiStore.toggleRegions()
    },
    {
      key: 'showPOIs',
      label: 'POIs',
      tooltip: 'Toggle POI visibility',
      toggle: () => uiStore.togglePOIs()
    }
  ];
  
  // File operations
  function newMap() {
    uiStore.toggleNewMapModal();
  }
  
  function importExport() {
    uiStore.toggleImportExportModal();
  }
  
  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    // Ignore key events when modifier keys are pressed (except for undo/redo)
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 's':
        if (!event.ctrlKey && !event.metaKey) {
          uiStore.setMode(EditMode.SELECT);
          event.preventDefault();
        }
        break;
      case 'p':
        uiStore.setMode(EditMode.PAINT);
        event.preventDefault();
        break;
      case 'e':
        uiStore.setMode(EditMode.ERASE);
        event.preventDefault();
        break;
      case 'r':
        uiStore.setMode(EditMode.REGION);
        event.preventDefault();
        break;
      case 'i':
        uiStore.setMode(EditMode.POI);
        event.preventDefault();
        break;
      case 'g':
        uiStore.toggleGrid();
        event.preventDefault();
        break;
      case 'z':
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
          historyStore.undo();
          event.preventDefault();
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
          historyStore.redo();
          event.preventDefault();
        }
        break;
      case 'y':
        if (event.ctrlKey || event.metaKey) {
          historyStore.redo();
          event.preventDefault();
        }
        break;
      case '0':
        if (event.ctrlKey || event.metaKey) {
          uiStore.resetView();
          event.preventDefault();
        }
        break;
    }
  }
  
  // Set up keyboard event listener
  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="toolbar">
  <div class="toolbar-section tools">
    <h3>Tools</h3>
    <div class="button-group">
      {#each tools as tool}
        <button 
          class="tool-button" 
          class:active={$uiStore.mode === tool.mode} 
          on:click={() => uiStore.setMode(tool.mode)}
          title={tool.tooltip}
        >
          <span class="icon">{tool.icon}</span>
          <span class="label">{tool.label}</span>
        </button>
      {/each}
    </div>
  </div>
  
  <div class="toolbar-section visibility">
    <h3>Visibility</h3>
    <div class="button-group">
      {#each toggleOptions as option}
        <button 
          class="toggle-button" 
          class:active={$uiStore[option.key as keyof typeof $uiStore]} 
          on:click={option.toggle}
          title={option.tooltip}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
  
  <div class="toolbar-section history">
    <h3>History</h3>
    <div class="button-group">
      <button 
        on:click={() => historyStore.undo()}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button 
        on:click={() => historyStore.redo()}
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
      >
        Redo
      </button>
    </div>
  </div>
  
  <div class="toolbar-section file">
    <h3>File</h3>
    <div class="button-group">
      <button on:click={newMap}>New</button>
      <button on:click={importExport}>Import/Export</button>
    </div>
  </div>
  
  <div class="toolbar-section view">
    <h3>View</h3>
    <div class="button-group">
      <button on:click={() => uiStore.resetView()} title="Reset view (Ctrl+0)">Reset View</button>
    </div>
  </div>
</div>

<style>
  .toolbar {
    background-color: #f0f0f0;
    border-bottom: 1px solid #ccc;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .toolbar-section {
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    font-size: 14px;
    margin: 0 0 5px 0;
    font-weight: bold;
  }
  
  .button-group {
    display: flex;
    gap: 5px;
  }
  
  button {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12px;
    min-width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  button:hover {
    background-color: #f5f5f5;
  }
  
  button.active {
    background-color: #e0e0e0;
    border-color: #999;
  }
  
  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5px;
    min-width: 60px;
  }
  
  .icon {
    font-size: 18px;
    margin-bottom: 3px;
  }
  
  .label {
    font-size: 11px;
  }
  
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      gap: 10px;
    }
    
    .button-group {
      flex-wrap: wrap;
    }
  }
</style>