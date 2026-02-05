const fs = require('fs');

// GLB file format constants
const CHUNK_TYPE_JSON = 0x4E4F534A;
const CHUNK_TYPE_BIN = 0x004E4942;

function readGLB(filePath) {
    const buffer = fs.readFileSync(filePath);

    // Read header
    let offset = 12;
    const jsonChunkLength = buffer.readUInt32LE(offset);
    offset += 8;

    const jsonData = JSON.parse(buffer.toString('utf8', offset, offset + jsonChunkLength));
    offset += jsonChunkLength;

    // Read binary chunk
    const binChunkLength = buffer.readUInt32LE(offset + 0);
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

    const componentsPerElement = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4,
    }[type];

    const bytesPerComponent = {
        5126: 4,  // FLOAT
        5123: 2,  // UNSIGNED_SHORT
        5125: 4   // UNSIGNED_INT
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
            }

            element.push(value);
        }

        result.push(componentsPerElement === 1 ? element[0] : element);
    }

    return result;
}

function createASCIIVisualization(uvs, width = 80, height = 40) {
    // Create a grid
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Find bounds
    const uvBounds = {
        min: [Infinity, Infinity],
        max: [-Infinity, -Infinity]
    };

    uvs.forEach(uv => {
        uvBounds.min[0] = Math.min(uvBounds.min[0], uv[0]);
        uvBounds.min[1] = Math.min(uvBounds.min[1], uv[1]);
        uvBounds.max[0] = Math.max(uvBounds.max[0], uv[0]);
        uvBounds.max[1] = Math.max(uvBounds.max[1], uv[1]);
    });

    // Map UVs to grid
    const density = Array(height).fill(null).map(() => Array(width).fill(0));

    uvs.forEach(uv => {
        // Normalize to 0-1 range
        const u = (uv[0] - 0) / 1.0;
        const v = (uv[1] - 0) / 1.0;

        // Map to grid (flip V because texture coordinates start at top-left)
        const x = Math.floor(u * (width - 1));
        const y = Math.floor((1 - v) * (height - 1));

        if (x >= 0 && x < width && y >= 0 && y < height) {
            density[y][x]++;
        }
    });

    // Convert density to ASCII characters
    const chars = ' .:-=+*#%@';
    let maxDensity = 0;
    density.forEach(row => row.forEach(d => maxDensity = Math.max(maxDensity, d)));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const d = density[y][x];
            if (d > 0) {
                const charIndex = Math.min(chars.length - 1, Math.floor((d / maxDensity) * (chars.length - 1)));
                grid[y][x] = chars[charIndex];
            }
        }
    }

    return { grid, uvBounds, maxDensity };
}

function analyzeUVLayout(filePath) {
    console.log('='.repeat(80));
    console.log('UV LAYOUT VISUALIZATION');
    console.log('='.repeat(80));
    console.log('');

    const { jsonData, binData } = readGLB(filePath);

    // Analyze the main mesh (Mesh 0 - the card face)
    const mesh = jsonData.meshes[0];
    const primitive = mesh.primitives[0];

    console.log('Analyzing Mesh 0 (Card Face) - Material:', primitive.material);
    console.log('');

    const uvs = getAccessorData(binData, jsonData, primitive.attributes.TEXCOORD_0);

    // Create visualization
    const { grid, uvBounds, maxDensity } = createASCIIVisualization(uvs, 80, 40);

    console.log('UV COORDINATE DENSITY MAP (Texture Space 0-1 on both axes):');
    console.log('V=1.0 (top) ↑');
    console.log('');

    // Print grid with axis labels
    for (let y = 0; y < grid.length; y++) {
        const vValue = 1.0 - (y / (grid.length - 1));
        const vLabel = y % 10 === 0 ? vValue.toFixed(1) + ' ' : '    ';
        console.log(vLabel + '│' + grid[y].join(''));
    }

    console.log('     └' + '─'.repeat(80));
    console.log('      U=0.0' + ' '.repeat(33) + 'U=0.5' + ' '.repeat(33) + 'U=1.0');
    console.log('      ← Left                                                          Right →');
    console.log('');

    console.log('Legend: Density = ' + ' .:-=+*#%@'.split('').join(' < '));
    console.log('Max vertex density in any cell:', maxDensity);
    console.log('');

    // Detailed analysis
    console.log('='.repeat(80));
    console.log('UV STATISTICS:');
    console.log('-'.repeat(80));
    console.log(`UV Bounds: U=[${uvBounds.min[0].toFixed(6)}, ${uvBounds.max[0].toFixed(6)}]`);
    console.log(`           V=[${uvBounds.min[1].toFixed(6)}, ${uvBounds.max[1].toFixed(6)}]`);
    console.log('');

    // Calculate centroid
    let sumU = 0, sumV = 0;
    uvs.forEach(uv => {
        sumU += uv[0];
        sumV += uv[1];
    });
    const centroidU = sumU / uvs.length;
    const centroidV = sumV / uvs.length;

    console.log(`UV Centroid: [${centroidU.toFixed(6)}, ${centroidV.toFixed(6)}]`);
    console.log(`Expected Center: [0.500000, 0.500000]`);
    console.log(`Offset from Center: U=${(centroidU - 0.5).toFixed(6)}, V=${(centroidV - 0.5).toFixed(6)}`);
    console.log('');

    // Analyze quadrants
    const quadrants = {
        'Top-Left (U<0.5, V>0.5)': 0,
        'Top-Right (U>0.5, V>0.5)': 0,
        'Bottom-Left (U<0.5, V<0.5)': 0,
        'Bottom-Right (U>0.5, V<0.5)': 0
    };

    uvs.forEach(uv => {
        const u = uv[0];
        const v = uv[1];

        if (u < 0.5 && v > 0.5) quadrants['Top-Left (U<0.5, V>0.5)']++;
        else if (u > 0.5 && v > 0.5) quadrants['Top-Right (U>0.5, V>0.5)']++;
        else if (u < 0.5 && v < 0.5) quadrants['Bottom-Left (U<0.5, V<0.5)']++;
        else if (u > 0.5 && v < 0.5) quadrants['Bottom-Right (U>0.5, V<0.5)']++;
    });

    console.log('Quadrant Distribution:');
    Object.entries(quadrants).forEach(([quad, count]) => {
        const percentage = ((count / uvs.length) * 100).toFixed(1);
        console.log(`  ${quad}: ${count} vertices (${percentage}%)`);
    });
    console.log('');

    // Analyze coverage
    console.log('='.repeat(80));
    console.log('COVERAGE ANALYSIS:');
    console.log('-'.repeat(80));

    const rangeU = uvBounds.max[0] - uvBounds.min[0];
    const rangeV = uvBounds.max[1] - uvBounds.min[1];
    const coverage = rangeU * rangeV;

    console.log(`Horizontal Coverage (U): ${(rangeU * 100).toFixed(2)}% of texture width`);
    console.log(`Vertical Coverage (V): ${(rangeV * 100).toFixed(2)}% of texture height`);
    console.log(`Total Coverage: ${(coverage * 100).toFixed(2)}% of texture area`);
    console.log('');

    console.log('Used Texture Region:');
    console.log(`  From: (${uvBounds.min[0].toFixed(4)}, ${uvBounds.min[1].toFixed(4)})`);
    console.log(`  To:   (${uvBounds.max[0].toFixed(4)}, ${uvBounds.max[1].toFixed(4)})`);
    console.log('');

    // Recommendations
    console.log('='.repeat(80));
    console.log('CANVAS ADJUSTMENT RECOMMENDATIONS:');
    console.log('='.repeat(80));
    console.log('');

    console.log('PROBLEM: UV centroid is at U=' + centroidU.toFixed(4) + ' (shifted ' + ((centroidU - 0.5) * 100).toFixed(1) + '% LEFT from center)');
    console.log('         UV centroid is at V=' + centroidV.toFixed(4) + ' (shifted ' + ((centroidV - 0.5) * 100).toFixed(1) + '% UP from center)');
    console.log('');

    const offsetU = centroidU - 0.5;
    const offsetV = centroidV - 0.5;

    console.log('SOLUTION OPTIONS:');
    console.log('');
    console.log('Option 1: Shift canvas content to compensate for UV offset');
    console.log('  In your canvas drawing code, apply this offset:');
    console.log(`  const offsetX = ${(-offsetU).toFixed(4)} * canvasWidth;  // ${(-offsetU * 100).toFixed(1)}% shift RIGHT`);
    console.log(`  const offsetY = ${(-offsetV).toFixed(4)} * canvasHeight; // ${(-offsetV * 100).toFixed(1)}% shift DOWN`);
    console.log('  ctx.translate(offsetX, offsetY);');
    console.log('');
    console.log('Option 2: Scale and position content to match UV bounds');
    console.log('  Map your canvas content to this region:');
    console.log(`  X: from ${(uvBounds.min[0] * 100).toFixed(2)}% to ${(uvBounds.max[0] * 100).toFixed(2)}% of canvas width`);
    console.log(`  Y: from ${(uvBounds.min[1] * 100).toFixed(2)}% to ${(uvBounds.max[1] * 100).toFixed(2)}% of canvas height`);
    console.log('');
    console.log('Option 3 (RECOMMENDED): Center content based on actual UV range');
    console.log('  const uvCenterX = ' + ((uvBounds.min[0] + uvBounds.max[0]) / 2).toFixed(4) + ';');
    console.log('  const uvCenterY = ' + ((uvBounds.min[1] + uvBounds.max[1]) / 2).toFixed(4) + ';');
    console.log('  const canvasOffsetX = (0.5 - uvCenterX) * canvasWidth;');
    console.log('  const canvasOffsetY = (0.5 - uvCenterY) * canvasHeight;');
    console.log('  ctx.translate(canvasOffsetX, canvasOffsetY);');
    console.log('');

    console.log('='.repeat(80));
}

const glbPath = process.argv[2] || '/mnt/c/spac/public/lanyard/card.glb';
analyzeUVLayout(glbPath);
