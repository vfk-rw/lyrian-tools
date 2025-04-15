<script lang="ts">
  import '../app.css';
  import '../lib/styles/common.css';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  // Simple theme toggling without Tailwind/shadcn dependencies
  let theme = 'light';
  
  // Initialize theme on mount to ensure proper initial rendering
  onMount(() => {
    if (browser) {
      // Check for system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
      
      // Check for stored preference (overrides system preference)
      const stored = localStorage.getItem('theme');
      if (stored) {
        theme = stored;
      }
      
      // Apply theme immediately on mount
      applyTheme(theme);
    }
  });
  
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    if (browser) {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    }
  }
  
  // Function to apply theme to document body
  function applyTheme(currentTheme: string): void {
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Add a data attribute to the html element for potential CSS targeting
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
  
  // Watch for theme changes and apply them
  $: if (browser && theme) {
    applyTheme(theme);
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
        <li><a href="/calendar" class:active={$page.url.pathname === '/calendar'}>Calendar</a></li>
        <li><a href="/character-sheet" class:active={$page.url.pathname === '/character-sheet'}>Character Sheet</a></li>
        <li><a href="https://www.github.com/vfk-rw/lyrian-tools" target="_blank" class="external-link">GitHub</a></li>
        <li><a href="https://rpg.angelssword.com" target="_blank" class="external-link">TTRPG Manual</a></li>
      </ul>
    </div>
  </nav>
  
  <main class="content-container">
    <slot />
  </main>
</div>

<style>
  /* Layout styles moved to common.css */
</style>
