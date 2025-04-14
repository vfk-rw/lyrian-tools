<script lang="ts">
  // Placeholder for future Character Sheet functionality
</script>

<div class="container">
  <div class="placeholder-content">
    <h1>Character Sheet - Coming Soon</h1>
    <p class="description">
      This is a placeholder for the upcoming character sheet management system.
      The character sheet will allow players to create, manage, and track their characters.
    </p>
    <div class="placeholder-icon">📝</div>
    <div class="features-list">
      <h2>Planned Features</h2>
      <ul>
        <li>Character creation and management</li>
        <li>Stat tracking and calculation</li>
        <li>Inventory management</li>
        <li>Skill progression tracking</li>
        <li>Character history and notes</li>
        <li>Export and sharing options</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .container {
    width: 95%;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .placeholder-content {
    background-color: white;
    border-radius: 0.5rem;
    padding: 2rem;
    margin-top: 2rem;
    text-align: center;
    border: 1px solid #ddd;
  }
  
  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  .description {
    font-size: 1.1rem;
    color: #555;
    max-width: 600px;
    margin: 0 auto 2rem auto;
  }
  
  .placeholder-icon {
    font-size: 5rem;
    margin: 2rem 0;
  }
  
  .features-list {
    text-align: left;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .features-list h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .features-list ul {
    list-style-type: none;
    padding: 0;
  }
  
  .features-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .features-list li:before {
    content: "→";
    position: absolute;
    left: 0;
    color: #3b82f6;
  }
  
  .features-list li:last-child {
    border-bottom: none;
  }
  
  /* Dark theme styles */
  :global(.dark-theme) .placeholder-content {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark-theme) h1,
  :global(.dark-theme) h2 {
    color: #f9fafb;
  }
  
  :global(.dark-theme) .description {
    color: #d1d5db;
  }
  
  :global(.dark-theme) .features-list li {
    border-bottom-color: #374151;
  }
  
  :global(.dark-theme) .features-list li:before {
    color: #60a5fa;
  }
</style>
