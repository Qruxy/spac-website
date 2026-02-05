# UV Mapping Analysis Report: 3D Card Texture Issue

## Executive Summary

The 3D card model (`card.glb`) has UV coordinates that **do NOT uniformly cover the 0-1 texture space**. This causes content drawn on a 1024x1024 canvas to appear shifted and cut off on the 3D model.

---

## The Problem

### UV Coordinate Analysis (Mesh 0 - "card")

```
U Range: [0.0008, 1.0000]  → 99.9% coverage (nearly full width)
V Range: [0.0022, 0.7572]  → 75.5% coverage (ONLY 3/4 HEIGHT!)

UV Range Center: (0.5004, 0.3797)  ← NOT at (0.5, 0.5)!
UV Centroid:     (0.3871, 0.2792)  ← Weighted average position
```

### Pixel Coordinates (1024x1024 texture)

```
X Range: [1, 1024] pixels     → Full width ✓
Y Range: [2, 775] pixels      → Only 773px tall (NOT 1024!) ✗

Visible Width:  1023 pixels
Visible Height: 773 pixels    ← 25% of texture space is WASTED

Pixel Center: (512, 389)      ← Center of VISIBLE region
Canvas Center: (512, 512)     ← Where content is currently drawn
```

---

## Root Cause

The GLB model's UV coordinates are **vertically compressed** and **off-center**:

1. **Vertical Compression**: V coordinates only span 0.0022 to 0.7572 (75.5% of texture)
   - Anything drawn below Y=775px is INVISIBLE on the 3D model
   - The bottom 249 pixels (775-1024) are wasted

2. **Vertical Offset**: UV center is at V=0.3797, not V=0.5
   - Content drawn at canvas center (512, 512) appears BELOW the visual center
   - The visible center is at pixel (512, 389) - 123 pixels HIGHER

3. **Horizontal Coverage**: U coordinates span almost full width (good!)
   - X range is essentially complete: [1, 1024]

---

## Visual Representation

```
1024x1024 Canvas Texture               What's Actually Visible on 3D Card
┌─────────────────────────┐            ┌─────────────────────────┐
│ (0,0)         (1024,0)  │            │ (0,0)         (1024,0)  │ ← V=0.0022
│         ┌───────┐       │            │         ┌───────┐       │
│         │WASTED │       │            │         │VISIBLE│       │
│         │ SPACE │       │            │         │ AREA  │       │
│         │       │       │            │         │       │       │
│   389px │  TOP  │       │            │   389px │ (512, │       │
│    ↓    │       │       │            │    ↓    │  389) │       │
├─────────┼───────┼───────┤            ├─────────┼───────┼───────┤
│         │ ✓ ✓ ✓ │       │            │         │ ✓ ✓ ✓ │       │
│   (512, │ VISIBLE       │            │         │VISIBLE│       │
│    512) │ CENTER│       │            │         │ ONLY! │       │
│ Canvas  │ @389px│       │            │         │       │       │
│ Center  │ ✓ ✓ ✓ │       │            │         │       │       │
├─────────┼───────┼───────┤            ├─────────┴───────┴───────┤
│         │WASTED │       │            │ (0,775)      (1024,775) │ ← V=0.7572
│         │ SPACE │       │            └─────────────────────────┘
│         │ BOTTOM│       │            ↓ Everything below this is
│         └───────┘       │            ↓ CUT OFF / NOT VISIBLE!
│ (0,1024)     (1024,1024)│
└─────────────────────────┘
```

---

## The Math Behind the Fix

### Current Issue

When you draw content at canvas center `(512, 512)`:
```javascript
ctx.fillText('CENTER', 512, 512);
```

This maps to UV coordinates:
```
U = 512 / 1024 = 0.5     ✓ Correct (center)
V = 512 / 1024 = 0.5     ✗ Wrong! (below visible center)
```

But the **visible UV center** is at V=0.3797, which is pixel **389**!

### Correct Solution

To draw at the **visible center**, you need offset:

```javascript
const VISIBLE_CENTER_Y = 389;     // Calculated from UV range center
const CANVAS_CENTER = 512;
const offsetY = VISIBLE_CENTER_Y - CANVAS_CENTER;  // = -123 pixels

// Apply transform BEFORE drawing
ctx.translate(0, offsetY);  // Shift UP by 123 pixels
```

---

## Why `ctx.translate()` Isn't Working (Current Code Issue)

Looking at your current code (lines 70-88 in Lanyard.tsx):

```javascript
const VISIBLE_CENTER_X = 325;  // ← WRONG! Should be ~396 (centroid) or 512 (range center)
const VISIBLE_CENTER_Y = 325;  // ← WRONG! Should be 389 (range center) or 286 (centroid)
const CANVAS_CENTER = 512;

const offsetX = VISIBLE_CENTER_X - CANVAS_CENTER;  // = -187px ✗
const offsetY = VISIBLE_CENTER_Y - CANVAS_CENTER;  // = -187px ✗
```

**Problem**: These values (325, 325) appear to be from visual estimation and are INCORRECT.

**Correct values** (based on actual UV data):

### Option 1: Use UV Range Center (Geometric Center)
```javascript
const VISIBLE_CENTER_X = 512;  // UV center: 0.5004 * 1024 = 512
const VISIBLE_CENTER_Y = 389;  // UV center: 0.3797 * 1024 = 389
const offsetX = 0;             // No horizontal offset needed
const offsetY = -123;          // Shift UP by 123 pixels
```

### Option 2: Use UV Centroid (Weighted Average)
```javascript
const VISIBLE_CENTER_X = 396;  // UV centroid: 0.3871 * 1024 = 396
const VISIBLE_CENTER_Y = 286;  // UV centroid: 0.2792 * 1024 = 286
const offsetX = -116;          // Shift LEFT by 116 pixels
const offsetY = -226;          // Shift UP by 226 pixels
```

**Recommendation**: Use **Option 1 (Range Center)** for geometric accuracy.

---

## Complete Solution

### Step 1: Fix the Offset Calculation

Replace lines 64-76 in `/mnt/c/spac/src/components/lanyard/Lanyard.tsx`:

```javascript
// BEFORE (WRONG):
const VISIBLE_CENTER_X = 325;  // ✗ Incorrect
const VISIBLE_CENTER_Y = 325;  // ✗ Incorrect

// AFTER (CORRECT):
// UV Analysis Results (Mesh 0 - "card"):
//   UV Range: U=[0.0008, 1.0000], V=[0.0022, 0.7572]
//   UV Range Center: U=0.5004, V=0.3797
//   Pixel Range Center: (512, 389) for 1024x1024 texture
const VISIBLE_CENTER_X = 512;  // ✓ X is centered
const VISIBLE_CENTER_Y = 389;  // ✓ Y center at 38% (not 50%)
```

This gives you:
```javascript
const offsetX = 512 - 512 = 0;      // No horizontal shift needed
const offsetY = 389 - 512 = -123;   // Shift UP by 123 pixels
```

### Step 2: Verify Texture Settings (ALREADY CORRECT)

Your current texture settings (lines 316-322) are **CORRECT**:

```javascript
tex.flipY = false;                      // ✓ Correct for glTF
tex.wrapS = THREE.ClampToEdgeWrapping;  // ✓ Prevents edge artifacts
tex.wrapT = THREE.ClampToEdgeWrapping;  // ✓ Prevents edge artifacts
tex.colorSpace = THREE.SRGBColorSpace;  // ✓ Correct for color textures
tex.anisotropy = 16;                    // ✓ Good quality
```

**DO NOT CHANGE THESE!** The issue is NOT with texture settings.

---

## Expected Results After Fix

### Before Fix (Current State)
```
Canvas Drawing Position: (512, 512)
Appears on 3D Card at:   Below center (cut off bottom)
Visible UV Position:     V=0.5 (outside visible range if > 0.7572)
```

### After Fix (With offsetY = -123)
```
Canvas Drawing Position: (512, 512) - original
Transform Applied:       (512, 389) - after translate(0, -123)
Appears on 3D Card at:   Dead center ✓
Visible UV Position:     V=0.3797 (center of visible range)
```

---

## Technical Details

### Texture Coordinate System

In glTF/GLB format (and with `flipY = false`):
```
  V=0 (top)
    ↓
  V=0.5 (middle)
    ↓
  V=1.0 (bottom)
```

Your card's UVs:
```
  V=0.0022 (card top edge)
    ↓
  V=0.3797 (card visual center)  ← 389px from top
    ↓
  V=0.7572 (card bottom edge)    ← 775px from top
    ↓
  V > 0.7572 (NOT VISIBLE!)
```

### Why Bottom Content Gets Cut Off

Any canvas content drawn at Y > 775px maps to V > 0.7572, which is **outside the card's UV range**. The card geometry simply doesn't have UV coordinates for that region.

---

## Alternative Solution: Adjust Canvas Drawing Region

If you don't want to use `translate()`, you can adjust where you draw:

```javascript
// Instead of drawing at canvas center (512, 512)
const CARD_CENTER_X = 512;  // Draw at visible UV center
const CARD_CENTER_Y = 389;  // Instead of 512

// Draw content at visible center directly
ctx.fillText('CENTERED TEXT', CARD_CENTER_X, CARD_CENTER_Y);
```

**However**, using `ctx.translate(0, -123)` is cleaner because:
1. All subsequent drawing operations are automatically adjusted
2. You can still use "natural" coordinates (512, 512 for center)
3. Easier to maintain and understand

---

## Summary of Key Values

| Metric | Value | Explanation |
|--------|-------|-------------|
| **UV U Range** | 0.0008 → 1.0000 | 99.9% horizontal coverage ✓ |
| **UV V Range** | 0.0022 → 0.7572 | 75.5% vertical coverage ✗ |
| **Visible Width** | 1023 pixels | Full width used |
| **Visible Height** | 773 pixels | Only 3/4 height used |
| **UV Range Center** | (0.5004, 0.3797) | Geometric center of UV region |
| **Pixel Center** | (512, 389) | Where to draw for visual center |
| **Required Offset X** | 0 pixels | No horizontal adjustment |
| **Required Offset Y** | -123 pixels | Shift UP by 123 pixels |

---

## Code Changes Required

### File: `/mnt/c/spac/src/components/lanyard/Lanyard.tsx`

**Line 70-71** (replace):
```javascript
// OLD:
const VISIBLE_CENTER_X = 325;
const VISIBLE_CENTER_Y = 325;

// NEW:
const VISIBLE_CENTER_X = 512;  // UV range center U = 0.5004
const VISIBLE_CENTER_Y = 389;  // UV range center V = 0.3797
```

That's it! This single change will fix the UV mapping issue.

---

## Verification Steps

After making the change:

1. **Check console output**: Look for the log at line 78:
   ```
   [Lanyard UV] Applying offset: X=0.0px, Y=-123.0px
   ```

2. **Visual verification**:
   - Content should appear centered on the card
   - Nothing should be cut off at the bottom
   - The "L" shape marker should be in the center of the visible card face

3. **Debug texture verification**:
   - The grid coordinate labels should align with the card edges
   - The cyan "UV BOUNDARY" line at Y=775px should be at the bottom edge
   - All four corner markers should be visible on the card

---

## Additional Notes

### Why This Wasn't Obvious

UV coordinates are typically normalized to [0,1] range, but there's no requirement they use the **entire** range. The 3D modeler who created `card.glb` mapped the card face to only the top 75% of the texture, leaving the bottom 25% unused.

This is not uncommon when:
- The model was unwrapped with other elements (back face, edges)
- The UVs were optimized for a specific texture layout
- The original texture was designed for a different aspect ratio

### Can This Be Fixed in the GLB?

Yes, you could re-map the UVs in Blender to span the full [0,1] range, but that would require:
1. Opening the GLB in Blender
2. Selecting the card mesh
3. Re-scaling UVs to fill entire texture space
4. Re-exporting

The software fix (adjusting canvas translation) is much simpler and doesn't require modifying the 3D asset.

---

## Conclusion

The issue is **not** with THREE.CanvasTexture settings. The texture is being applied correctly. The problem is that the **GLB model's UV coordinates don't span the full texture space**, and your canvas drawing needs to account for this offset.

**Fix**: Change `VISIBLE_CENTER_Y` from `325` to `389` (and `VISIBLE_CENTER_X` from `325` to `512`).
