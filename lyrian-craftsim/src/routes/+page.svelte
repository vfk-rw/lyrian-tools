<script lang="ts">
  import { goto } from '$app/navigation';
  import '$lib/styles/components.css';
</script>

<div class="hero">
  <div class="hero-content">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Lyrian TTRPG Tools</h1>
      <p class="py-6">
        A collection of tools for tabletop role-playing games. Craft items, design maps, and manage your campaigns with ease.
      </p>
      
      <div class="tools-row">
        <a href="/map" class="tool-card" role="button" on:click|preventDefault={() => goto('/map')} on:keydown={e => e.key === 'Enter' && goto('/map')}>
          <div class="card-icon">🗺️</div>
          <h2 class="card-title">Hex Map Editor</h2>
          <p class="card-description">
            Create isometric hex maps with regions, points of interest, and multiple terrain types. Export and import maps as JSON.
          </p>
          <div class="card-footer">
            <button class="btn btn-primary">Open Map Editor</button>
          </div>
        </a>
        
        <a href="/craftsim-blacksmithing" class="tool-card" role="button" on:click|preventDefault={() => goto('/craftsim-blacksmithing')} on:keydown={e => e.key === 'Enter' && goto('/craftsim-blacksmithing')}>
          <div class="card-icon">⚒️</div>
          <h2 class="card-title">Crafting Simulator</h2>
          <p class="card-description">
            Simulate crafting items using different materials and techniques. Calculate success chances and material requirements.
          </p>
          <div class="card-footer">
            <button class="btn btn-primary">Open Crafting Simulator</button>
          </div>
        </a>
        
        <a href="/calendar" class="tool-card" role="button" on:click|preventDefault={() => goto('/calendar')} on:keydown={e => e.key === 'Enter' && goto('/calendar')}>
          <div class="card-icon">📅</div>
          <h2 class="card-title">Adventure Calendar</h2>
          <p class="card-description">
            View and manage adventure routes on a calendar. Track adventurers, play history, and upcoming events.
          </p>
          <div class="card-footer">
            <button class="btn btn-primary">Open Calendar</button>
          </div>
        </a>
        
        <a href="/character-sheet" class="tool-card future" role="button" tabindex="0">
          <div class="card-icon">📝</div>
          <h2 class="card-title">Character Sheet</h2>
          <p class="card-description">
            Manage your character's stats, inventory, and abilities. Track progress and share character sheets with your party.
          </p>
          <div class="card-footer">
            <button class="btn btn-primary" disabled>Coming Soon</button>
          </div>
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-color, #1a1a1a);
    color: var(--text-color, white);
    padding: 2rem;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  .hero-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    margin-bottom: 1rem;
    color: #4361ee;
  }
  
  .tools-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
    padding-bottom: 1rem;
  }
  
  .tool-card {
    background-color: #2a2a2a;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s ease;
    cursor: pointer;
  }
  
  /* Dark mode styles */
  :global(.dark-theme) .hero {
    background-color: var(--background-color, #1a1a1a);
    color: var(--text-color, white);
  }
  
  :global(.dark-theme) .tool-card {
    background-color: #2a2a2a;
  }
  
  :global(.dark-theme) .card-description {
    color: #ccc;
  }
  
  /* Light mode overrides */
  :global(body:not(.dark-theme)) .hero {
    background-color: var(--background-color, #f8f9fa);
    color: var(--text-color, #333);
  }
  
  :global(body:not(.dark-theme)) .tool-card {
    background-color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  :global(body:not(.dark-theme)) .card-description {
    color: #555;
  }
  
  .tool-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  }
  
  .card-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .card-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #4361ee;
  }
  
  .card-description {
    flex-grow: 1;
    margin-bottom: 1.5rem;
  }
  
  .card-footer {
    margin-top: auto;
  }
  
  .btn {
    background-color: #4361ee;
    color: white;
    border: none;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn:hover:not([disabled]) {
    background-color: #3a53cc;
  }
  
  .btn:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
</style>
