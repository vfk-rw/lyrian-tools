import * as THREE from 'three';
import { getHexCorners } from './hexlib';

// Biome colors
export const BIOME_COLORS = {
  plains: 0xa3c557,     // Light green
  forest: 0x2d6a4f,     // Dark green
  mountains: 0x9d8189,  // Grayish pink
  water: 0x4361ee,      // Blue
  desert: 0xe9c46a,     // Sand yellow
  snow: 0xffffff,       // White
  swamp: 0x606c38,      // Dark olive
  hills: 0xbc6c25,      // Brown
  tundra: 0xd8e2dc      // Light gray
};

// POI icons (simple placeholder strings for now)
export const POI_ICONS = {
  city: '🏙️',
  town: '🏘️',
  village: '🏡',
  castle: '🏰',
  ruins: '🏚️',
  temple: '⛩️',
  cave: '🕳️',
  mountain: '⛰️',
  forest: '🌲',
  lake: '🌊',
  camp: '⛺',
  mine: '⛏️',
  dungeon: '🗝️',
  portal: '🌀',
  monument: '🗿'
};

// Create a basic hex geometry based on corners
export function createHexGeometry(q: number, r: number, height: number = 0): THREE.BufferGeometry {
  const corners = getHexCorners(q, r);
  
  // Create vertices for the top face
  const vertices: number[] = [];
  const indices: number[] = [];
  
  // Add center vertex for top face
  const centerX = corners.reduce((sum, c) => sum + c.x, 0) / corners.length;
  const centerY = corners.reduce((sum, c) => sum + c.y, 0) / corners.length;
  vertices.push(centerX, height, centerY);
  
  // Add corner vertices for top face
  corners.forEach(corner => {
    vertices.push(corner.x, height, corner.y);
  });
  
  // Add vertices for bottom face
  vertices.push(centerX, 0, centerY);
  corners.forEach(corner => {
    vertices.push(corner.x, 0, corner.y);
  });
  
  // Create indices for the faces
  const topCenterIndex = 0;
  const bottomCenterIndex = corners.length + 1;
  
  // Top face triangles
  for (let i = 0; i < corners.length; i++) {
    const next = (i + 1) % corners.length;
    indices.push(topCenterIndex, i + 1, next + 1);
  }
  
  // Bottom face triangles
  for (let i = 0; i < corners.length; i++) {
    const next = (i + 1) % corners.length;
    indices.push(bottomCenterIndex, bottomCenterIndex + next + 1, bottomCenterIndex + i + 1);
  }
  
  // Side faces
  for (let i = 0; i < corners.length; i++) {
    const next = (i + 1) % corners.length;
    const topCurrent = i + 1;
    const topNext = next + 1;
    const bottomCurrent = bottomCenterIndex + i + 1;
    const bottomNext = bottomCenterIndex + next + 1;
    
    indices.push(topCurrent, bottomCurrent, topNext);
    indices.push(bottomCurrent, bottomNext, topNext);
  }
  
  // Create buffer geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create a material based on biome type
export function createBiomeMaterial(biome: string, isSelected: boolean = false, isHovered: boolean = false): THREE.Material {
  const color = BIOME_COLORS[biome as keyof typeof BIOME_COLORS] ?? BIOME_COLORS.plains;
  
  return new THREE.MeshStandardMaterial({
    color,
    emissive: isSelected ? 0x666666 : (isHovered ? 0x333333 : 0x000000),
    transparent: isSelected || isHovered,
    opacity: isSelected ? 0.9 : (isHovered ? 0.8 : 1.0),
    roughness: 0.7,
    metalness: 0.1
  });
}

// Create a region outline geometry
export function createRegionOutlineGeometry(tileCoords: [number, number][], tileHeights: Map<string, number>): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const processed = new Set<string>();
  
  // Helper to add an edge to the outline
  const addEdge = (q1: number, r1: number, q2: number, r2: number) => {
    const h1 = tileHeights.get(`${q1},${r1}`) || 0;
    const h2 = tileHeights.get(`${q2},${r2}`) || 0;
    
    const corners1 = getHexCorners(q1, r1);
    const corners2 = getHexCorners(q2, r2);
    
    points.push(
      new THREE.Vector3(corners1[0].x, h1 + 0.1, corners1[0].y),
      new THREE.Vector3(corners2[0].x, h2 + 0.1, corners2[0].y)
    );
  };
  
  // Process each tile
  tileCoords.forEach(([q, r]) => {
    const key = `${q},${r}`;
    const neighbors = [
      [q+1, r], [q+1, r-1], [q, r-1],
      [q-1, r], [q-1, r+1], [q, r+1]
    ];
    
    neighbors.forEach(([nq, nr], i) => {
      const neighborKey = `${nq},${nr}`;
      const edgeKey = `${key}-${neighborKey}`;
      const reverseEdgeKey = `${neighborKey}-${key}`;
      
      if (!processed.has(edgeKey) && !processed.has(reverseEdgeKey)) {
        const isNeighborInRegion = tileCoords.some(([tq, tr]) => tq === nq && tr === nr);
        if (!isNeighborInRegion) {
          addEdge(q, r, nq, nr);
          processed.add(edgeKey);
        }
      }
    });
  });
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

// Create a simple sprite for a POI
export function createPOISprite(icon: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  if (context) {
    context.clearRect(0, 0, 64, 64);
    
    // Draw a background circle
    context.beginPath();
    context.arc(32, 32, 24, 0, 2 * Math.PI);
    context.fillStyle = '#ffffff';
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = '#000000';
    context.stroke();
    
    // Draw the icon text
    context.font = '32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000000';
    context.fillText(icon, 32, 32);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5, 5, 1);
  
  return sprite;
}

// Setup three.js scene with proper lighting
export function setupScene(scene: THREE.Scene): void {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  // Add directional light for shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(1, 1, 1).normalize();
  dirLight.castShadow = true;
  scene.add(dirLight);
  
  // Add hemisphere light for better outdoor lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  scene.add(hemiLight);
  
  // Configure shadow properties
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 1000;
  
  const d = 100;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
}
