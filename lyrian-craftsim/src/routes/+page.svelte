<script lang="ts">
  // Homepage for Lyrian Tools
</script>

<div class="container">
  <header class="header">
    <h1>Lyrian Tools</h1>
    <p class="tagline">A collection of tools for the world of Lyria</p>
  </header>

  <div class="tools-grid">
    <a href="/craftsim-blacksmithing" class="tool-card">
      <div class="card-icon">⚒️</div>
      <h2>Crafting Simulator - Blacksmithing</h2>
      <p>Simulate the crafting process for blacksmithing items with different materials, skills, and abilities.</p>
      <div class="card-footer">
        <span class="status-badge active">Available</span>
      </div>
    </a>

    <a href="/map" class="tool-card">
      <div class="card-icon">🗺️</div>
      <h2>Map</h2>
      <p>Explore the world of Lyria with an interactive map showing locations, points of interest, and travel routes.</p>
      <div class="card-footer">
        <span class="status-badge coming-soon">Coming Soon</span>
      </div>
    </a>

    <a href="/character-sheet" class="tool-card">
      <div class="card-icon">📝</div>
      <h2>Character Sheet</h2>
      <p>Create and manage character sheets with stat tracking, inventory management, and more.</p>
      <div class="card-footer">
        <span class="status-badge coming-soon">Coming Soon</span>
      </div>
    </a>

    <div class="tool-card future">
      <div class="card-icon">🧪</div>
      <h2>Crafting Simulator - Alchemy</h2>
      <p>Coming soon: Simulate the crafting process for alchemical items with different ingredients and techniques.</p>
      <div class="card-footer">
        <span class="status-badge planned">Planned</span>
      </div>
    </div>
  </div>

</div>

<style>
  .container {
    width: 95%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    min-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
  }
  
  .header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  :global(.dark-theme) .header {
    border-bottom-color: #374151;
  }
  
  .header h1 {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .tagline {
    font-size: 1.25rem;
    color: #6b7280;
  }
  
  :global(.dark-theme) .tagline {
    color: #9ca3af;
  }
  
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  @media (min-width: 640px) {
    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1280px) {
    .tools-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .tool-card {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
    height: 100%;
  }
  
  .tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .tool-card.future {
    opacity: 0.7;
    cursor: default;
  }
  
  .tool-card.future:hover {
    transform: none;
    box-shadow: none;
  }
  
  :global(.dark-theme) .tool-card {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  .card-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
  
  .tool-card h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .tool-card p {
    color: #6b7280;
    margin-bottom: 1rem;
    flex-grow: 1;
    font-size: 0.95rem;
  }
  
  :global(.dark-theme) .tool-card p {
    color: #9ca3af;
  }
  
  .card-footer {
    margin-top: auto;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-badge.active {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  :global(.dark-theme) .status-badge.active {
    background-color: #065f46;
    color: #d1fae5;
  }
  
  .status-badge.coming-soon {
    background-color: #dbeafe;
    color: #1e40af;
  }
  
  :global(.dark-theme) .status-badge.coming-soon {
    background-color: #1e40af;
    color: #dbeafe;
  }
  
  .status-badge.planned {
    background-color: #e5e7eb;
    color: #4b5563;
  }
  
  :global(.dark-theme) .status-badge.planned {
    background-color: #4b5563;
    color: #e5e7eb;
  }
  
  .site-footer {
    margin-top: auto;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }
  
  :global(.dark-theme) .site-footer {
    border-top-color: #374151;
  }
  
  .footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  
  .footer-content p {
    color: #6b7280;
  }
  
  :global(.dark-theme) .footer-content p {
    color: #9ca3af;
  }
  
  .github-link {
    display: inline-block;
    color: #3b82f6;
    text-decoration: none;
    border: 1px solid #3b82f6;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    transition: background-color 0.2s, color 0.2s;
  }
  
  .github-link:hover {
    background-color: #3b82f6;
    color: white;
  }
</style>
