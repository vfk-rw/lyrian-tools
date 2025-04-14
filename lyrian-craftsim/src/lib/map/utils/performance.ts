import * as THREE from 'three';
import type { Vector3 } from 'three';
import type { VisibilityCheck } from '../interfaces/types';

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private updateCallback: (fps: number) => void;

  constructor(callback: (fps: number) => void) {
    this.updateCallback = callback;
  }

  update() {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
      this.updateCallback(this.fps);
    }
  }
}

export class FrustumCuller {
  private frustum: THREE.Frustum;
  private camera: THREE.Camera;
  private tempBox: THREE.Box3;
  private tempMatrix: THREE.Matrix4;
  private tempSphere: THREE.Sphere;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.frustum = new THREE.Frustum();
    this.tempBox = new THREE.Box3();
    this.tempMatrix = new THREE.Matrix4();
    this.tempSphere = new THREE.Sphere();
    this.updateFrustum();
  }

  updateFrustum() {
    this.frustum.setFromProjectionMatrix(
      this.tempMatrix.multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    );
  }

  isVisible(position: Vector3, radius: number = 30): boolean {
    this.tempSphere.set(position, radius);
    return this.frustum.intersectsSphere(this.tempSphere);
  }

  get currentFrustum(): THREE.Frustum {
    return this.frustum;
  }
}
