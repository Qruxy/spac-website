const fs = require('fs');
const path = require('path');

// GLB file format constants
const CHUNK_TYPE_JSON = 0x4E4F534A;
const CHUNK_TYPE_BIN = 0x004E4942;

function readGLB(filePath) {
    const buffer = fs.readFileSync(filePath);

    // Read header
    const magic = buffer.readUInt32LE(0);
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);

    console.log('GLB Header:');
    console.log(`  Magic: 0x${magic.toString(16)} (should be 0x46546C67)`);
    console.log(`  Version: ${version}`);
    console.log(`  Length: ${length} bytes`);
    console.log('');

    // Read JSON chunk
    let offset = 12;
    const jsonChunkLength = buffer.readUInt32LE(offset);
    const jsonChunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;

    const jsonData = JSON.parse(buffer.toString('utf8', offset, offset + jsonChunkLength));
    offset += jsonChunkLength;

    // Read binary chunk
    const binChunkLength = buffer.readUInt32LE(offset);
    const binChunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;

    const binData = buffer.slice(offset, offset + binChunkLength);

    return { jsonData, binData };
}

function getBufferView(binData, bufferView) {
    const offset = bufferView.byteOffset || 0;
    const length = bufferView.byteLength;
    return binData.slice(offset, offset + length);
}

function getAccessorData(binData, jsonData, accessorIndex) {
    const accessor = jsonData.accessors[accessorIndex];
    const bufferView = jsonData.bufferViews[accessor.bufferView];
    const data = getBufferView(binData, bufferView);

    const componentType = accessor.componentType;
    const count = accessor.count;
    const type = accessor.type;

    // Determine number of components per element
    const componentsPerElement = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
        'MAT2': 4,
        'MAT3': 9,
        'MAT4': 16
    }[type];

    // Determine bytes per component
    const bytesPerComponent = {
        5120: 1,  // BYTE
        5121: 1,  // UNSIGNED_BYTE
        5122: 2,  // SHORT
        5123: 2,  // UNSIGNED_SHORT
        5125: 4,  // UNSIGNED_INT
        5126: 4   // FLOAT
    }[componentType];

    const byteOffset = accessor.byteOffset || 0;
    const byteStride = bufferView.byteStride || (bytesPerComponent * componentsPerElement);

    const result = [];

    for (let i = 0; i < count; i++) {
        const elementOffset = byteOffset + (i * byteStride);
        const element = [];

        for (let j = 0; j < componentsPerElement; j++) {
            const componentOffset = elementOffset + (j * bytesPerComponent);
            let value;

            switch (componentType) {
                case 5126: // FLOAT
                    value = data.readFloatLE(componentOffset);
                    break;
                case 5123: // UNSIGNED_SHORT
                    value = data.readUInt16LE(componentOffset);
                    break;
                case 5125: // UNSIGNED_INT
                    value = data.readUInt32LE(componentOffset);
                    break;
                default:
                    value = 0;
            }

            element.push(value);
        }

        result.push(componentsPerElement === 1 ? element[0] : element);
    }

    return result;
}

function analyzeUVMapping(filePath) {
    console.log('='.repeat(80));
    console.log('UV MAPPING ANALYSIS FOR:', filePath);
    console.log('='.repeat(80));
    console.log('');

    const { jsonData, binData } = readGLB(filePath);

    // Analyze materials
    console.log('MATERIAL ANALYSIS:');
    console.log('-'.repeat(80));
    if (jsonData.materials) {
        jsonData.materials.forEach((material, idx) => {
            console.log(`Material ${idx}: ${material.name || 'Unnamed'}`);

            if (material.pbrMetallicRoughness) {
                const pbr = material.pbrMetallicRoughness;
                if (pbr.baseColorTexture) {
                    console.log(`  Base Color Texture: index ${pbr.baseColorTexture.index}`);
                    console.log(`  Texture Coord Set: ${pbr.baseColorTexture.texCoord || 0}`);

                    // Check for texture transform extension
                    if (pbr.baseColorTexture.extensions) {
                        console.log('  Extensions found:');
                        console.log(JSON.stringify(pbr.baseColorTexture.extensions, null, 4));
                    }
                }
            }

            // Check for extensions on material itself
            if (material.extensions) {
                console.log('  Material Extensions:');
                console.log(JSON.stringify(material.extensions, null, 4));
            }
            console.log('');
        });
    }

    // Analyze textures
    console.log('TEXTURE ANALYSIS:');
    console.log('-'.repeat(80));
    if (jsonData.textures) {
        jsonData.textures.forEach((texture, idx) => {
            console.log(`Texture ${idx}:`);
            console.log(`  Source: ${texture.source}`);
            console.log(`  Sampler: ${texture.sampler !== undefined ? texture.sampler : 'default'}`);
            if (texture.extensions) {
                console.log('  Extensions:');
                console.log(JSON.stringify(texture.extensions, null, 4));
            }
            console.log('');
        });
    }

    // Analyze samplers
    if (jsonData.samplers) {
        console.log('SAMPLER ANALYSIS:');
        console.log('-'.repeat(80));
        jsonData.samplers.forEach((sampler, idx) => {
            console.log(`Sampler ${idx}:`);
            console.log(`  Mag Filter: ${sampler.magFilter || 'default'}`);
            console.log(`  Min Filter: ${sampler.minFilter || 'default'}`);
            console.log(`  Wrap S: ${sampler.wrapS || 'default'}`);
            console.log(`  Wrap T: ${sampler.wrapT || 'default'}`);
            console.log('');
        });
    }

    // Analyze meshes and UV coordinates
    console.log('MESH AND UV COORDINATE ANALYSIS:');
    console.log('-'.repeat(80));

    if (jsonData.meshes) {
        jsonData.meshes.forEach((mesh, meshIdx) => {
            console.log(`Mesh ${meshIdx}: ${mesh.name || 'Unnamed'}`);

            mesh.primitives.forEach((primitive, primIdx) => {
                console.log(`  Primitive ${primIdx}:`);
                console.log(`    Material: ${primitive.material}`);
                console.log(`    Mode: ${primitive.mode || 4} (4=TRIANGLES)`);

                // Get position data
                if (primitive.attributes.POSITION !== undefined) {
                    const positions = getAccessorData(binData, jsonData, primitive.attributes.POSITION);
                    console.log(`    Vertices: ${positions.length}`);

                    // Calculate bounds
                    const bounds = {
                        min: [Infinity, Infinity, Infinity],
                        max: [-Infinity, -Infinity, -Infinity]
                    };

                    positions.forEach(pos => {
                        for (let i = 0; i < 3; i++) {
                            bounds.min[i] = Math.min(bounds.min[i], pos[i]);
                            bounds.max[i] = Math.max(bounds.max[i], pos[i]);
                        }
                    });

                    console.log(`    Position Bounds:`);
                    console.log(`      Min: [${bounds.min.map(v => v.toFixed(4)).join(', ')}]`);
                    console.log(`      Max: [${bounds.max.map(v => v.toFixed(4)).join(', ')}]`);
                    console.log(`      Size: [${(bounds.max[0] - bounds.min[0]).toFixed(4)}, ${(bounds.max[1] - bounds.min[1]).toFixed(4)}, ${(bounds.max[2] - bounds.min[2]).toFixed(4)}]`);
                }

                // Get UV data
                if (primitive.attributes.TEXCOORD_0 !== undefined) {
                    const uvs = getAccessorData(binData, jsonData, primitive.attributes.TEXCOORD_0);
                    console.log(`    UV Coordinates: ${uvs.length}`);

                    // Calculate UV statistics
                    const uvBounds = {
                        min: [Infinity, Infinity],
                        max: [-Infinity, -Infinity]
                    };

                    let sumU = 0, sumV = 0;
                    const uvDistribution = {
                        u: { '0-0.25': 0, '0.25-0.5': 0, '0.5-0.75': 0, '0.75-1': 0 },
                        v: { '0-0.25': 0, '0.25-0.5': 0, '0.5-0.75': 0, '0.75-1': 0 }
                    };

                    uvs.forEach(uv => {
                        uvBounds.min[0] = Math.min(uvBounds.min[0], uv[0]);
                        uvBounds.min[1] = Math.min(uvBounds.min[1], uv[1]);
                        uvBounds.max[0] = Math.max(uvBounds.max[0], uv[0]);
                        uvBounds.max[1] = Math.max(uvBounds.max[1], uv[1]);

                        sumU += uv[0];
                        sumV += uv[1];

                        // Distribution
                        const u = uv[0];
                        const v = uv[1];

                        if (u >= 0 && u < 0.25) uvDistribution.u['0-0.25']++;
                        else if (u >= 0.25 && u < 0.5) uvDistribution.u['0.25-0.5']++;
                        else if (u >= 0.5 && u < 0.75) uvDistribution.u['0.5-0.75']++;
                        else if (u >= 0.75 && u <= 1) uvDistribution.u['0.75-1']++;

                        if (v >= 0 && v < 0.25) uvDistribution.v['0-0.25']++;
                        else if (v >= 0.25 && v < 0.5) uvDistribution.v['0.25-0.5']++;
                        else if (v >= 0.5 && v < 0.75) uvDistribution.v['0.5-0.75']++;
                        else if (v >= 0.75 && v <= 1) uvDistribution.v['0.75-1']++;
                    });

                    const avgU = sumU / uvs.length;
                    const avgV = sumV / uvs.length;

                    console.log(`    UV Bounds:`);
                    console.log(`      Min: [${uvBounds.min.map(v => v.toFixed(6)).join(', ')}]`);
                    console.log(`      Max: [${uvBounds.max.map(v => v.toFixed(6)).join(', ')}]`);
                    console.log(`      Range: [${(uvBounds.max[0] - uvBounds.min[0]).toFixed(6)}, ${(uvBounds.max[1] - uvBounds.min[1]).toFixed(6)}]`);
                    console.log(`      Center: [${((uvBounds.min[0] + uvBounds.max[0]) / 2).toFixed(6)}, ${((uvBounds.min[1] + uvBounds.max[1]) / 2).toFixed(6)}]`);
                    console.log(`      Average: [${avgU.toFixed(6)}, ${avgV.toFixed(6)}]`);
                    console.log(`    UV Distribution:`);
                    console.log(`      U-axis: ${JSON.stringify(uvDistribution.u)}`);
                    console.log(`      V-axis: ${JSON.stringify(uvDistribution.v)}`);

                    // Show sample UV coordinates (first 10, last 10, and some from middle)
                    console.log(`    Sample UV Coordinates (first 10):`);
                    uvs.slice(0, 10).forEach((uv, i) => {
                        console.log(`      [${i}]: [${uv[0].toFixed(6)}, ${uv[1].toFixed(6)}]`);
                    });

                    if (uvs.length > 20) {
                        console.log(`    Sample UV Coordinates (middle 10 around index ${Math.floor(uvs.length / 2)}):`);
                        const midStart = Math.floor(uvs.length / 2) - 5;
                        uvs.slice(midStart, midStart + 10).forEach((uv, i) => {
                            console.log(`      [${midStart + i}]: [${uv[0].toFixed(6)}, ${uv[1].toFixed(6)}]`);
                        });

                        console.log(`    Sample UV Coordinates (last 10):`);
                        uvs.slice(-10).forEach((uv, i) => {
                            console.log(`      [${uvs.length - 10 + i}]: [${uv[0].toFixed(6)}, ${uv[1].toFixed(6)}]`);
                        });
                    }

                    // Analyze UV pattern - check for mirroring/rotation
                    console.log(`    UV Pattern Analysis:`);

                    // Check if UVs are concentrated in certain areas
                    const uvCoverage = (uvBounds.max[0] - uvBounds.min[0]) * (uvBounds.max[1] - uvBounds.min[1]);
                    console.log(`      UV Space Coverage: ${(uvCoverage * 100).toFixed(2)}% of full texture`);

                    // Check for potential issues
                    console.log(`    Potential Issues:`);
                    if (uvBounds.min[0] > 0.01) {
                        console.log(`      ⚠ UVs don't start at U=0 (min U = ${uvBounds.min[0].toFixed(6)})`);
                        console.log(`        This means texture starts ${(uvBounds.min[0] * 100).toFixed(2)}% from left edge`);
                    }
                    if (uvBounds.max[0] < 0.99) {
                        console.log(`      ⚠ UVs don't reach U=1 (max U = ${uvBounds.max[0].toFixed(6)})`);
                        console.log(`        This means texture stops at ${(uvBounds.max[0] * 100).toFixed(2)}% from left edge`);
                    }
                    if (uvBounds.min[1] > 0.01) {
                        console.log(`      ⚠ UVs don't start at V=0 (min V = ${uvBounds.min[1].toFixed(6)})`);
                    }
                    if (uvBounds.max[1] < 0.99) {
                        console.log(`      ⚠ UVs don't reach V=1 (max V = ${uvBounds.max[1].toFixed(6)})`);
                    }

                    if (avgU > 0.6) {
                        console.log(`      ⚠ UV coordinates heavily weighted to RIGHT side of texture (avg U = ${avgU.toFixed(4)})`);
                        console.log(`        This explains why canvas content appears on the right side of the 3D model!`);
                    } else if (avgU < 0.4) {
                        console.log(`      ⚠ UV coordinates heavily weighted to LEFT side of texture (avg U = ${avgU.toFixed(4)})`);
                    }

                    if (avgV > 0.6) {
                        console.log(`      ⚠ UV coordinates heavily weighted to BOTTOM of texture (avg V = ${avgV.toFixed(4)})`);
                    } else if (avgV < 0.4) {
                        console.log(`      ⚠ UV coordinates heavily weighted to TOP of texture (avg V = ${avgV.toFixed(4)})`);
                    }

                    // Get indices if available
                    if (primitive.indices !== undefined) {
                        const indices = getAccessorData(binData, jsonData, primitive.indices);
                        console.log(`    Indices: ${indices.length} (${indices.length / 3} triangles)`);

                        // Analyze first triangle's UV mapping
                        if (indices.length >= 3) {
                            console.log(`    First Triangle UV Mapping:`);
                            for (let i = 0; i < 3; i++) {
                                const idx = indices[i];
                                const uv = uvs[idx];
                                console.log(`      Vertex ${i} (index ${idx}): UV [${uv[0].toFixed(6)}, ${uv[1].toFixed(6)}]`);
                            }
                        }
                    }
                }

                console.log('');
            });
        });
    }

    console.log('='.repeat(80));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(80));
    console.log('Based on the UV analysis above, to fix the canvas content positioning:');
    console.log('');
    console.log('If UVs are weighted to the right (avg U > 0.6):');
    console.log('  - Draw canvas content more to the LEFT to compensate');
    console.log('  - OR adjust UV coordinates to be centered around U=0.5');
    console.log('');
    console.log('If UV range doesn\'t cover full texture (e.g., U: 0.0 to 0.7):');
    console.log('  - Scale and position canvas content to match the UV range');
    console.log('  - Example: If UV goes 0.0 to 0.7, that\'s only 70% of texture width');
    console.log('');
    console.log('Current issue: "Canvas content appears shifted to the RIGHT"');
    console.log('This suggests UV coordinates are sampling from the RIGHT portion of texture.');
    console.log('='.repeat(80));
}

// Run analysis
const glbPath = process.argv[2] || '/mnt/c/spac/public/lanyard/card.glb';
analyzeUVMapping(glbPath);
