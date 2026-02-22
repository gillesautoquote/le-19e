import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('public/models/mixamo/idle.glb');
const root = doc.getRoot();

const mat = root.listMaterials()[0];
if (mat) {
  console.log('Material name:', mat.getName());
  console.log('Base color factor:', mat.getBaseColorFactor());
  console.log('Base color texture:', mat.getBaseColorTexture());
  console.log('Alpha mode:', mat.getAlphaMode());
}

const sc = root.listScenes()[0];
for (const child of sc.listChildren()) {
  const hasMesh = child.getMesh() !== null;
  const hasSkin = child.getSkin() !== null;
  console.log('Root node:', child.getName(), '| mesh:', hasMesh, '| skin:', hasSkin);
  for (const c2 of child.listChildren()) {
    const m2 = c2.getMesh() !== null;
    const s2 = c2.getSkin() !== null;
    console.log('  ', c2.getName(), '| mesh:', m2, '| skin:', s2);
  }
}
