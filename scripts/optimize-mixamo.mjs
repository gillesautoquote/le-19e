#!/usr/bin/env node
/**
 * Optimize Mixamo GLB files:
 * 1. idle.glb   → Resize textures to 512×512 + dedup + quantize (keep mesh + skin + textures)
 * 2. walking.glb → Strip mesh/textures/skin, keep only skeleton nodes + animation clips
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, quantize, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { statSync } from 'fs';

const MODELS_DIR = 'public/models/mixamo';
const TEXTURE_SIZE = 512;

async function optimizeIdle() {
  console.log('--- Optimizing idle.glb (mesh + skin + textures + animation) ---');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(`${MODELS_DIR}/idle.glb`);

  // Resize textures to 512×512 using sharp directly
  for (const tex of doc.getRoot().listTextures()) {
    const img = tex.getImage();
    if (!img) continue;
    const resized = await sharp(Buffer.from(img))
      .resize(TEXTURE_SIZE, TEXTURE_SIZE)
      .png()
      .toBuffer();
    tex.setImage(new Uint8Array(resized));
    tex.setMimeType('image/png');
  }

  await doc.transform(
    dedup(),
    quantize(),
  );

  await io.write(`${MODELS_DIR}/idle.glb`, doc);
  console.log('  ✓ idle.glb optimized');
}

async function stripWalkingMesh() {
  console.log('--- Stripping mesh from walking.glb (animation only) ---');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(`${MODELS_DIR}/walking.glb`);
  const root = doc.getRoot();

  for (const mesh of root.listMeshes()) mesh.dispose();
  for (const mat of root.listMaterials()) mat.dispose();
  for (const tex of root.listTextures()) tex.dispose();

  for (const node of root.listNodes()) {
    if (node.getMesh()) node.setMesh(null);
    if (node.getSkin()) node.setSkin(null);
  }

  for (const skin of root.listSkins()) skin.dispose();

  await doc.transform(dedup());

  await io.write(`${MODELS_DIR}/walking.glb`, doc);
  console.log('  ✓ walking.glb stripped to animation only');
}

async function main() {
  const size = (f) => {
    const bytes = statSync(`${MODELS_DIR}/${f}`).size;
    return bytes > 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  };

  console.log(`Before: idle.glb = ${size('idle.glb')}, walking.glb = ${size('walking.glb')}\n`);

  await optimizeIdle();
  await stripWalkingMesh();

  console.log(`\nAfter:  idle.glb = ${size('idle.glb')}, walking.glb = ${size('walking.glb')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
