import * as THREE from 'three';
import { TerrainBrushTool } from '../types/character';

export interface TerrainData {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  size: number;
  segments: number;
  heights: Float32Array; // grid of (segments+1) * (segments+1)
}

export class TerrainEngine {
  public data: TerrainData;
  private wireframeMesh: THREE.LineSegments | null = null;

  constructor(size: number = 70, segments: number = 70) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Make it horizontal X-Z

    const vertCount = (segments + 1) * (segments + 1);
    const heights = new Float32Array(vertCount);

    // Dynamic procedural material with height-tinted vertex styling
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'EditableTerrainMesh';
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    this.data = {
      mesh,
      geometry,
      size,
      segments,
      heights,
    };

    // Initial slight natural undulation
    this.generateProceduralMountains(0.8, 12.0);
  }

  /**
   * Samples terrain height at world coordinates (x, z) using bilinear interpolation
   */
  public getHeightAt(x: number, z: number): number {
    const { size, segments, heights } = this.data;
    const half = size / 2;

    // Convert from world coordinates (-half to +half) to normalized grid (0 to segments)
    const gx = ((x + half) / size) * segments;
    const gz = ((z + half) / size) * segments;

    if (gx < 0 || gx >= segments || gz < 0 || gz >= segments) {
      return 0; // outside boundary
    }

    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(x0 + 1, segments);
    const z1 = Math.min(z0 + 1, segments);

    const fx = gx - x0;
    const fz = gz - z0;

    const stride = segments + 1;
    const h00 = heights[z0 * stride + x0];
    const h10 = heights[z0 * stride + x1];
    const h01 = heights[z1 * stride + x0];
    const h11 = heights[z1 * stride + x1];

    // Bilinear interpolation
    const top = h00 * (1 - fx) + h10 * fx;
    const bot = h01 * (1 - fx) + h11 * fx;
    return top * (1 - fz) + bot * fz;
  }

  /**
   * Sculpt terrain at world center (cx, cz) with a brush tool
   */
  public sculpt(
    cx: number,
    cz: number,
    radius: number,
    intensity: number,
    tool: TerrainBrushTool
  ): void {
    const { size, segments, heights, geometry } = this.data;
    const half = size / 2;
    const stride = segments + 1;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    const gridRadius = (radius / size) * segments;
    const centerGx = ((cx + half) / size) * segments;
    const centerGz = ((cz + half) / size) * segments;

    const minX = Math.max(0, Math.floor(centerGx - gridRadius));
    const maxX = Math.min(segments, Math.ceil(centerGx + gridRadius));
    const minZ = Math.max(0, Math.floor(centerGz - gridRadius));
    const maxZ = Math.min(segments, Math.ceil(centerGz + gridRadius));

    // Calculate average height inside brush for flatten/smooth
    let avgHeight = 0;
    let count = 0;
    if (tool === 'flatten' || tool === 'smooth') {
      for (let gz = minZ; gz <= maxZ; gz++) {
        for (let gx = minX; gx <= maxX; gx++) {
          const d = Math.hypot(gx - centerGx, gz - centerGz);
          if (d <= gridRadius) {
            avgHeight += heights[gz * stride + gx];
            count++;
          }
        }
      }
      if (count > 0) avgHeight /= count;
    }

    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const d = Math.hypot(gx - centerGx, gz - centerGz);
        if (d > gridRadius) continue;

        const falloff = Math.cos((d / gridRadius) * (Math.PI / 2)); // smooth cosine falloff
        const idx = gz * stride + gx;
        const currentH = heights[idx];

        let newH = currentH;
        if (tool === 'raise') {
          newH += intensity * falloff * 0.4;
        } else if (tool === 'lower') {
          newH -= intensity * falloff * 0.4;
        } else if (tool === 'smooth') {
          newH += (avgHeight - currentH) * falloff * 0.3;
        } else if (tool === 'flatten') {
          newH += (avgHeight - currentH) * falloff * 0.6;
        }

        // Clamp reasonable mountain heights (-4 to 22 meters)
        newH = Math.max(-4, Math.min(24, newH));
        heights[idx] = newH;
        posAttr.setY(idx, newH);
      }
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Generates procedural mountain peaks and valleys across the map
   */
  public generateProceduralMountains(scale: number = 1.0, maxHeight: number = 14.0): void {
    const { segments, heights, geometry } = this.data;
    const stride = segments + 1;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    for (let gz = 0; gz <= segments; gz++) {
      for (let gx = 0; gx <= segments; gx++) {
        const nx = (gx / segments - 0.5) * 2;
        const nz = (gz / segments - 0.5) * 2;
        const distFromCenter = Math.hypot(nx, nz);

        // Keep center clearing for initial player arena, raise mountains outward
        const mountainFactor = Math.pow(Math.min(1, Math.max(0, (distFromCenter - 0.25) / 0.75)), 1.5);

        // Multi-octave natural mountain math
        const octave1 = Math.sin(nx * 4.5 + 1.2) * Math.cos(nz * 4.5 + 0.8);
        const octave2 = Math.sin(nx * 9.2) * Math.cos(nz * 8.6) * 0.5;
        const octave3 = Math.sin(nx * 18.0 + nz * 14.0) * 0.2;
        const peakNoise = (octave1 + octave2 + octave3 + 1.0) * 0.5;

        const h = peakNoise * maxHeight * mountainFactor * scale;

        const idx = gz * stride + gx;
        heights[idx] = h;
        posAttr.setY(idx, h);
      }
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Resets the entire terrain to a flat ground
   */
  public resetToFlat(): void {
    const { heights, geometry } = this.data;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < heights.length; i++) {
      heights[i] = 0;
      posAttr.setY(i, 0);
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Serializes current heights into an array for export
   */
  public exportHeightArray(): number[] {
    return Array.from(this.data.heights);
  }

  /**
   * Restores heights from an array
   */
  public importHeightArray(arr: number[]): void {
    const { heights, geometry } = this.data;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const len = Math.min(arr.length, heights.length);
    for (let i = 0; i < len; i++) {
      heights[i] = arr[i];
      posAttr.setY(i, arr[i]);
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
