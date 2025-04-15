<script lang="ts">
  import { uiStore, selectTool, selectBiome, selectHeight, selectIcon, toggleRegionLabels, togglePOILabels, toggleHeightLabels, toggleRouteLabels, showModal, BIOME_TYPES } from '$lib/map/stores/uiStore';
  import { mapData, removeRegion } from '$lib/map/stores/mapStore';
  import { routesData, removeRoute, toggleRouteVisibility, toggleRouteEditMode, exitAllEditModes, getRouteLengthInDays, exportRoutesJSON, importRoutesJSON } from '$lib/map/stores/routeStore';
  import { iconRegistry, filterIcons, filterIconsByCategory } from '$lib/map/utils/iconRegistry';
  import type { IconInfo } from '$lib/map/utils/iconRegistry';
  import '$lib/styles/toolbar.css';
  
  // Color mapping for biomes
  const BIOME_COLORS: Record<string, string> = {
    plains: '#91C13D',    // light green
    forest: '#2C7C30',    // dark green
    mountain: '#8B4513',  // brown
    water: '#1E90FF',     // blue
    desert: '#F4D03F',    // yellow
    swamp: '#556B2F',     // olive
    tundra: '#F0F0F0',    // white
    unexplored: '#cccccc', // gray/unexplored
  };
  
  // Height values
  const HEIGHT_OPTIONS = [0, 1, 2, 3];
  
  // Tool descriptions
  const TOOL_DESCRIPTIONS: Record<string, string> = {
    select: 'Select tiles to form regions',
    biome: 'Paint different terrain types',
    height: 'Adjust elevation of tiles',
    poi: 'Add points of interest',
    region: 'Select tiles then create or edit regions',
    icon: 'Add map icons to tiles',
    route: 'Create routes with waypoints on the map'
  };
  
  // Icon search and filtering
  let iconSearchTerm = '';
  let filteredIcons: IconInfo[] = [];
  
  // Category selection for icons
  let activeIconCategory = 'animal';
  
  // Update filtered icons when search term or category changes
  $: {
    if (iconSearchTerm) {
      filteredIcons = filterIcons(iconRegistry, iconSearchTerm);
    } else {
      filteredIcons = filterIconsByCategory(iconRegistry, activeIconCategory);
    }
  }
  
  // Clear an icon selection
  function clearIconSelection() {
    selectIcon(null);
  }
  
  // Get current tool description
  $: toolDescription = TOOL_DESCRIPTIONS[$uiStore.currentTool] || '';
  
  // Handle tool selection
  function handleToolSelect(tool: string): void {
    selectTool(tool as any);
  }
  
  // Handle biome selection
  function handleBiomeSelect(biome: string): void {
    selectBiome(biome);
  }
  
  // Handle height selection
  function handleHeightSelect(height: number): void {
    selectHeight(height);
  }
</script>


<div class="toolbar">
  <section class="toolbar-section">
    <h3>Tools</h3>
    <div class="tools-grid">
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'select'}
        on:click={() => handleToolSelect('select')}
        title="Select Tool"
      >
        <span class="tool-icon">🖱️</span>
        <span class="tool-label">Select</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'biome'}
        on:click={() => handleToolSelect('biome')}
        title="Biome Paint Tool"
      >
        <span class="tool-icon">🖌️</span>
        <span class="tool-label">Biome</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'height'}
        on:click={() => handleToolSelect('height')}
        title="Height Tool"
      >
        <span class="tool-icon">⛰️</span>
        <span class="tool-label">Height</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'poi'}
        on:click={() => handleToolSelect('poi')}
        title="POI Tool"
      >
        <span class="tool-icon">📍</span>
        <span class="tool-label">POI</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'region'}
        on:click={() => handleToolSelect('region')}
        title="Region Tool"
      >
        <span class="tool-icon">🔷</span>
        <span class="tool-label">Region</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'icon'}
        on:click={() => handleToolSelect('icon')}
        title="Icon Tool"
      >
        <span class="tool-icon">🏷️</span>
        <span class="tool-label">Icon</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'route'}
        on:click={() => handleToolSelect('route')}
        title="Route Tool"
      >
        <span class="tool-icon">🧭</span>
        <span class="tool-label">Route</span>
      </button>
      
    </div>
    
    <div class="tool-description">
      {toolDescription}
    </div>
  </section>
  
  {#if $uiStore.currentTool === 'biome'}
    <section class="toolbar-section">
      <h3>Biome Types</h3>
      <div class="biome-grid">
        {#each BIOME_TYPES as biome}
          <button 
            class="biome-button" 
            class:active={$uiStore.selectedBiome === biome}
            style:background-color={BIOME_COLORS[biome]}
            on:click={() => handleBiomeSelect(biome)}
            title={biome.charAt(0).toUpperCase() + biome.slice(1)}
            aria-label={biome.charAt(0).toUpperCase() + biome.slice(1)}
          >
          </button>
        {/each}
      </div>
      <div class="selected-biome">
        Selected: {$uiStore.selectedBiome}
      </div>
    </section>
  {/if}
  
  {#if $uiStore.currentTool === 'height'}
    <section class="toolbar-section">
      <h3>Height</h3>
      <div class="height-grid">
        {#each HEIGHT_OPTIONS as height}
          <button 
            class="height-button" 
            class:active={$uiStore.selectedHeight === height}
            on:click={() => handleHeightSelect(height)}
            title={height === 0 ? 'Flat' : `Elevation ${height}`}
          >
            {height}
          </button>
        {/each}
      </div>
      <div class="selected-height">
        Selected Height: {$uiStore.selectedHeight}
      </div>
    </section>
  {/if}
  
  {#if $uiStore.currentTool === 'icon'}
    <section class="toolbar-section">
      <h3>Icon Tool</h3>
      
      <!-- Search bar -->
      <div class="search-container">
        <input 
          type="text" 
          bind:value={iconSearchTerm} 
          placeholder="Search icons..." 
          class="search-input"
        />
      </div>
      
      <!-- Category tabs -->
      <div class="category-tabs">
        {#each iconRegistry.categories as category}
          <button 
            class="category-tab"
            class:active={activeIconCategory === category.name}
            on:click={() => {
              activeIconCategory = category.name;
              iconSearchTerm = '';
            }}
          >
            {category.name}
          </button>
        {/each}
      </div>
      
      <!-- Icon grid -->
      <div class="icon-grid">
        <!-- Clear icon button -->
        <button 
          class="icon-button clear-icon"
          class:active={$uiStore.selectedIcon === null}
          on:click={clearIconSelection}
          title="No icon"
        >
          <span class="clear-icon-text">✕</span>
        </button>
        
        {#each filteredIcons as icon}
          <button 
            class="icon-button"
            class:active={$uiStore.selectedIcon === icon.path}
            on:click={() => selectIcon(icon.path)}
            title={icon.name}
          >
            <img src={icon.path} alt={icon.name} class="icon-preview" />
          </button>
        {/each}
      </div>
      
      {#if filteredIcons.length === 0 && iconSearchTerm}
        <div class="no-results">No icons found matching "{iconSearchTerm}"</div>
      {/if}
      
      {#if $uiStore.selectedIcon}
        <div class="selected-icon">
          <div class="selected-icon-label">Selected icon:</div>
          <div class="selected-icon-preview">
            <img src={$uiStore.selectedIcon} alt="Selected icon" class="icon-preview-large" />
          </div>
        </div>
      {:else}
        <div class="selected-icon">
          <div class="selected-icon-label">No icon selected</div>
          <div class="selected-icon-preview empty">
            <span class="no-icon">✕</span>
          </div>
        </div>
      {/if}
    </section>
  {/if}
  
  {#if $uiStore.currentTool === 'route'}
    <section class="toolbar-section">
      <h3>Route Tool</h3>
      <div class="route-actions">
        <button 
          class="action-button" 
          on:click={() => showModal({ type: 'route' })}
          title="Create a new route"
        >
          <span class="action-icon">➕</span>
          <span class="action-label">Create Route</span>
        </button>
        
        <button 
          class="action-button secondary" 
          on:click={() => exitAllEditModes()}
          title="Exit edit mode"
          disabled={!Array.from($routesData.routes.values()).some(r => r.editable)}
        >
          <span class="action-icon">✓</span>
          <span class="action-label">Exit Edit Mode</span>
        </button>
        
        <div class="help-text">
          Create a route, then click on tiles to add waypoints
        </div>
      </div>
    </section>
    
    <!-- Route List -->
    <section class="toolbar-section">
      <h3>Routes</h3>
      <div class="route-list">
        {#if $routesData.routes.size === 0}
          <div class="no-routes">No routes created yet</div>
        {:else}
          {#each Array.from($routesData.routes.values()) as route (route.id)}
            <div class="route-list-item" class:editing={route.editable}>
              <div class="route-color" style:background-color={route.color}></div>
              <div class="route-info">
                <div class="route-name">{route.name}</div>
                <div class="route-stats">
                  {route.waypoints.length} waypoints
                  {#if getRouteLengthInDays(route.id) > 0}
                    | {getRouteLengthInDays(route.id)} days
                  {/if}
                </div>
              </div>
              <button 
                class="route-toggle" 
                on:click={() => toggleRouteVisibility(route.id)}
                title={route.visible ? "Hide route" : "Show route"}
              >
                {route.visible ? '👁️' : '👁️‍🗨️'}
              </button>
              <button 
                class="route-edit" 
                on:click={() => toggleRouteEditMode(route.id)}
                title={route.editable ? "Stop editing" : "Edit route"}
                class:active={route.editable}
              >
                ✏️
              </button>
              <button 
                class="route-delete" 
                on:click={() => removeRoute(route.id)}
                title="Delete route"
              >
                🗑️
              </button>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="import-export-buttons">
        <button 
          class="action-button secondary small" 
          on:click={() => {
            // Create a JSON representation of the routes
            const jsonData = exportRoutesJSON();
            const jsonString = JSON.stringify(jsonData, null, 2);
            
            // Create a blob and download it
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `routes.json`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
          title="Export routes"
          disabled={$routesData.routes.size === 0}
        >
          Export Routes
        </button>
        
        <button 
          class="action-button secondary small" 
          on:click={() => {
            // Create a file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement)?.files?.[0];
              if (!file) return;
              
              // Check file size limit before processing
              const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - same as map validation
              if (file.size > MAX_FILE_SIZE) {
                alert(`File too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
                return;
              }
              
              // Check MIME type to ensure it's a text file
              if (!file.type.match('application/json') && 
                  !file.type.match('text/plain') && 
                  !file.type.match('text/')) {
                alert('Invalid file type. Only JSON and text files are supported.');
                return;
              }
              
              // Read the file
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                try {
                  // Parse the JSON
                  const jsonData = JSON.parse(readerEvent.target?.result as string);
                  
                  // Import the routes with file size for validation
                  const success = importRoutesJSON(jsonData, file.size);
                  
                  if (success) {
                    alert('Routes imported successfully');
                  } else {
                    alert('Failed to import routes - invalid format');
                  }
                } catch (error) {
                  console.error('Error importing routes:', error);
                  alert('Failed to import routes - invalid JSON');
                }
              };
              
              reader.onerror = () => {
                alert('Error reading file. Please try again with a different file.');
              };
              
              reader.readAsText(file);
            };
            
            // Trigger the file input
            input.click();
          }}
          title="Import routes"
        >
          Import Routes
        </button>
      </div>
    </section>
  {/if}
  
  {#if $uiStore.currentTool === 'region'}
    <section class="toolbar-section">
      <h3>Region Tool</h3>
      <div class="region-actions">
        <button 
          class="action-button" 
          disabled={$uiStore.selectedTiles.length === 0}
          on:click={() => showModal({ type: 'region' })}
          title="Create a new region with selected tiles"
        >
          <span class="action-icon">➕</span>
          <span class="action-label">Create Region</span>
        </button>
        
        <div class="selected-count">
          {$uiStore.selectedTiles.length} tiles selected
        </div>
        
        <div class="help-text">
          Select tiles then create a region
        </div>
      </div>
    </section>
    
    <!-- Region List -->
    <section class="toolbar-section">
      <h3>Existing Regions</h3>
      <div class="region-list">
        {#if $mapData.regions.size === 0}
          <div class="no-regions">No regions created yet</div>
        {:else}
          {#each Array.from($mapData.regions.values()) as region (region.id)}
            <div class="region-list-item">
              <div class="region-color" style:background-color={region.color}></div>
              <div class="region-name">{region.name}</div>
              <button 
                class="region-delete" 
                on:click={() => removeRegion(region.id)}
                title="Delete region"
              >
                🗑️
              </button>
              <button 
                class="region-edit" 
                on:click={() => showModal({ type: 'region', regionId: region.id })}
                title="Edit region"
              >
                ✏️
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </section>
  {/if}
  
  <section class="toolbar-section">
    <h3>Display Options</h3>
    <div class="display-options">
      <button 
        class="option-button" 
        class:active={$uiStore.showRegionLabels}
        on:click={() => toggleRegionLabels()}
        title="Show/Hide Region Labels"
      >
        <span class="option-icon">🏷️</span>
        <span class="option-label">Region Labels</span>
      </button>
      
      <button 
        class="option-button" 
        class:active={$uiStore.showPOILabels}
        on:click={() => togglePOILabels()}
        title="Show/Hide POI Labels"
      >
        <span class="option-icon">📍</span>
        <span class="option-label">POI Labels</span>
      </button>
      
      <button 
        class="option-button" 
        class:active={$uiStore.showHeightLabels}
        on:click={() => toggleHeightLabels()}
        title="Show/Hide Height Labels"
      >
        <span class="option-icon">⛰️</span>
        <span class="option-label">Height Labels</span>
      </button>
      
      <button 
        class="option-button" 
        class:active={$uiStore.showRouteLabels}
        on:click={() => toggleRouteLabels()}
        title="Show/Hide Route Date Labels"
      >
        <span class="option-icon">🧭</span>
        <span class="option-label">Route Labels</span>
      </button>
    </div>
  </section>
  
  <section class="toolbar-section instructions">
    <h3>Instructions</h3>
    <ul class="instruction-list">
      <li>Pan: Alt+Drag or Middle Mouse</li>
      <li>Zoom: Mouse Wheel</li>
      <li>Select: Click tiles</li>
      <li>Add POI: Choose POI tool and click</li>
    </ul>
  </section>
</div>
