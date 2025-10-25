# 🧪 Light Mode Testing Guide

## Quick Start

1. **Navigate to**: http://localhost:5173
2. **Open DevTools**: F12 or Right-click → Inspect
3. **Go to**: Console tab
4. **Clear console**: `console.clear()`
5. **Look for toggle**: Top-left corner, should see a smooth toggle with 🌙 or ☀️

---

## Step-by-Step Test

### Step 1: Verify Toggle Visual
- **Expected**: Smooth pill-shaped toggle with icon
- **Position**: Top-left corner
- **Icon in Dark Mode**: 🌙 (moon)
- **Icon in Light Mode**: ☀️ (sun)
- **Appearance**: Dark gradient background with white slider

### Step 2: Click Toggle to Light Mode
1. Click the toggle
2. **Watch the console** for logs (should see 4-5 lines)
3. **Observe canvas**:
   - Background should change to light gray-blue (#F5F7FA)
   - Neural network nodes should become VISIBLE with dark colors
   - Connection lines should become VISIBLE with dark colors
   - Starfield should DISAPPEAR
   - Icon should change to ☀️

### Step 3: Console Verification
After clicking Light mode, you should see:
```
🔄 [Controls] Toggle clicked - switching to light
🎨 [NeuralNetwork] NUCLEAR updateMode() - Switching to: light
✨ Switching to LIGHT mode
  → Removing old meshes...
  → Recreating network visualization...
✅ Mode switched successfully to: light
```

### Step 4: Visual Inspection
**Light Mode Checklist**:
- [ ] Canvas background is light gray-blue (NOT pure white)
- [ ] Nodes are visible and DARK colored
- [ ] Connections are visible and DARK colored
- [ ] Starfield is gone
- [ ] No blank/white screen
- [ ] Everything is interactive (can rotate camera)

### Step 5: Hover Effects
1. Hover over toggle
2. **Expected**: Slider enlarges slightly (1.15x) and glows more
3. Click and hold:
   - **Expected**: Slider shrinks slightly (0.95x)

### Step 6: Icon Animations
- **Dark Mode**: Moon should pulse (glow effect every 2 seconds)
- **Light Mode**: Sun should rotate continuously (6-second rotation)

### Step 7: Return to Dark Mode
1. Click toggle again
2. **Console should show**:
   ```
   🔄 [Controls] Toggle clicked - switching to dark
   🎨 [NeuralNetwork] NUCLEAR updateMode() - Switching to: dark
   🌙 Switching to DARK mode
   → Removing old meshes...
   → Recreating network visualization...
   ✅ Mode switched successfully to: dark
   ```
3. **Visual changes**:
   - Background becomes black
   - Nodes become bright & colorful again
   - Connections reappear
   - Starfield reappears
   - Icon changes back to 🌙

---

## Expected Results

### Dark Mode ✓
```
Background:  #000000 (pure black)
Nodes:       Original colors, bright & vibrant
Connections: Subtle, flow visible
Starfield:   Visible with slow rotation
Bloom:       Strong (1.0 strength)
Responsive:  100% interactive
```

### Light Mode ✓
```
Background:  #F5F7FA (light gray-blue)
Nodes:       50% brightness (dark variants)
Connections: 40% brightness (dark variants)
Starfield:   Hidden
Bloom:       Weak (0.15 strength)
Responsive:  100% interactive
```

---

## Common Issues & Solutions

### Issue 1: Toggle doesn't appear
**Solution**:
- Refresh page (F5)
- Check if element is hidden behind other UI
- Check browser DevTools → Elements tab for `.mode-toggle-container`

### Issue 2: Light mode still blank/white
**Solution**:
- Check console for errors
- Make sure `✅ Mode switched successfully to: light` appears
- Try clearing cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
- Check if nodes are being recreated: look for "Recreating network visualization"

### Issue 3: Toggle doesn't animate
**Solution**:
- Make sure CSS was reloaded (hard refresh: Ctrl+F5)
- Check DevTools → Elements → toggle element should have `.mode-toggle.light` or `.mode-toggle.dark` class

### Issue 4: Colors still too bright in light mode
**Solution**:
- This is being handled in `createNodesGeometry()` and `createConnectionsGeometry()`
- If colors are still too bright, the recreate might not be happening
- Check console for "Removing old meshes" and "Recreating network visualization" logs

### Issue 5: Performance issues (lag)
**Solution**:
- This is expected when recreating the entire network
- Should complete in < 100ms
- If slower, check browser performance (DevTools → Performance)

---

## Network Internals

### Shader Uniforms
The shaders still receive `uLightMode` uniform:
```glsl
uniform float uLightMode;  // 1.0 = light, 0.0 = dark
```

But the main effect now comes from color adaptation at geometry creation time, making it more reliable.

### Color Reduction Logic

**Nodes (50% brightness)**:
```javascript
baseColor[r] *= 0.5
baseColor[g] *= 0.5
baseColor[b] *= 0.5
```

**Connections (40% brightness)**:
```javascript
connColor[r] *= 0.4
connColor[g] *= 0.4
connColor[b] *= 0.4
```

---

## Advanced Testing

### Test 1: Rapid Toggling
Click toggle very quickly 10+ times
- **Expected**: No crashes, smooth transitions
- **Performance**: Should stay >30fps

### Test 2: Network Interaction During Mode Switch
While clicking toggle:
- Drag camera
- Zoom
- Rotate
- **Expected**: Still responsive during mesh recreation

### Test 3: Different Color Palettes
1. Switch to a different theme (right panel)
2. Toggle light mode
3. **Expected**: New colors adapted to light mode
4. Toggle back to dark
5. **Expected**: Original bright colors return

### Test 4: Streaming with Mode Switch
1. Type a message to start streaming
2. While streaming, toggle modes
3. **Expected**: New nodes appear in correct colors for current mode

---

## Success Criteria

✅ All of these must be true for "Light Mode Fixed" status:

- [ ] Light mode background is light gray-blue, not white
- [ ] Nodes are visible and dark-colored in light mode
- [ ] Connections are visible and dark-colored in light mode
- [ ] Toggle animates smoothly (0.3s)
- [ ] Toggle icons change (🌙 ↔️ ☀️)
- [ ] Starfield hides/shows based on mode
- [ ] Console logs show correct sequence
- [ ] No JavaScript errors in console
- [ ] No performance issues (>30fps)
- [ ] Can toggle rapidly without issues

---

## Reporting Issues

If light mode still doesn't work:

1. **Take a screenshot** of:
   - Full canvas in light mode
   - Console logs when toggling

2. **Note down**:
   - Browser & version (Chrome 120, Safari 17, etc.)
   - Any error messages in console
   - Steps to reproduce

3. **Check these files were modified**:
   - ✅ NeuralNetwork.js (updateMode function)
   - ✅ Controls.jsx (toggle UI)
   - ✅ styles.css (toggle styles)

---

## File References

- **Toggle Logic**: [Controls.jsx:17-35](frontend/src/components/VisualBrain/Controls.jsx#L17-L35)
- **Mode Switch**: [NeuralNetwork.js:698-763](frontend/src/components/VisualBrain/NeuralNetwork.js#L698-L763)
- **Node Colors**: [NeuralNetwork.js:450-496](frontend/src/components/VisualBrain/NeuralNetwork.js#L450-L496)
- **Connection Colors**: [NeuralNetwork.js:498-555](frontend/src/components/VisualBrain/NeuralNetwork.js#L498-L555)
- **Toggle Styles**: [styles.css:71-220](frontend/src/components/VisualBrain/styles.css#L71-L220)

