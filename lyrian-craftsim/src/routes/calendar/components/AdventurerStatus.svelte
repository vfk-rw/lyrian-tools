<script lang="ts">
  import { routesData } from '$lib/map/stores/routeStore';
  import type { Route } from '$lib/map/stores/routeStore';
  
  // Computed property to get current adventurers on routes
  $: adventurerStatus = getAdventurerStatus($routesData.routes);
  
  // Function to get all adventurers currently on routes with their return dates
  function getAdventurerStatus(routes: Map<string, Route>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Track adventurer => { routeName, routeColor, daysRemaining, endDate }
    const adventurers = new Map();
    
    for (const [id, route] of routes) {
      // Skip routes that are completed (end date is in the past)
      // Get waypoints with dates and sort them
      const waypointsWithDates = route.waypoints.filter(wp => wp.date);
      
      if (waypointsWithDates.length === 0) continue;
      
      // Sort waypoints by date
      const sortedWaypoints = [...waypointsWithDates].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      
      // Get end date (last waypoint with date)
      const lastWaypoint = sortedWaypoints[sortedWaypoints.length - 1];
      if (!lastWaypoint.date) continue;
      
      const endDate = new Date(lastWaypoint.date);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Check if route is ongoing (end date is in the future)
      if (endDate <= today) continue;
      
      // Calculate days remaining
      const diffTime = Math.abs(endDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Add information for each participant
      for (const participant of route.participants) {
        // If the adventurer is already on a route with a later end date, don't update
        if (adventurers.has(participant)) {
          const existing = adventurers.get(participant);
          if (new Date(existing.endDate) > endDate) continue;
        }
        
        adventurers.set(participant, {
          routeName: route.name,
          routeColor: route.color,
          gm: route.gm,
          daysRemaining: diffDays,
          endDate: endDate
        });
      }
    }
    
    // Convert to sorted array
    return Array.from(adventurers.entries())
      .sort((a, b) => a[1].daysRemaining - b[1].daysRemaining);
  }
  
  // Format date in a readable way
  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="adventurer-status">
  <h2>Adventurers Currently on Routes</h2>
  
  {#if adventurerStatus.length === 0}
    <div class="empty-state">
      <p>No adventurers are currently on active routes.</p>
    </div>
  {:else}
    <div class="status-list">
      {#each adventurerStatus as [adventurer, status]}
        <div class="status-item">
          <div class="route-color" style="background-color: {status.routeColor}"></div>
          <div class="status-info">
            <div class="adventurer-name">{adventurer}</div>
            <div class="status-details">
              <span class="route-name">On: {status.routeName}</span>
              <!-- GM information removed as requested -->
              <span class="return-date">Returns: {formatDate(status.endDate)}</span>
              <span class="days-remaining">
                <strong>
                  {status.daysRemaining} {status.daysRemaining === 1 ? 'day' : 'days'} remaining
                </strong>
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .adventurer-status {
    margin-top: 1.5rem;
  }
  
  h2 {
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    padding-top: 1rem;
    border-top: 1px solid #444;
  }
  
  .empty-state {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
  }
  
  .status-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .status-item {
    display: flex;
    align-items: flex-start;
    background-color: #444;
    padding: 0.75rem;
    border-radius: 4px;
  }
  
  .route-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }
  
  .status-info {
    flex: 1;
    min-width: 0;
  }
  
  .adventurer-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .status-details {
    font-size: 0.85rem;
    color: #ddd;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  
  .days-remaining {
    margin-top: 0.25rem;
  }
</style>
