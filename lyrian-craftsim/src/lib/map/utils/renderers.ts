import * as THREE from 'three';
import type { TileHex } from '../interfaces/types';

export interface MaterialWithWireframe extends THREE.Material {
  wireframe?: boolean;
}

export class InstancedHexRenderer {
  private _instancedMesh: THREE.InstancedMesh;
  private baseGeometry: THREE.BufferGeometry;
  private matrix: THREE.Matrix4;
  private tempColor: THREE.Color;
  private maxInstances: number;
  private currentCount: number;

  constructor(geometry: THREE.BufferGeometry, material: MaterialWithWireframe, maxInstances: number) {
    this.baseGeometry = geometry;
    this._instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    this.matrix = new THREE.Matrix4();
    this.tempColor = new THREE.Color();
    this.maxInstances = maxInstances;
    this.currentCount = 0;

    // Enable shadows
    this._instancedMesh.castShadow = true;
    this._instancedMesh.receiveShadow = true;
  }

  get instancedMesh(): THREE.InstancedMesh {
    return this._instancedMesh;
  }

  updateInstance(index: number, position: THREE.Vector3, color: number, scale = 1.0) {
    this.matrix.makeTranslation(position.x, position.y, position.z);
    this.matrix.scale(new THREE.Vector3(scale, scale, scale));
    this._instancedMesh.setMatrixAt(index, this.matrix);
    this._instancedMesh.setColorAt(index, this.tempColor.setHex(color));
    this._instancedMesh.instanceMatrix.needsUpdate = true;
    if (this._instancedMesh.instanceColor) {
      this._instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this._instancedMesh);
  }

  removeFromScene(scene: THREE.Scene) {
    scene.remove(this._instancedMesh);
  }

  setCount(count: number) {
    this.currentCount = Math.min(count, this.maxInstances);
    this._instancedMesh.count = this.currentCount;
  }

  dispose() {
    this.baseGeometry.dispose();
    if (Array.isArray(this._instancedMesh.material)) {
      this._instancedMesh.material.forEach(m => m.dispose());
    } else {
      this._instancedMesh.material.dispose();
    }
  }
}

export class LevelOfDetail {
  private static readonly LOD_LEVELS = 3;
  private static readonly LOD_DISTANCES = [50, 100, 200];
  private lodMeshes: THREE.Mesh[];
  private currentLOD: number = 0;

  constructor(
    private baseGeometry: THREE.BufferGeometry,
    private material: MaterialWithWireframe,
    private camera: THREE.Camera
  ) {
    this.lodMeshes = this.createLODMeshes();
  }

  private createLODMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    
    for (let i = 0; i < LevelOfDetail.LOD_LEVELS; i++) {
      const detail = 1 / Math.pow(2, i); // Each level reduces detail by half
      const geometry = this.simplifyGeometry(this.baseGeometry, detail);
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);
    }

    return meshes;
  }

  private simplifyGeometry(geometry: THREE.BufferGeometry, detail: number): THREE.BufferGeometry {
    const positions = geometry.attributes.position.array;
    const simplified = new Float32Array(Math.floor(positions.length * detail));
    
    for (let i = 0; i < simplified.length; i += 3) {
      simplified[i] = positions[i];
      simplified[i + 1] = positions[i + 1];
      simplified[i + 2] = positions[i + 2];
    }

    const simplifiedGeometry = new THREE.BufferGeometry();
    simplifiedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(simplified, 3));
    simplifiedGeometry.computeVertexNormals();
    
    return simplifiedGeometry;
  }

  updateLOD(distance: number): boolean {
    const newLOD = this.calculateLODLevel(distance);
    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      return true;
    }
    return false;
  }

  private calculateLODLevel(distance: number): number {
    for (let i = 0; i < LevelOfDetail.LOD_DISTANCES.length; i++) {
      if (distance < LevelOfDetail.LOD_DISTANCES[i]) {
        return i;
      }
    }
    return LevelOfDetail.LOD_LEVELS - 1;
  }

  getCurrentMesh(): THREE.Mesh {
    return this.lodMeshes[this.currentLOD];
  }

  dispose() {
    this.lodMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
  }
}

export class ChunkManager {
  private static readonly DEFAULT_CHUNK_SIZE = 16;
  private chunks: Map<string, InstancedHexRenderer>;
  private visibleChunks: Set<string>;
  private _chunkSize: number;

  constructor(private scene: THREE.Scene) {
    this.chunks = new Map();
    this.visibleChunks = new Set();
    this._chunkSize = ChunkManager.DEFAULT_CHUNK_SIZE;
  }

  get chunkSize(): number {
    return this._chunkSize;
  }

  setChunkSize(size: number) {
    this._chunkSize = Math.max(4, Math.min(32, size));
    // Recreate chunks with new size
    this.chunks.forEach(chunk => chunk.dispose());
    this.chunks.clear();
    this.visibleChunks.clear();
  }

  getChunkKey(q: number, r: number): string {
    const chunkQ = Math.floor(q / this._chunkSize);
    const chunkR = Math.floor(r / this._chunkSize);
    return `${chunkQ},${chunkR}`;
  }

  updateVisibleChunks(tiles: Map<string, TileHex>, frustum: THREE.Frustum) {
    const newVisibleChunks = new Set<string>();

    // Determine which chunks should be visible
    for (const [_, tile] of tiles) {
      const chunkKey = this.getChunkKey(tile.q, tile.r);
      if (!newVisibleChunks.has(chunkKey)) {
        const chunk = this.chunks.get(chunkKey);
        if (chunk && frustum.intersectsObject(chunk.instancedMesh)) {
          newVisibleChunks.add(chunkKey);
        }
      }
    }

    // Remove chunks that are no longer visible
    for (const chunkKey of this.visibleChunks) {
      if (!newVisibleChunks.has(chunkKey)) {
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
          chunk.removeFromScene(this.scene);
        }
      }
    }

    // Add newly visible chunks
    for (const chunkKey of newVisibleChunks) {
      if (!this.visibleChunks.has(chunkKey)) {
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
          chunk.addToScene(this.scene);
        }
      }
    }

    this.visibleChunks = newVisibleChunks;
  }

  dispose() {
    this.chunks.forEach(chunk => chunk.dispose());
    this.chunks.clear();
    this.visibleChunks.clear();
  }
}
