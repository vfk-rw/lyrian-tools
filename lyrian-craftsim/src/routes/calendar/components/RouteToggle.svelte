<script lang="ts">
  import { routesData, toggleRouteVisibility } from '$lib/map/stores/routeStore';
  
  // Search filter
  let searchTerm = '';
  
  // Sorting function for routes (alphabetical)
  function sortRoutes(a: [string, any], b: [string, any]) {
    return a[1].name.localeCompare(b[1].name);
  }
  
  // Filter routes based on search term
  $: filteredRoutes = searchTerm 
    ? Array.from($routesData.routes).filter(([_, route]) => 
        route.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : Array.from($routesData.routes);
  
  // Sort routes after filtering
  $: sortedFilteredRoutes = [...filteredRoutes].sort(sortRoutes);
</script>

<div class="route-toggle-container">
  <h2>Routes</h2>
  
  <!-- Search input -->
  <div class="search-container">
    <input 
      type="text" 
      class="search-input" 
      placeholder="Search routes..."
      bind:value={searchTerm}
    />
  </div>
  
  {#if $routesData.routes.size === 0}
    <div class="empty-state">
      <p>No routes available.</p>
      <p>Import routes from the map or create demo routes.</p>
    </div>
  {:else if sortedFilteredRoutes.length === 0}
    <div class="empty-state">
      <p>No routes match your search.</p>
    </div>
  {:else}
    <div class="routes-list">
      {#each sortedFilteredRoutes as [id, route] (id)}
        <div class="route-item">
          <div class="route-color" style="background-color: {route.color}"></div>
          
          <div class="route-info">
            <div class="route-name">{route.name}</div>
            
            <div class="route-meta">
              <!-- Display first and last waypoint dates if available -->
              {#if route.waypoints.length > 0}
                {#if route.waypoints.some(wp => wp.date)}
                  {#if getDateRange(route.waypoints)}
                    <div class="date-range">{getDateRange(route.waypoints)}</div>
                  {/if}
                {/if}
              {/if}
            </div>
          </div>
          
          <label class="visibility-toggle">
            <input 
              type="checkbox" 
              checked={route.visible} 
              on:change={() => toggleRouteVisibility(id)}
            />
            <span class="toggle-track"></span>
          </label>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .route-toggle-container {
    width: 100%;
  }
  
  h2 {
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
  }
  
  .search-container {
    margin-bottom: 1rem;
  }
  
  .search-input {
    width: 100%;
    padding: 0.5rem;
    background-color: #444;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .search-input::placeholder {
    color: #aaa;
  }
  
  .empty-state {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .routes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: calc(100vh - 400px);
    overflow-y: auto;
  }
  
  .route-item {
    display: flex;
    align-items: center;
    background-color: #444;
    padding: 0.75rem;
    border-radius: 4px;
  }
  
  .route-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .route-info {
    flex: 1;
    min-width: 0;
  }
  
  .route-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .route-meta {
    font-size: 0.8rem;
    color: #ccc;
  }
  
  .date-range {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Toggle switch styling */
  .visibility-toggle {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    margin-left: 0.5rem;
  }
  
  .visibility-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-track {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #555;
    transition: .4s;
    border-radius: 22px;
  }
  
  .toggle-track:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-track {
    background-color: #4caf50;
  }
  
  input:checked + .toggle-track:before {
    transform: translateX(18px);
  }
</style>

<script context="module">
  // Helper function to get formatted date range from waypoints
  function getDateRange(waypoints: Array<{date?: string, q: number, r: number}>) {
    if (!waypoints || waypoints.length === 0) return null;
    
    // Filter waypoints with dates
    const waypointsWithDates = waypoints.filter(wp => wp.date);
    
    if (waypointsWithDates.length === 0) return null;
    
    // Sort waypoints by date
    const sortedWaypoints = [...waypointsWithDates].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
    
    // Get first and last date
    const firstDate = sortedWaypoints[0].date;
    const lastDate = sortedWaypoints[sortedWaypoints.length - 1].date;
    
    if (!firstDate || !lastDate) return null;
    
    // Format dates nicely
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
  }
</script>
