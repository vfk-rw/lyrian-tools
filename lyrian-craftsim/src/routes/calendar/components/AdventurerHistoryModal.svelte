<script lang="ts">
  import { routesData } from '$lib/map/stores/routeStore';
  import type { Route } from '$lib/map/stores/routeStore';
  
  // Props
  export let adventurerName: string;
  export let onClose: () => void;
  
  // Get route history for selected adventurer
  $: routeHistory = getRouteHistory($routesData.routes, adventurerName);
  
  // Get co-player statistics for the last month
  $: coPlayerStats = getCoPlayerStats($routesData.routes, adventurerName);
  
  // Function to get route history for an adventurer
  function getRouteHistory(routes: Map<string, Route>, adventurerName: string) {
    // Filter routes that include this adventurer
    const relevantRoutes = Array.from(routes.values())
      .filter(route => route.participants.includes(adventurerName));
    
    // Get the end date for each route
    const routesWithEndDates = relevantRoutes.map(route => {
      // Find the last waypoint with a date
      const waypointsWithDates = route.waypoints.filter(wp => wp.date);
      if (waypointsWithDates.length === 0) return null;
      
      const sortedWaypoints = [...waypointsWithDates].sort((a, b) => {
        return new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
      });
      
      const firstWaypoint = sortedWaypoints[0];
      const lastWaypoint = sortedWaypoints[sortedWaypoints.length - 1];
      
      return {
        id: route.id,
        name: route.name,
        color: route.color,
        startDate: new Date(firstWaypoint.date || ''),
        endDate: new Date(lastWaypoint.date || ''),
        participants: route.participants.filter(p => p !== adventurerName),
        gm: route.gm
      };
    }).filter(route => route !== null) as Array<{
      id: string;
      name: string;
      color: string;
      startDate: Date;
      endDate: Date;
      participants: string[];
      gm?: string;
    }>;
    
    // Sort by end date (most recent first)
    return routesWithEndDates.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }
  
  // Function to get co-player statistics for the past month
  function getCoPlayerStats(routes: Map<string, Route>, adventurerName: string) {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Get all routes for this adventurer
    const relevantRoutes = getRouteHistory(routes, adventurerName);
    
    // Track co-player statistics
    const coPlayerStats = new Map<string, {
      lastPlayedDate: Date;
      daysSinceLastPlayed: number;
      playCount: number;
    }>();
    
    // Process each route
    for (const route of relevantRoutes) {
      const routeDate = route.endDate;
      
      // Look at each co-player in this route
      for (const coPlayer of route.participants) {
        if (!coPlayerStats.has(coPlayer)) {
          // Initialize stats for this co-player
          coPlayerStats.set(coPlayer, {
            lastPlayedDate: routeDate,
            daysSinceLastPlayed: Math.floor((today.getTime() - routeDate.getTime()) / (1000 * 60 * 60 * 24)),
            playCount: 1
          });
        } else {
          // Update existing stats
          const stats = coPlayerStats.get(coPlayer)!;
          
          // Update play count
          stats.playCount += 1;
          
          // Update last played date if this route is more recent
          if (routeDate > stats.lastPlayedDate) {
            stats.lastPlayedDate = routeDate;
            stats.daysSinceLastPlayed = Math.floor((today.getTime() - routeDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      }
    }
    
    // Filter to only include co-players from the last month
    // and sort by days since last played
    return Array.from(coPlayerStats.entries())
      .filter(([_, stats]) => stats.lastPlayedDate >= oneMonthAgo)
      .sort((a, b) => a[1].daysSinceLastPlayed - b[1].daysSinceLastPlayed);
  }
  
  // Format date nicely
  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="adventurer-history-modal">
  <div class="modal-header">
    <h2>{adventurerName}'s Adventure History</h2>
    <button class="close-button" on:click={onClose}>✕</button>
  </div>
  
  <div class="modal-body">
    <div class="history-section">
      <h3>Route History</h3>
      
      {#if routeHistory.length === 0}
        <div class="empty-state">
          <p>No route history found for {adventurerName}.</p>
        </div>
      {:else}
        <div class="route-history-list">
          {#each routeHistory as route}
            <div class="history-item">
              <div class="route-color" style="background-color: {route.color}"></div>
              <div class="route-info">
                <div class="route-name">{route.name}</div>
                <div class="route-dates">
                  {formatDate(route.startDate)} - {formatDate(route.endDate)}
                </div>
                <div class="route-participants">
                  {#if route.gm}
                    <div class="gm"><strong>GM:</strong> {route.gm}</div>
                  {/if}
                  <div class="co-players">
                    <strong>Co-adventurers:</strong> 
                    {route.participants.length > 0 
                      ? route.participants.join(', ') 
                      : 'None (solo adventure)'}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <div class="history-section">
      <h3>Recent Co-Adventurers (Last 30 Days)</h3>
      
      {#if coPlayerStats.length === 0}
        <div class="empty-state">
          <p>No co-adventurers in the last 30 days.</p>
        </div>
      {:else}
        <div class="co-player-list">
          {#each coPlayerStats as [coPlayer, stats]}
            <div class="co-player-item">
              <div class="co-player-name">{coPlayer}</div>
              <div class="co-player-stats">
                <div class="last-played">
                  <strong>Last adventured:</strong> {formatDate(stats.lastPlayedDate)}
                  ({stats.daysSinceLastPlayed} days ago)
                </div>
                <div class="play-count">
                  <strong>Adventures together:</strong> {stats.playCount}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .adventurer-history-modal {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #444;
    border-bottom: 1px solid #555;
  }
  
  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #ddd;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
  }
  
  .close-button:hover {
    color: white;
  }
  
  .modal-body {
    padding: 1rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .history-section {
    margin-bottom: 2rem;
  }
  
  h3 {
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #444;
  }
  
  .empty-state {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
  }
  
  .route-history-list, .co-player-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .history-item, .co-player-item {
    display: flex;
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
  
  .route-info, .co-player-stats {
    flex: 1;
  }
  
  .route-name, .co-player-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .route-dates, .route-participants, .last-played, .play-count {
    font-size: 0.9rem;
    color: #ddd;
    margin-bottom: 0.25rem;
  }
  
  .gm {
    margin-bottom: 0.25rem;
  }
  
  .co-player-item {
    display: flex;
    flex-direction: column;
  }
</style>
