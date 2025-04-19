<script lang="ts">
  import { uiStore } from '$lib/stores/uiStore';
  import { mapStore, exportableMapData } from '$lib/stores/mapStore';
  import { historyStore } from '$lib/stores/historyStore';
  import { exportToYAML, importFromYAML } from '$lib/hexUtils/yamlIO';
  
  let yamlContent = '';
  let error = '';
  let exportSuccessful = false;
  let importSuccessful = false;
  let mode: 'import' | 'export' = 'export';
  
  // Generate YAML export when modal is opened or when map data changes
  $: if ($uiStore.isImportExportModalOpen && mode === 'export') {
    generateExport();
  }
  
  // Function to generate YAML export of current map
  async function generateExport() {
    try {
      yamlContent = exportToYAML($exportableMapData);
      error = '';
      exportSuccessful = true;
    } catch (err) {
      error = `Export error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      exportSuccessful = false;
    }
  }
  
  // Function to import YAML
  async function handleImport() {
    try {
      const mapData = importFromYAML(yamlContent);
      mapStore.importMapData(mapData);
      historyStore.pushState('Import map');
      historyStore.markSaved();
      error = '';
      importSuccessful = true;
    } catch (err) {
      error = `Import error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      importSuccessful = false;
    }
  }
  
  // Function to copy content to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(yamlContent);
      // Show temporary success message
      const tempMsg = error;
      error = 'Copied to clipboard!';
      setTimeout(() => {
        error = tempMsg;
      }, 2000);
    } catch (err) {
      error = `Copy failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }
  
  // Handle file upload for import
  function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      yamlContent = result;
    };
    
    reader.onerror = () => {
      error = 'Failed to read file';
    };
    
    reader.readAsText(file);
  }
  
  // Function to download YAML as file
  function downloadYAML() {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${$exportableMapData.name || 'map'}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Reset states when closing modal
  function handleClose() {
    error = '';
    exportSuccessful = false;
    importSuccessful = false;
    uiStore.toggleImportExportModal();
  }
</script>

{#if $uiStore.isImportExportModalOpen}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Import/Export Map</h2>
        <button class="close-button" on:click={handleClose}>×</button>
      </div>
      
      <div class="tab-buttons">
        <button 
          class:active={mode === 'export'} 
          on:click={() => mode = 'export'}
        >
          Export
        </button>
        <button 
          class:active={mode === 'import'} 
          on:click={() => mode = 'import'}
        >
          Import
        </button>
      </div>
      
      <div class="modal-content">
        {#if mode === 'export'}
          <p>Export your map as YAML to save or share it.</p>
          <div class="actions">
            <button on:click={copyToClipboard}>Copy to Clipboard</button>
            <button on:click={downloadYAML}>Download YAML</button>
          </div>
          <textarea 
            class="yaml-content" 
            bind:value={yamlContent} 
            readonly
            placeholder="YAML content will appear here..."
          ></textarea>
          
        {:else if mode === 'import'}
          <p>Paste YAML content below or upload a YAML file to import.</p>
          <div class="file-upload">
            <input 
              type="file" 
              accept=".yaml,.yml" 
              on:change={handleFileUpload}
            />
          </div>
          <textarea 
            class="yaml-content" 
            bind:value={yamlContent} 
            placeholder="Paste YAML content here..."
          ></textarea>
          <div class="actions">
            <button on:click={handleImport}>Import Map</button>
          </div>
          {#if importSuccessful}
            <div class="success-message">Map imported successfully!</div>
          {/if}
        {/if}
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 80%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  h2 {
    margin: 0;
    font-size: 20px;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    color: #888;
  }
  
  .close-button:hover {
    color: #333;
  }
  
  .tab-buttons {
    display: flex;
    border-bottom: 1px solid #eee;
  }
  
  .tab-buttons button {
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    flex: 1;
    font-size: 16px;
  }
  
  .tab-buttons button.active {
    border-bottom-color: #0066cc;
    color: #0066cc;
    background-color: #f5f5f5;
  }
  
  .modal-content {
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex: 1;
  }
  
  .yaml-content {
    width: 100%;
    height: 300px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-family: monospace;
    resize: vertical;
    white-space: pre;
    overflow: auto;
  }
  
  .actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  
  button {
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #0055aa;
  }
  
  .error-message {
    color: #d32f2f;
    padding: 10px;
    border: 1px solid #ef9a9a;
    background-color: #ffebee;
    border-radius: 4px;
  }
  
  .success-message {
    color: #388e3c;
    padding: 10px;
    border: 1px solid #a5d6a7;
    background-color: #e8f5e9;
    border-radius: 4px;
  }
  
  .file-upload {
    margin: 10px 0;
  }
</style>