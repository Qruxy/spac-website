const fs = require('fs');

// Read GLB file
const glbPath = './public/lanyard/card.glb';
const buffer = fs.readFileSync(glbPath);

// GLB header
const magic = buffer.readUInt32LE(0);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

console.log('GLB Header:');
console.log('  Magic:', magic.toString(16));
console.log('  Version:', version);
console.log('  Length:', length);

// First chunk (JSON)
const chunk0Length = buffer.readUInt32LE(12);
const chunk0Type = buffer.readUInt32LE(16);
console.log('\nJSON Chunk:');
console.log('  Length:', chunk0Length);

const jsonData = buffer.slice(20, 20 + chunk0Length).toString('utf8');
const gltf = JSON.parse(jsonData);

console.log('\nMeshes:', gltf.meshes ? gltf.meshes.length : 0);
console.log('Materials:', gltf.materials ? gltf.materials.length : 0);
console.log('Textures:', gltf.textures ? gltf.textures.length : 0);
console.log('Images:', gltf.images ? gltf.images.length : 0);

// Find the card mesh and analyze UV coordinates
if (gltf.meshes) {
  gltf.meshes.forEach((mesh, i) => {
    console.log('\nMesh', i, ':', mesh.name);
    if (mesh.primitives) {
      mesh.primitives.forEach((prim, j) => {
        console.log('  Primitive', j, ':');
        console.log('    Attributes:', Object.keys(prim.attributes || {}));
        if (prim.attributes && prim.attributes.TEXCOORD_0 !== undefined) {
          const accessorIdx = prim.attributes.TEXCOORD_0;
          const accessor = gltf.accessors[accessorIdx];
          console.log('    TEXCOORD_0 accessor:', accessorIdx);
          console.log('    Type:', accessor.type);
          console.log('    Count:', accessor.count);
          console.log('    Min:', accessor.min);
          console.log('    Max:', accessor.max);
        }
      });
    }
  });
}

// Show material info
if (gltf.materials) {
  gltf.materials.forEach((mat, i) => {
    console.log('\nMaterial', i, ':', mat.name);
    if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
      console.log('  Has baseColorTexture:', mat.pbrMetallicRoughness.baseColorTexture.index);
    }
  });
}
