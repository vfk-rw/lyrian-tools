<script lang="ts">
  import { routesData } from '$lib/map/stores/routeStore';
  import type { Route, Waypoint } from '$lib/map/stores/routeStore';
  
  // Props
  export let currentDate: Date;
  
  // State
  let hoveredRoute: {
    id: string;
    name: string;
    color: string;
    participants: string[];
    gm?: string;
    startDate: Date;
    endDate: Date;
  } | null = null;
  
  // Calendar calculations
  $: month = currentDate.getMonth();
  $: year = currentDate.getFullYear();
  $: daysInMonth = new Date(year, month + 1, 0).getDate();
  $: firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Get days for the calendar grid (including padding for the first week)
  $: calendarDays = [...Array(firstDayOfMonth).fill(null), ...[...Array(daysInMonth).keys()].map(day => day + 1)];
  
  // Get routes that occur in this month
  $: visibleRoutes = getVisibleRoutesForMonth($routesData.routes, month, year);
  
  // Function to get routes for the current month
  function getVisibleRoutesForMonth(routes: Map<string, Route>, month: number, year: number) {
    const result = [];
    
    for (const [id, route] of routes) {
      // Skip routes that aren't visible
      if (!route.visible) continue;
      
      // Find waypoints with dates
      const waypointsWithDates = route.waypoints.filter(wp => wp.date);
      
      // Skip routes without dated waypoints
      if (waypointsWithDates.length === 0) continue;
      
      // Sort waypoints by date
      const sortedWaypoints = [...waypointsWithDates].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      
      // Get first and last date
      const firstWaypoint = sortedWaypoints[0];
      const lastWaypoint = sortedWaypoints[sortedWaypoints.length - 1];
      
      if (!firstWaypoint.date || !lastWaypoint.date) continue;
      
      const startDate = new Date(firstWaypoint.date);
      const endDate = new Date(lastWaypoint.date);
      
      // Check if route occurs in this month
      const routeStartMonth = startDate.getMonth();
      const routeStartYear = startDate.getFullYear();
      const routeEndMonth = endDate.getMonth();
      const routeEndYear = endDate.getFullYear();
      
      // Check if this route is visible in this month
      const isVisible = (
        // Route starts in this month
        (routeStartMonth === month && routeStartYear === year) ||
        // Route ends in this month
        (routeEndMonth === month && routeEndYear === year) ||
        // Route spans this month
        (
          (routeStartYear < year || (routeStartYear === year && routeStartMonth < month)) &&
          (routeEndYear > year || (routeEndYear === year && routeEndMonth > month))
        )
      );
      
      if (isVisible) {
        result.push({
          id,
          name: route.name,
          color: route.color,
          startDate,
          endDate,
          participants: route.participants || [],
          gm: route.gm,
          startDay: routeStartMonth === month && routeStartYear === year ? startDate.getDate() : 1,
          endDay: routeEndMonth === month && routeEndYear === year ? endDate.getDate() : daysInMonth
        });
      }
    }
    
    return result;
  }
  
  // Get routes for a specific day
  function getRoutesForDay(day: number) {
    if (!day) return [];
    
    return visibleRoutes.filter(route => 
      day >= route.startDay && day <= route.endDay
    );
  }
  
  // Function to determine if a route is at the start of a week 
  // (used to decide when to render the event label)
  function isRouteWeekStart(day: number, route: any) {
    // If it's the first day of the route or the first day of a week
    return day === route.startDay || day % 7 === 0;
  }
  
  // Format date for display
  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Handle hovering a route
  function handleRouteHover(route: any) {
    hoveredRoute = {
      id: route.id,
      name: route.name,
      color: route.color,
      startDate: route.startDate,
      endDate: route.endDate,
      participants: route.participants,
      gm: route.gm
    };
  }
  
  // Handle mouse leave
  function handleRouteLeave() {
    hoveredRoute = null;
  }
  
  // Format the day number (1-31)
  function formatDayNumber(day: number) {
    if (!day) return '';
    
    const today = new Date();
    const isToday = day === today.getDate() && 
                   month === today.getMonth() && 
                   year === today.getFullYear();
    
    return day;
  }
  
  // Check if a day is today
  function isToday(day: number) {
    if (!day) return false;
    
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  }
</script>

<div class="calendar-grid-container">
  <!-- Days of the week header -->
  <div class="calendar-header">
    <div class="weekday">Sun</div>
    <div class="weekday">Mon</div>
    <div class="weekday">Tue</div>
    <div class="weekday">Wed</div>
    <div class="weekday">Thu</div>
    <div class="weekday">Fri</div>
    <div class="weekday">Sat</div>
  </div>
  
  <!-- Calendar grid -->
  <div class="calendar-grid">
    {#each Array(Math.ceil((firstDayOfMonth + daysInMonth) / 7)) as _, week}
      <div class="calendar-week">
        {#each Array(7) as _, weekday}
          {@const dayIndex = week * 7 + weekday}
          {@const day = dayIndex >= firstDayOfMonth && dayIndex < firstDayOfMonth + daysInMonth 
                     ? dayIndex - firstDayOfMonth + 1 
                     : null}
          
          <div class="calendar-day {day ? '' : 'empty-day'}">
            <!-- Day number -->
            {#if day}
              <div class="day-number" class:today={isToday(day)}>
                {formatDayNumber(day)}
              </div>
              
              <!-- Routes for this day -->
              <div class="day-events">
                {#each getRoutesForDay(day) as route (route.id)}
                  <!-- Only show the route name at the beginning of the route or beginning of the week -->
                  {@const showLabel = isRouteWeekStart(day, route)}
                  
                  <div 
                    class="event-bar {hoveredRoute?.id === route.id ? 'hovered' : ''}"
                    style="background-color: {route.color};"
                    on:mouseenter={() => handleRouteHover(route)}
                    on:mouseleave={handleRouteLeave}
                  >
                    {#if showLabel}
                      <div class="event-label" style="color: {getContrastColor(route.color)}">
                        {route.name}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  
  <!-- Hover tooltip -->
  {#if hoveredRoute}
    <div class="event-tooltip" style="border-color: {hoveredRoute.color}">
      <div class="tooltip-header" style="background-color: {hoveredRoute.color}; color: {getContrastColor(hoveredRoute.color)}">
        {hoveredRoute.name}
      </div>
      
      <div class="tooltip-content">
        <div class="tooltip-dates">
          <strong>Dates:</strong> {formatDate(hoveredRoute.startDate)} - {formatDate(hoveredRoute.endDate)}
        </div>
        
        {#if hoveredRoute.gm}
          <div class="tooltip-gm">
            <strong>GM:</strong> {hoveredRoute.gm}
          </div>
        {/if}
        
        {#if hoveredRoute.participants && hoveredRoute.participants.length > 0}
          <div class="tooltip-participants">
            <strong>Participants:</strong>
            <ul>
              {#each hoveredRoute.participants as participant}
                <li>{participant}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-grid-container {
    position: relative;
    width: 100%;
    background-color: #2d2d2d;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #333;
    padding: 0.75rem 0;
    border-bottom: 1px solid #444;
  }
  
  .weekday {
    text-align: center;
    font-weight: 500;
    color: #ddd;
    font-size: 0.9rem;
  }
  
  .calendar-grid {
    display: flex;
    flex-direction: column;
  }
  
  .calendar-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #444;
  }
  
  .calendar-week:last-child {
    border-bottom: none;
  }
  
  .calendar-day {
    min-height: 100px;
    padding: 0.5rem;
    border-right: 1px solid #444;
    display: flex;
    flex-direction: column;
  }
  
  .calendar-day:last-child {
    border-right: none;
  }
  
  .empty-day {
    background-color: #333;
  }
  
  .day-number {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: #ddd;
  }
  
  .day-number.today {
    display: inline-block;
    background-color: #4caf50;
    color: white;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    border-radius: 50%;
  }
  
  .day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .event-bar {
    position: relative;
    height: 20px;
    margin-bottom: 2px;
    border-radius: 3px;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.8;
    transition: opacity 0.2s;
  }
  
  .event-bar:hover, .event-bar.hovered {
    opacity: 1;
  }
  
  .event-label {
    padding: 2px 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }
  
  .event-tooltip {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 300px;
    background-color: #333;
    border: 2px solid #666;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }
  
  .tooltip-header {
    padding: 0.5rem;
    font-weight: bold;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  
  .tooltip-content {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
  
  .tooltip-dates, .tooltip-gm {
    margin-bottom: 0.5rem;
  }
  
  .tooltip-participants ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.5rem;
  }
  
  .tooltip-participants li {
    margin-bottom: 0.25rem;
  }
</style>

<script context="module">
  // Helper function to determine if black or white text should be used for contrast against a background color
  function getContrastColor(hexColor: string) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate perceived brightness (YIQ equation)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Return black for light colors, white for dark colors
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
</script>
