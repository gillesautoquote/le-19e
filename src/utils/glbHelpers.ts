import { Object3D, Mesh, BufferGeometry, Material, Group } from 'three';

export interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

/** Extract ALL meshes (geometry + material) from a loaded GLB scene. */
export function extractAllMeshes(scene: Group): MeshData[] {
  const results: MeshData[] = [];
  scene.traverse((node: Object3D) => {
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh;
      results.push({ geometry: mesh.geometry, material: mesh.material as Material });
    }
  });
  return results;
}
