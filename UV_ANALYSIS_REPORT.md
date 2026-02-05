# UV Mapping Analysis Report for card.glb

## Executive Summary

**Problem Identified:** Canvas content appears shifted to the RIGHT on the 3D card model, showing only partial content (e.g., "SP" instead of "SPAC", photo cut off on left).

**Root Cause:** The UV mapping in the GLB file is NOT centered in texture space. The UV coordinates have a significant offset from the expected center point.

---

## Detailed Findings

### UV Coordinate Statistics (Mesh 0 - Card Face)

| Property | Value | Notes |
|----------|-------|-------|
| **UV Bounds (U)** | 0.000829 to 1.000000 | Nearly full width |
| **UV Bounds (V)** | 0.002216 to 0.757248 | Only 75.5% of height |
| **UV Centroid (U)** | 0.387119 | **11.3% LEFT of center (0.5)** |
| **UV Centroid (V)** | 0.279240 | **22.1% UP from center (0.5)** |
| **UV Range Center (U)** | 0.500414 | Close to center |
| **UV Range Center (V)** | 0.379732 | **12% UP from center** |

### Quadrant Distribution

The UV vertices are distributed as follows:

- **Bottom-Left (48.3%)** - Majority of vertices
- **Top-Left (23.8%)** - Second largest
- **Bottom-Right (17.8%)** - Third
- **Top-Right (10.1%)** - Smallest

This confirms the UV mapping is heavily weighted toward the **LEFT** and **TOP** portions of the texture.

### Visual Pattern

```
Texture Space (0-1):
┌─────────────────────────────────────────┐ V=1.0 (top)
│                                         │
│                                         │
│                                         │
│   ███                  ███              │ V~0.75 (UV max)
│   ███                  ███              │
│   ███                  ███              │
│                                         │
│                                         │
│                                         │ V=0.5 (middle)
│                                         │
│   ███                  ███              │
│   ███                  ███              │ V~0.28 (UV centroid)
│   ███                  ███              │
│   ███                  ███              │
│                                         │
│                                         │ V=0.0 (bottom)
└─────────────────────────────────────────┘
U=0.0        U~0.39 (centroid)      U=1.0
             U~0.50 (range center)
```

---

## Why Canvas Content Appears Shifted RIGHT

When you draw content at the **center** of the canvas (0.5, 0.5), it appears on the **right side** of the 3D model because:

1. The UV centroid is at U=0.387 (LEFT of center)
2. Most UV coordinates sample from the LEFT portion of texture
3. Canvas coordinates are drawn assuming center = 0.5
4. But UV coordinates are weighted LEFT, so they sample from a different region

**Example:**
- You draw "SPAC" centered at canvas X=0.5 (50% from left)
- UV coordinates are centered at U=0.387 (38.7% from left)
- The 3D model samples texture mostly from 0.0-0.75 on U axis
- Result: Only the RIGHT portion of your content is visible ("SP")

---

## Solution: Canvas Drawing Offset

### Recommended Fix (Option 3)

Apply this transformation in your canvas drawing code **BEFORE** drawing content:

```javascript
// UV mapping correction for card.glb
const UV_CENTER_X = 0.5004;  // Actual center of UV range (U axis)
const UV_CENTER_Y = 0.3797;  // Actual center of UV range (V axis)
const EXPECTED_CENTER = 0.5;

function setupCanvasForUVMapping(ctx, canvasWidth, canvasHeight) {
    // Calculate offset to compensate for UV mapping
    const offsetX = (EXPECTED_CENTER - UV_CENTER_X) * canvasWidth;
    const offsetY = (EXPECTED_CENTER - UV_CENTER_Y) * canvasHeight;

    // Apply transformation
    ctx.translate(offsetX, offsetY);

    console.log(`UV Correction Applied: offsetX=${offsetX.toFixed(2)}px, offsetY=${offsetY.toFixed(2)}px`);
}

// Usage:
const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 1024;
const ctx = canvas.getContext('2d');

// Apply UV correction FIRST
setupCanvasForUVMapping(ctx, canvas.width, canvas.height);

// Now draw your content as normal (centered)
// The translation will ensure it appears correctly on the 3D model
```

### Alternative Fix (Option 1 - Using Centroid)

```javascript
// Use UV centroid instead of range center
const UV_CENTROID_X = 0.387119;
const UV_CENTROID_Y = 0.279240;

const offsetX = (0.5 - UV_CENTROID_X) * canvasWidth;  // ~115.5px for 1024px canvas
const offsetY = (0.5 - UV_CENTROID_Y) * canvasHeight; // ~226.2px for 1024px canvas

ctx.translate(offsetX, offsetY);
```

### Expected Results

For a 1024x1024 canvas:

| Approach | X Offset | Y Offset | Notes |
|----------|----------|----------|-------|
| **Range Center (Recommended)** | ~-0.4px | ~123.1px | Most accurate for full UV range |
| **Centroid** | ~115.5px | ~226.2px | Balances vertex distribution |

---

## Additional Findings

### Material Configuration
- Material 0: "base" - uses texture index 0
- Texture coord set: 0 (TEXCOORD_0)
- No texture transform extensions found
- No mirroring or rotation applied

### Sampler Settings
- Mag Filter: 9729 (LINEAR)
- Min Filter: 9987 (LINEAR_MIPMAP_LINEAR)
- Wrap S: 10497 (REPEAT)
- Wrap T: 10497 (REPEAT)

### Geometry
- 1164 vertices in card face mesh
- 4107 indices (1369 triangles)
- Position bounds: X=[-0.358, 0.358], Y=[0.023, 1.023], Z=[0.001, 0.005]

---

## Testing Recommendations

1. **Before Fix:** Measure how much of canvas is visible on 3D model
2. **Apply Fix:** Add translation as shown above
3. **After Fix:** Verify full canvas content is now visible and centered
4. **Fine-tune:** Adjust UV_CENTER values if needed based on visual results

---

## Files Created

1. `/mnt/c/spac/analyze_uv_mapping.js` - Detailed UV coordinate analysis
2. `/mnt/c/spac/visualize_uv_layout.js` - ASCII visualization of UV layout
3. `/mnt/c/spac/UV_ANALYSIS_REPORT.md` - This report

## Command to Re-run Analysis

```bash
node /mnt/c/spac/analyze_uv_mapping.js
node /mnt/c/spac/visualize_uv_layout.js
```

---

**Generated:** 2025-12-04
**GLB File:** /mnt/c/spac/public/lanyard/card.glb
