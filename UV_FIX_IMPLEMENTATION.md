# UV Mapping Fix - Implementation Guide

## Problem Summary

The 3D card model (`card.glb`) has UV coordinates that are **NOT centered** in texture space:

- **UV Centroid:** U=0.387 (11.3% LEFT of center), V=0.279 (22.1% UP from center)
- **UV Range Center:** U=0.500, V=0.380 (12% UP from center)
- **Result:** Canvas content drawn at (512, 512) appears shifted RIGHT and DOWN on the 3D model

## Root Cause

The UV mapping samples primarily from the **bottom-left** quadrant of the texture (48.3% of vertices), with the centroid at approximately (39%, 28%) instead of the expected center at (50%, 50%).

When canvas content is drawn at the center (50%, 50%), the UV coordinates sample from an offset region, causing the visible misalignment.

## The Fix

Add a **context transformation** in the `useCardTexture` function to offset canvas drawing and compensate for the UV mapping offset.

### Location

File: `/mnt/c/spac/src/components/lanyard/Lanyard.tsx`

Function: `useCardTexture` (lines 29-307)

Specifically in the `drawCard` function (line 47)

### Code Changes

**REPLACE the current drawCard function starting at line 47** with the version below:

```typescript
const drawCard = (img?: HTMLImageElement | null) => {
  // ========================================
  // UV MAPPING CORRECTION
  // ========================================
  // The GLB file's UV coordinates are offset from texture center.
  // Analysis shows UV range center at (0.5004, 0.3797) instead of (0.5, 0.5)
  // This means we need to shift canvas content to compensate.

  const w = canvas.width;   // 1024
  const h = canvas.height;  // 1024

  // UV mapping analysis results from card.glb:
  // - UV Bounds: U=[0.0008, 1.0000], V=[0.0022, 0.7572]
  // - UV Range Center: U=0.5004, V=0.3797
  // - Expected Center: U=0.5000, V=0.5000
  const UV_CENTER_X = 0.5004;
  const UV_CENTER_Y = 0.3797;
  const EXPECTED_CENTER = 0.5;

  // Calculate pixel offset to center content in UV-mapped region
  const offsetX = (EXPECTED_CENTER - UV_CENTER_X) * w;  // ~-0.4px (negligible)
  const offsetY = (EXPECTED_CENTER - UV_CENTER_Y) * h;  // ~123px DOWN

  // Clear to white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // ========================================
  // APPLY UV CORRECTION TRANSFORM
  // ========================================
  ctx.save(); // Save state before transformation
  ctx.translate(offsetX, offsetY);

  console.log(`[Lanyard UV Correction] Offset: X=${offsetX.toFixed(2)}px, Y=${offsetY.toFixed(2)}px`);

  // ========================================
  // YOUR CONTENT DRAWING CODE GOES HERE
  // ========================================
  // Now draw your actual card content (replace the debug texture below)

  // For now, keep the debug texture to verify the fix works:
  drawDebugTexture();

  // ========================================
  // RESTORE CONTEXT AFTER DRAWING
  // ========================================
  ctx.restore(); // Restore state after transformation

  // Create texture for glTF model
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  setTexture(tex);

  // Helper function for debug texture (can be removed later)
  function drawDebugTexture() {
    // ========================================
    // 1. CORNER MARKERS (distinct colors)
    // ========================================
    const cornerSize = 80;

    // TOP-LEFT: RED
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('TOP-LEFT', 5, 5);
    ctx.fillText('(0,0)', 5, 25);

    // TOP-RIGHT: GREEN
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(w - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.fillText('TOP-RIGHT', w - 5, 5);
    ctx.fillText(`(${w},0)`, w - 5, 25);

    // BOTTOM-LEFT: BLUE
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(0, h - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('BOTTOM-LEFT', 5, h - 25);
    ctx.fillText(`(0,${h})`, 5, h - 5);

    // BOTTOM-RIGHT: YELLOW
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(w - cornerSize, h - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('BOTTOM-RIGHT', w - 5, h - 25);
    ctx.fillText(`(${w},${h})`, w - 5, h - 5);

    // ========================================
    // 2. DIAGONAL LINES
    // ========================================
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();

    ctx.setLineDash([]);

    // ========================================
    // 3. GRID
    // ========================================
    const gridSize = 128;
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 256) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // ========================================
    // 4. COORDINATE LABELS
    // ========================================
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelPositions = [
      { x: 256, y: 128, label: '(256,128)' },
      { x: 512, y: 128, label: '(512,128)' },
      { x: 768, y: 128, label: '(768,128)' },
      { x: 256, y: 384, label: '(256,384)' },
      { x: 512, y: 384, label: '(512,384)' },
      { x: 768, y: 384, label: '(768,384)' },
      { x: 256, y: 640, label: '(256,640)' },
      { x: 512, y: 640, label: '(512,640)' },
      { x: 768, y: 640, label: '(768,640)' },
      { x: 256, y: 896, label: '(256,896)' },
      { x: 512, y: 896, label: '(512,896)' },
      { x: 768, y: 896, label: '(768,896)' },
    ];

    labelPositions.forEach(({ x, y, label }) => {
      ctx.fillStyle = '#FFFFFF';
      const metrics = ctx.measureText(label);
      ctx.fillRect(
        x - metrics.width / 2 - 4,
        y - 12,
        metrics.width + 8,
        24
      );
      ctx.fillStyle = '#000000';
      ctx.fillText(label, x, y);
    });

    // ========================================
    // 5. LARGE "L" ORIENTATION MARKER
    // ========================================
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 20;

    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, h / 2 - 150);
    ctx.lineTo(w / 2 - 100, h / 2 + 150);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, h / 2 + 150);
    ctx.lineTo(w / 2 + 100, h / 2 + 150);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', w / 2, h / 2 - 50);

    // ========================================
    // 6. UV VISIBLE AREA MARKER
    // ========================================
    const visibleHeight = Math.floor(h * 0.757);

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, visibleHeight);
    ctx.lineTo(w, visibleHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`UV BOUNDARY Y=0.757 (${visibleHeight}px)`, w / 2, visibleHeight - 10);

    // ========================================
    // 7. CENTRAL TITLE
    // ========================================
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('UV DEBUG TEXTURE', w / 2, 150);
    ctx.fillText('(WITH CORRECTION)', w / 2, 210);

    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${w}x${h} pixels`, w / 2, 270);
    ctx.fillText(`Offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`, w / 2, 310);

    // ========================================
    // 8. AXIS LABELS
    // ========================================
    ctx.fillStyle = '#0000FF';
    ctx.font = 'bold 32px sans-serif';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u2192 X-AXIS', 150, 100);

    ctx.save();
    ctx.translate(50, 200);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.fillText('\u2192 Y-AXIS', 0, 0);
    ctx.restore();
  }
};
```

## Expected Results

### Before Fix
- Canvas content appears shifted RIGHT
- Text "SPAC" shows as "SP" (left portion cut off)
- Member photo cut off on left side
- Debug markers: Only TOP-RIGHT and BOTTOM-RIGHT corners visible

### After Fix
- Canvas content properly centered on 3D card
- Full text "SPAC" visible
- Member photo fully visible
- Debug markers: All four corners visible correctly

### Offset Values
For a 1024x1024 canvas:
- **X Offset:** ~-0.4px (negligible, nearly centered horizontally)
- **Y Offset:** ~123px DOWN (significant vertical shift)

This compensates for the UV mapping being centered at (0.5, 0.38) instead of (0.5, 0.5).

## Testing

1. **Apply the fix** to `Lanyard.tsx`
2. **Run the development server**
3. **View the 3D lanyard** in browser
4. **Verify** all four corner markers are visible and properly positioned
5. **Check** that the "L" shape orientation marker is centered
6. **Confirm** the cyan UV boundary line at Y=0.757 is visible

## Alternative Fix (If Needed)

If the recommended fix doesn't perfectly center content, try using the UV **centroid** instead:

```typescript
const UV_CENTER_X = 0.387119;  // UV centroid instead of range center
const UV_CENTER_Y = 0.279240;
```

This would give larger offsets:
- X Offset: ~116px RIGHT
- Y Offset: ~226px DOWN

## Next Steps

1. Apply the fix
2. Test with debug texture
3. Once verified, replace `drawDebugTexture()` with actual membership card design
4. Draw member name, title, photo, and SPAC branding at canvas center
5. Content will now appear correctly positioned on 3D model

---

**Analysis Files:**
- `/mnt/c/spac/analyze_uv_mapping.js` - Detailed UV data extraction
- `/mnt/c/spac/visualize_uv_layout.js` - ASCII visualization
- `/mnt/c/spac/UV_ANALYSIS_REPORT.md` - Complete analysis report
- `/mnt/c/spac/UV_FIX_IMPLEMENTATION.md` - This file
