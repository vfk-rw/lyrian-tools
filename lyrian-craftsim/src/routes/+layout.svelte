<script>
  import '../app.css';
  import { browser } from '$app/environment';
  
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
  
  <slot />
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
  
  :global(.dark-theme) {
    background-color: #222;
    color: #eee;
  }
</style>
