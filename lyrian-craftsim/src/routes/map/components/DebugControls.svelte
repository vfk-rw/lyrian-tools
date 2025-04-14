<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  export let fps: number = 0;
  export let showWireframe: boolean = false;
  export let showBoundingBoxes: boolean = false;
  export let showFrustum: boolean = false;
  export let chunkSize: number;

  const fpsHistory = tweened([] as number[], {
    duration: 200,
    easing: cubicOut
  });

  // Keep a rolling history of FPS values
  $: {
    if (fps > 0) {
      $fpsHistory = [...$fpsHistory.slice(-29), fps];
    }
  }

  // Calculate performance metrics
  $: averageFps = $fpsHistory.length > 0 
    ? Math.round($fpsHistory.reduce((a, b) => a + b) / $fpsHistory.length) 
    : 0;
  $: minFps = Math.min(...$fpsHistory);
  $: maxFps = Math.max(...$fpsHistory);

  function adjustChunkSize(delta: number) {
    const newSize = Math.max(4, Math.min(32, chunkSize + delta));
    if (newSize !== chunkSize) {
      chunkSize = newSize;
    }
  }
</script>

<div class="debug-controls">
  <div class="fps-display">
    <div class="fps-graph">
      {#each $fpsHistory as fpsValue}
        <div 
          class="fps-bar" 
          style="height: {(fpsValue / 60) * 100}%"
          class:warning={fpsValue < 30}
          class:critical={fpsValue < 15}
        ></div>
      {/each}
    </div>
    <div class="fps-stats">
      <div>FPS: {fps}</div>
      <div>Avg: {averageFps}</div>
      <div>Min: {minFps}</div>
      <div>Max: {maxFps}</div>
    </div>
  </div>

  <div class="controls">
    <label>
      <input type="checkbox" bind:checked={showWireframe} />
      Wireframe
    </label>
    <label>
      <input type="checkbox" bind:checked={showBoundingBoxes} />
      Bounding Boxes
    </label>
    <label>
      <input type="checkbox" bind:checked={showFrustum} />
      Frustum
    </label>
    <div class="chunk-size">
      <span>Chunk Size: {chunkSize}</span>
      <button on:click={() => adjustChunkSize(-4)}>-</button>
      <button on:click={() => adjustChunkSize(4)}>+</button>
    </div>
  </div>
</div>

<style>
  .debug-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-family: monospace;
    z-index: 1000;
    min-width: 200px;
  }

  .fps-display {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .fps-graph {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 40px;
    flex-grow: 1;
  }

  .fps-bar {
    flex-grow: 1;
    background: #4CAF50;
    min-width: 2px;
  }

  .fps-bar.warning {
    background: #FFA726;
  }

  .fps-bar.critical {
    background: #EF5350;
  }

  .fps-stats {
    font-size: 0.8em;
    display: grid;
    gap: 2px;
  }

  .controls {
    display: grid;
    gap: 5px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9em;
  }

  .chunk-size {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  button {
    background: #555;
    border: none;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;
  }

  button:hover {
    background: #666;
  }
</style>
