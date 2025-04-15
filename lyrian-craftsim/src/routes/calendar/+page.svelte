<script lang="ts">
  import CalendarGrid from './components/CalendarGrid.svelte';
  import RouteToggle from './components/RouteToggle.svelte';
  import AdventurerStatus from './components/AdventurerStatus.svelte';
  import { routesData, exportRoutesJSON, importRoutesJSON } from '$lib/map/stores/routeStore';
  import type { Route } from '$lib/map/stores/routeStore';
  import { v4 as uuidv4 } from 'uuid';
  import { getPlayerNames, getAdventurerNames } from '$lib/map/data/censusParser';
  import '$lib/styles/common.css';
  
  // Current view date
  let currentDate = new Date();
  let adventurerNames: string[] = [];
  let playerNames: string[] = [];
  
  // Load names for demo routes
  async function loadNames() {
    try {
      adventurerNames = await getAdventurerNames();
      playerNames = await getPlayerNames();
    } catch (error) {
      console.error('Error loading names:', error);
      // Fallback data if census loading fails
      adventurerNames = ['Thorne', 'Elara', 'Garrick', 'Seraphina', 'Kell', 'Lyra', 'Rowan'];
      playerNames = ['Randy', 'Melissa', 'Sarah', 'Dan', 'Alex'];
    }
  }
  
  // Generate random routes for demo purposes
  async function generateDemoRoutes() {
    // Make sure we have names
    if (adventurerNames.length === 0) {
      await loadNames();
    }
    
    // Clear existing routes
    const currentRoutes = $routesData.routes;
    if (currentRoutes.size > 0) {
      if (!confirm('This will replace any existing routes. Continue?')) {
        return;
      }
    }
    
    // Define route colors
    const routeColors = [
      '#ff0000', // Red
      '#00ff00', // Green
      '#0000ff', // Blue
      '#ffff00', // Yellow
      '#ff00ff', // Magenta
      '#00ffff', // Cyan
      '#ff8800', // Orange
      '#8800ff'  // Purple
    ];
    
    // Generate 3-5 random routes
    const numRoutes = Math.floor(Math.random() * 3) + 3; // 3-5 routes
    const newRoutes = new Map<string, Route>();
    
    // Get a date range for the last month
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    for (let i = 0; i < numRoutes; i++) {
      const id = uuidv4();
      const color = routeColors[Math.floor(Math.random() * routeColors.length)];
      
      // Random participants (1-5)
      const numParticipants = Math.floor(Math.random() * 5) + 1;
      const participants: string[] = [];
      for (let j = 0; j < numParticipants; j++) {
        const randomAdventurer = adventurerNames[Math.floor(Math.random() * adventurerNames.length)];
        if (!participants.includes(randomAdventurer)) {
          participants.push(randomAdventurer);
        }
      }
      
      // Random GM (50% chance of having one)
      const hasGM = Math.random() > 0.5;
      const gm = hasGM ? playerNames[Math.floor(Math.random() * playerNames.length)] : undefined;
      
      // Random duration (2-30 days)
      const durationDays = Math.floor(Math.random() * 29) + 2;
      
      // Random start date in the last month
      const daysInMonth = 30;
      const randomDayOffset = Math.floor(Math.random() * daysInMonth);
      const startDate = new Date(lastMonth);
      startDate.setDate(startDate.getDate() + randomDayOffset);
      
      // Calculate end date
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      
      // Create waypoints (at least start and end)
      const waypoints = [
        {
          id: uuidv4(),
          q: Math.floor(Math.random() * 20),
          r: Math.floor(Math.random() * 20),
          date: startDate.toISOString().split('T')[0],
          notes: `Start of route ${i + 1}`
        }
      ];
      
      // Add 1-3 intermediate waypoints
      const intermediatePoints = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < intermediatePoints; j++) {
        const dayOffset = Math.floor(Math.random() * (durationDays - 1)) + 1;
        const waypointDate = new Date(startDate);
        waypointDate.setDate(waypointDate.getDate() + dayOffset);
        
        waypoints.push({
          id: uuidv4(),
          q: Math.floor(Math.random() * 20),
          r: Math.floor(Math.random() * 20),
          date: waypointDate.toISOString().split('T')[0],
          notes: `Waypoint ${j + 1}`
        });
      }
      
      // Add end waypoint
      waypoints.push({
        id: uuidv4(),
        q: Math.floor(Math.random() * 20),
        r: Math.floor(Math.random() * 20),
        date: endDate.toISOString().split('T')[0],
        notes: `End of route ${i + 1}`
      });
      
      // Sort waypoints by date
      waypoints.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Create the route
      newRoutes.set(id, {
        id,
        name: `Adventure ${i + 1}`,
        color,
        visible: true,
        editable: false,
        waypoints,
        participants,
        gm
      });
    }
    
    // Update the store with new routes
    const { routes } = $routesData;
    routesData.exitAllEditModes(); // Clear any editing states
    const routesState = { routes: newRoutes };
    // Use a custom action to set the entire state
    import('$lib/map/utils/secureRouteImport').then(({ validateAndSanitizeRoutesJSON }) => {
      // Convert Map to array of routes for validation
      const routesArray = Array.from(newRoutes.values());
      // Update the store
      importRoutesJSON({ 
        version: '1.0',
        timestamp: new Date().toISOString(),
        routes: routesArray
      }, 0);
    });
    
    alert(`Created ${numRoutes} demo routes!`);
  }
  
  // Handle importing routes from map
  function handleImport() {
    // Create a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          // Parse the JSON
          const rawJsonData = JSON.parse(readerEvent.target?.result as string);
          
          // Import the routes
          const success = importRoutesJSON(rawJsonData, file.size);
          
          if (success) {
            alert('Routes imported successfully!');
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
  }
  
  // Handle exporting routes from calendar
  function handleExport() {
    // Create a JSON representation of the routes
    const jsonData = exportRoutesJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Create a blob and download it
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-routes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  // Handle changing the current month view
  function changeMonth(months: number) {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + months);
    currentDate = newDate;
  }
</script>

<div class="calendar-app">
  <header class="header">
    <h1>Lyrian Adventure Calendar</h1>
    
    <div class="month-navigation">
      <button class="nav-button" on:click={() => changeMonth(-1)}>
        ◀ Previous Month
      </button>
      
      <div class="current-month">
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      
      <button class="nav-button" on:click={() => changeMonth(1)}>
        Next Month ▶
      </button>
    </div>
    
    <div class="header-buttons">
      <button class="header-button" on:click={handleImport}>
        <span class="button-icon">📂</span>
        <span class="button-text">Import Routes</span>
      </button>
      
      <button class="header-button" on:click={handleExport}>
        <span class="button-icon">💾</span>
        <span class="button-text">Export Routes</span>
      </button>
      
      <button class="header-button" on:click={generateDemoRoutes}>
        <span class="button-icon">🎲</span>
        <span class="button-text">Demo Routes</span>
      </button>
    </div>
  </header>
  
  <main class="main-content">
    <aside class="sidebar">
      <RouteToggle />
    </aside>
    
    <div class="calendar-container">
      <CalendarGrid {currentDate} />
      
      <!-- Adventurer Status Display below calendar -->
      <div class="adventurer-status-container">
        <AdventurerStatus />
      </div>
    </div>
  </main>
</div>

<style>
  .calendar-app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background-color: #2d2d2d;
    color: #fff;
  }
  
  .header {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: #333;
    border-bottom: 1px solid #444;
  }
  
  h1 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    text-align: center;
  }
  
  .month-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .current-month {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .nav-button {
    background-color: #444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .nav-button:hover {
    background-color: #555;
  }
  
  .header-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .header-button {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.3s;
  }
  
  .header-button:hover {
    background-color: #555;
  }
  
  .button-icon {
    margin-right: 0.5rem;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 500px;
    background-color: #383838;
    padding: 1rem;
    overflow-y: auto;
    border-right: 1px solid #444;
  }
  
  .adventurer-status-container {
    margin-top: 2rem;
    border-top: 1px solid #444;
    padding-top: 1rem;
  }
  
  .calendar-container {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }
</style>
