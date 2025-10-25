# Zyron AI - Quick Reference Guide

## ⌨️ Keyboard Shortcuts

| Key | Action | Notes |
|-----|--------|-------|
| **G** | 📊 Full Graph View | Hides chat, shows neural network fullscreen |
| **C** | 💬 Full Chat View | Hides graph, shows chat fullscreen |
| **S** | ⬌ Split View | Shows both (default layout) |
| **Ctrl+Enter** | Send Message | Works in chat input field |
| **Escape** | Unfocus Chat | Disables shortcuts, allows typing text with G/C/S |

### How Shortcuts Work
```
In Chat Input (typing):
G, C, S, Ctrl+Enter → Treated as regular text input

Out of Chat Input (not typing):
G → Switch to Graph
C → Switch to Chat
S → Switch to Split
```

---

## 🖱️ View Modes

### 📊 Graph Mode
**Screen**: Full-screen Neural Network
```
┌────────────────────────────────────┐
│ [Logo]      [Graph] [Split] [Chat] │
├────────────────────────────────────┤
│                                    │
│        3D Neural Network           │
│        (Visual Brain)              │
│                                    │
│   - Dark/Light toggle (top-left)   │
│   - Pause animation                │
│   - Reset camera                   │
│                                    │
└────────────────────────────────────┘
```

### 💬 Chat Mode
**Screen**: Full-screen Chat Interface
```
┌────────────────────────────────────┐
│ [Logo]      [Graph] [Split] [Chat] │
├────────────────────────────────────┤
│                                    │
│      Chat with Claude              │
│      (Streaming Responses)         │
│                                    │
│  [Input field]      [Send Button] │
│  Response area...                  │
│                                    │
└────────────────────────────────────┘
```

### ⬌ Split Mode (Default)
**Screen**: 70% Graph + 30% Chat
```
┌────────────────────────────────────┐
│ [Logo]      [Graph] [Split] [Chat] │
├──────────────────────┬──────────────┤
│                      │              │
│   3D Neural Network  │   Chat with  │
│   (Visual Brain)     │   Claude     │
│                      │              │
│   - Pulses on input  │ [Input Box]  │
│   - Shows tokens     │              │
│   - Interactions     │ [Response]   │
│                      │              │
└──────────────────────┴──────────────┘
```

---

## 💬 Chat Commands

### Basic Chat
1. **Type your message**
   ```
   "What is machine learning?"
   "Tell me about Anthropic"
   "Explain quantum computing"
   ```

2. **Send message**
   - Press **Ctrl+Enter**, OR
   - Click **↗️ Send** button

3. **Wait for response**
   - Claude responds in real-time (streaming)
   - Visual Brain pulses while thinking
   - Response appears character-by-character

4. **Clear conversation**
   - Click **✕ Clear** button
   - Starts fresh conversation

---

## 🧠 Visual Brain Features

### Viewing Controls
| Control | Location | Action |
|---------|----------|--------|
| **Dark/Light Toggle** | Top-left of graph | Switch theme |
| **⏸ Pause** | Control panel | Freeze animation |
| **🔄 Formation** | Control panel | Change node layout |
| **↺ Reset** | Control panel | Center camera |
| **Click Nodes** | On graph | Interact with network |

### What You'll See
- **Nodes**: Colored geometric shapes (represent concepts)
- **Connections**: Lines between nodes (relationships)
- **Pulsing**: Animation when AI is thinking
- **New Nodes**: Added for each token received
- **Glow Effects**: Enhanced in dark mode

### Understanding the Visual

```
When you send a message:
Message → Backend → Claude → Streaming tokens
         ↓
    Visual Brain reacts:
    - Pulses (thinking indicator)
    - Adds nodes (one per token)
    - Lines animate (connections)
    - Changes color (response complexity)
```

---

## 🎨 Color Scheme

### Dark Mode (Default)
| Element | Color | Purpose |
|---------|-------|---------|
| Background | #0a0e27 | Deep blue, reduces eye strain |
| Nodes | Multiple bright colors | Easy to distinguish |
| Cyan | #93E3FF | Primary accent |
| Purple | #8B5CF6 | Secondary accent |
| Gold | #FFD979 | Highlight |

### Light Mode
| Element | Color | Purpose |
|---------|-------|---------|
| Background | Light gray/white | Professional look |
| Nodes | Darker colors | Contrast |
| Cyan | #3988FD | Primary accent |
| Purple | #7C3AED | Secondary accent |
| Gold | #F59E0B | Highlight |

---

## 🎯 Quick Tasks

### Task 1: Send a Message
```
1. Type: "Explain AI in one sentence"
2. Press Ctrl+Enter
3. Watch response stream in chat
4. See Visual Brain pulse
5. Read full response
```

### Task 2: Switch to Graph View
```
1. Press G key
2. See chat panel disappear
3. Neural network fills screen
4. Watch nodes animate
5. Press S to return to split view
```

### Task 3: Check Streaming Response
```
1. Send a longer question
2. Watch individual words appear
3. See Visual Brain add nodes continuously
4. Observe smooth animation
5. Wait for completion
```

### Task 4: Toggle Dark Mode
```
1. In Graph view, look top-left
2. Click dark/light toggle
3. Observe color changes
4. Send a message to see in new theme
5. Toggle back if preferred
```

---

## ⚠️ Common Issues & Fixes

### Issue: Chat won't connect to backend
**Solution**:
1. Check backend is running: `curl http://localhost:8001/health`
2. Verify API key in `.env` file
3. Check browser console for errors (F12)
4. Restart both backend and frontend

### Issue: Shortcuts don't work
**Solution**:
1. Click outside the chat input field
2. Make sure you're not typing
3. Try pressing key again
4. Verify Caps Lock is off

### Issue: Visual Brain doesn't show nodes
**Solution**:
1. Check if in Graph or Split view
2. Send a message to trigger response
3. Make sure Three.js loaded (check DevTools)
4. Try refreshing page (F5)

### Issue: Response appears all at once
**Solution**:
1. This may be expected for short responses
2. Try longer question (more tokens)
3. Check DevTools Network tab for streaming
4. Verify server response type is "text/event-stream"

---

## 📱 Mobile Usage

### Best Practices
- **Landscape mode**: Best for visual brain viewing
- **Portrait mode**: Better for chat
- **Use appropriate view**:
  - Type questions in Chat mode (C)
  - View graph in Graph mode (G)
  - Don't use Split on small phones

### Mobile Shortcuts
- **Long-press letters**: May trigger actions unintentionally
- **Escape first**: Click elsewhere before using shortcuts
- **Touch buttons**: More reliable than keyboard on mobile

---

## 🔧 Advanced Features

### Developer Console
```javascript
// Open DevTools (F12 → Console)

// Check main layout state
// (Useful for debugging)

// Monitor network requests
// Watch real-time streaming in Network tab
```

### Browser DevTools Tips
1. **Console Tab**: Check for errors (red text)
2. **Network Tab**: Monitor requests/responses
3. **Application Tab**: Check localStorage
4. **Performance Tab**: Profile loading and streaming

### Backend API
```bash
# Health check
curl http://localhost:8001/health

# Send message
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# View API docs
open http://localhost:8001/docs
```

---

## 📊 Understanding the UI

### Header
```
┌──────────────────────────────────────────┐
│ [Zyron Logo] ... [📊] [⬌] [💬] [Dark/Light]│
└──────────────────────────────────────────┘
   ↑ Identity      ↑ View Mode Buttons
```

### Main Layout
```
┌─────────────────────┐
│   Header (60px)     │  Contains logo + controls
├──────────┬──────────┤
│          │          │
│  Graph   │  Chat    │  Main content area
│  (70%)   │  (30%)   │  70/30 split (customizable)
│          │          │
└──────────┴──────────┘
```

### Chat Interface
```
┌──────────────────────┐
│ Header (Zyron AI)    │
│ [Clear] button       │
├──────────────────────┤
│ Previous messages... │
│                      │
│ Latest response text │
├──────────────────────┤
│ [Input Box ........] │
│ [↗️ Send Button]     │
└──────────────────────┘
```

---

## 🚀 Performance Tips

### For Better Experience
1. **Use Split view**: Balance both features
2. **Dark mode**: Easier on eyes for long sessions
3. **Clear chat**: When response is very long
4. **Modern browser**: Chrome/Firefox/Safari (latest)
5. **Good internet**: For smooth streaming

### Optimization
- Graph animations paused? → Faster chat
- Too many nodes? → Send shorter questions
- Slow response? → Check network (DevTools)
- Battery low? → Use Chat mode (less GPU)

---

## 📚 Reference

### File Locations
- **Frontend**: `frontend/src/components/MainLayout.jsx`
- **Backend**: `backend/main.py`
- **Styles**: `frontend/src/components/MainLayout.css`
- **Docs**: `INTEGRATION_GUIDE.md`, `TESTING_CHECKLIST.md`

### Important URLs
| URL | Purpose |
|-----|---------|
| `http://localhost:5173` | Frontend app |
| `http://localhost:8001` | Backend API |
| `http://localhost:8001/docs` | API documentation |
| `http://localhost:8001/health` | Server status |

### Key Technologies
- **Frontend**: React 19, Three.js, Vite
- **Backend**: FastAPI, Python 3.9+
- **AI**: Anthropic Claude API
- **Styling**: CSS Grid + Flexbox

---

## 🎓 Learning Resources

### Understand the Features
- **View Modes**: Press G/C/S to explore
- **Streaming**: Watch messages appear word-by-word
- **Visual Brain**: See how AI "thinks" visually
- **Responsive**: Resize window to see layout adapt

### Experiment
1. Send different types of questions
2. Toggle dark/light mode during streaming
3. Switch view modes while chatting
4. Observe Visual Brain behavior
5. Try keyboard vs button controls

---

## ✅ Checklist for New Users

- [ ] Understood keyboard shortcuts (G/C/S)
- [ ] Sent first message successfully
- [ ] Saw Visual Brain react
- [ ] Switched between view modes
- [ ] Toggled dark/light mode
- [ ] Read error messages if any
- [ ] Checked browser console (F12)
- [ ] Bookmarked this guide
- [ ] Ready to explore!

---

## 💡 Pro Tips

1. **Ctrl+Enter is faster** than clicking Send
2. **Press G for full-screen thinking** (impressive!)
3. **Dark mode saves battery** on OLED screens
4. **Pause the graph** if it slows down chat
5. **Clear chat** when feeling overwhelmed
6. **Try longer questions** to see more nodes added
7. **Listen for sounds** (if your system has notification sound)
8. **Watch the nodes** for visual feedback

---

## 🆘 Need Help?

1. **Check INTEGRATION_GUIDE.md** for setup issues
2. **Review TESTING_CHECKLIST.md** for verification
3. **Check browser console** (F12) for errors
4. **Verify backend running**: `curl http://localhost:8001/health`
5. **Check API key valid**: Look in `backend/.env`
6. **Restart everything**: Kill servers and restart

---

**Last Updated**: 2024-10-24
**Version**: 1.0
**Status**: Complete & Ready
