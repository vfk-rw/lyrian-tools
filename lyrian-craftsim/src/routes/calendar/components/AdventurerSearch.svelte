<script lang="ts">
  import { routesData } from '$lib/map/stores/routeStore';
  import type { Route } from '$lib/map/stores/routeStore';
  import { onMount } from 'svelte';
  import AdventurerHistoryModal from './AdventurerHistoryModal.svelte';
  
  // State
  let searchTerm = '';
  let adventurers: string[] = [];
  let selectedAdventurer: string | null = null;
  let showHistoryModal = false;
  
  // Get all unique adventurer names
  $: adventurers = getAllAdventurers($routesData.routes);
  
  // Filter adventurers based on search term
  $: filteredAdventurers = searchTerm 
    ? adventurers.filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase()))
    : adventurers;
  
  // Helper function to get all unique adventurer names
  function getAllAdventurers(routes: Map<string, Route>): string[] {
    // Create a Set to store unique adventurer names
    const adventurerSet = new Set<string>();
    
    // Iterate through all routes
    for (const route of routes.values()) {
      // Add each participant to the set
      for (const participant of route.participants) {
        adventurerSet.add(participant);
      }
    }
    
    // Convert to sorted array
    return Array.from(adventurerSet).sort();
  }
  
  // Handle adventurer selection
  function selectAdventurer(name: string) {
    selectedAdventurer = name;
    showHistoryModal = true;
  }
  
  // Close the history modal
  function closeHistoryModal() {
    showHistoryModal = false;
    selectedAdventurer = null;
  }
</script>

<div class="adventurer-search-container">
  <h2>Adventurers</h2>
  
  <!-- Search input -->
  <div class="search-container">
    <input 
      type="text" 
      class="search-input" 
      placeholder="Search adventurers..."
      bind:value={searchTerm}
    />
  </div>
  
  <!-- Adventurer list -->
  {#if adventurers.length === 0}
    <div class="empty-state">
      <p>No adventurers available.</p>
      <p>Create routes with adventurers to view them here.</p>
    </div>
  {:else if filteredAdventurers.length === 0}
    <div class="empty-state">
      <p>No adventurers match your search.</p>
    </div>
  {:else}
    <div class="adventurers-list">
      {#each filteredAdventurers as adventurer (adventurer)}
        <div 
          class="adventurer-item" 
          class:selected={adventurer === selectedAdventurer}
          on:click={() => selectAdventurer(adventurer)}
        >
          {adventurer}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Adventurer History Modal -->
  {#if showHistoryModal && selectedAdventurer}
    <div class="modal-backdrop" on:click={closeHistoryModal}>
      <div class="modal-content" on:click|stopPropagation>
        <AdventurerHistoryModal 
          adventurerName={selectedAdventurer} 
          onClose={closeHistoryModal} 
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .adventurer-search-container {
    width: 100%;
    position: relative;
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
  
  .adventurers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }
  
  .adventurer-item {
    padding: 0.6rem 0.75rem;
    background-color: #444;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .adventurer-item:hover {
    background-color: #555;
  }
  
  .adventurer-item.selected {
    background-color: #2c5e2e;
  }
  
  /* Modal styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-content {
    background-color: #333;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    max-width: 90%;
    max-height: 90%;
    width: 700px;
    overflow: hidden;
  }
</style>
