<script>
  import '../app.css';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  
  // Simple theme toggling without Tailwind/shadcn dependencies
  let theme = 'light';
  
  if (browser) {
    // Check for system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
    
    // Check for stored preference
    const stored = localStorage.getItem('theme');
    if (stored) {
      theme = stored;
    }
  }
  
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    if (browser) {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }
  
  $: if (browser && theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
</script>

<div class="app-container">
  <div class="theme-toggle">
    <button on:click={toggleTheme}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  </div>
  
  <nav class="main-nav">
    <div class="nav-container">
      <div class="nav-brand">Lyrian Tools</div>
      <ul class="nav-links">
        <li><a href="/" class:active={$page.url.pathname === '/'}>Home</a></li>
        <li><a href="/craftsim-blacksmithing" class:active={$page.url.pathname === '/craftsim-blacksmithing'}>Craftsim Blacksmithing</a></li>
        <li><a href="/map" class:active={$page.url.pathname === '/map'}>Map</a></li>
        <li><a href="/character-sheet" class:active={$page.url.pathname === '/character-sheet'}>Character Sheet</a></li>
      </ul>
    </div>
  </nav>
  
  <main class="content-container">
    <slot />
  </main>
</div>

<style>
  .app-container {
    min-height: 100vh;
  }
  
  .theme-toggle {
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 50;
  }
  
  .theme-toggle button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid #ddd;
  }
  
  .main-nav {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    padding: 0.5rem 0;
    position: sticky;
    top: 0;
    z-index: 40;
  }
  
  :global(.dark-theme) .main-nav {
    background-color: #333;
    border-bottom: 1px solid #444;
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }
  
  .nav-brand {
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 1.5rem;
  }
  
  .nav-links a {
    text-decoration: none;
    color: #495057;
    font-weight: 500;
    padding: 0.5rem 0;
    position: relative;
  }
  
  :global(.dark-theme) .nav-links a {
    color: #e9ecef;
  }
  
  .nav-links a.active {
    color: #3b82f6;
  }
  
  :global(.dark-theme) .nav-links a.active {
    color: #60a5fa;
  }
  
  .nav-links a.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #3b82f6;
  }
  
  :global(.dark-theme) .nav-links a.active::after {
    background-color: #60a5fa;
  }
  
  .content-container {
    padding-top: 1rem;
  }
  
  :global(.dark-theme) {
    background-color: #222;
    color: #eee;
  }
  
  @media (max-width: 768px) {
    .nav-container {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .nav-links {
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }
  }
</style>
