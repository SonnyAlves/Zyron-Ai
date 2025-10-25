# Zyron AI - Complete Integration Guide

## Overview

This guide covers the complete Zyron AI application with Visual Brain + ChatInterface + FastAPI streaming backend.

### What's Integrated:
✅ **Visual Brain** - 3D neural network visualization with Three.js
✅ **Chat Interface** - Real-time streaming responses from Claude
✅ **FastAPI Backend** - Anthropic Claude API integration
✅ **View Modes** - Graph/Chat/Split with keyboard shortcuts
✅ **Dark/Light Mode** - Full theme support

---

## Quick Start

### 1. Prerequisites
```bash
# Python 3.9+
python --version

# Node.js 16+
node --version
npm --version
```

### 2. Environment Setup

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

**Get Anthropic API Key:**
1. Visit https://console.anthropic.com
2. Create/find your API key
3. Add to `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start the Application

**Option A: Using the dev script (recommended)**
```bash
cd /Users/sonnyalves/Documents/Zyron-Ai
./dev
```

**Option B: Manual startup**

Terminal 1 - Backend:
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

---

## Features & Usage

### View Modes

Press these keys to switch views (don't require focus):

| Key | Mode | Description |
|-----|------|-------------|
| **G** | Graph | Full-screen Visual Brain |
| **C** | Chat | Full-screen Chat interface |
| **S** | Split | Side-by-side (default) |

Or click the buttons in the header: **📊 Graph** | **⬌ Split** | **💬 Chat**

### Chat Input

- Type your message
- Press **Ctrl+Enter** or click **↗️ Send**
- Watch Claude stream responses in real-time
- Visual Brain pulses with each token received

### Visual Brain Controls

- **Dark/Light Toggle**: Top-left control
- **Pause Animation**: Temporarily freeze the neural network
- **Formation**: Cycle through different node arrangements
- **Reset Camera**: Center and reset the 3D view
- **Node Clicking**: Click nodes for interaction

### Keyboard Shortcuts (while chat is unfocused)

| Key | Action |
|-----|--------|
| **G** | Switch to Graph view |
| **C** | Switch to Chat view |
| **S** | Switch to Split view |

---

## Architecture

```
Zyron-Ai/
├── backend/
│   ├── main.py              # FastAPI + Claude streaming
│   ├── requirements.txt      # Python dependencies
│   ├── .env                 # API keys (git-ignored)
│   └── .venv/              # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainLayout.jsx      # Main app container + view modes
│   │   │   ├── VisualBrain/        # 3D neural network
│   │   │   │   ├── VisualBrain.jsx
│   │   │   │   ├── NeuralNetwork.js
│   │   │   │   ├── shaders.js
│   │   │   │   └── Controls.jsx
│   │   │   ├── ChatPanelContent.jsx # Chat interface
│   │   │   ├── ZyronLogo.jsx        # Logo component
│   │   │   └── ...
│   │   └── App.jsx
│   ├── public/
│   │   └── logos/
│   │       └── zyron-icon.svg
│   └── package.json
│
└── INTEGRATION_GUIDE.md (this file)
```

### Data Flow

```
User Input (Chat)
       ↓
MainLayout.jsx (streaming)
       ↓
FastAPI Backend (port 8001)
       ↓
Anthropic Claude API
       ↓
Text Stream Response
       ↓
Real-time updates:
  - ChatPanelContent (displays text)
  - VisualBrain (pulses + adds nodes)
```

---

## Configuration

### Backend Settings

**File**: `backend/main.py`

```python
# Model
model="claude-sonnet-4-20250514"

# Response length
max_tokens=1024

# Port
port=8001

# CORS
allow_origins=["*"]  # Change to ["http://localhost:5173"] for production
```

### Frontend Settings

**File**: `frontend/src/components/MainLayout.jsx`

```javascript
// API endpoint
const res = await fetch('http://localhost:8001/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: messageText })
})
```

---

## Troubleshooting

### Backend won't start

**Error**: `ANTHROPIC_API_KEY not found`
```bash
# Check your .env file
cat backend/.env

# Ensure it has:
ANTHROPIC_API_KEY=sk-ant-...
```

**Error**: `Port 8001 already in use`
```bash
# Find process using port 8001
lsof -i :8001

# Kill the process
kill -9 <PID>
```

### Frontend can't connect to backend

**Error**: `Failed to fetch from http://localhost:8001/chat`

1. Verify backend is running: `curl http://localhost:8001/health`
2. Check CORS headers in browser DevTools
3. Ensure firewall allows localhost:8001

### Chat not streaming

**Symptoms**: Response appears all at once, not character-by-character

1. Check browser console for errors (F12 → Console)
2. Verify API key is valid
3. Check backend logs for streaming errors
4. Ensure Claude model is correct (claudex-sonnet-4-20250514)

### Visual Brain not reacting

**Symptoms**: Neural network doesn't pulse when streaming

Check props in MainLayout.jsx:
```javascript
<VisualBrain
  isThinking={isThinking}  // Must be true while streaming
  tokens={tokens}          // Must update with each chunk
  onNodeClick={...}
/>
```

---

## Performance Tips

### Optimize Bundle Size

Current: 747KB JavaScript (200KB gzipped)

To reduce:
1. Code-split Three.js using dynamic imports
2. Lazy load chat history
3. Remove unused Vite plugins

### Streaming Performance

- **Large responses** (5000+ tokens): May slow down animation
- **Solution**: Limit `max_tokens` in backend or batch node updates

### Visual Brain Optimization

- **Too many nodes**: Reduce token batch size in `VisualBrain.jsx`
- **Slow rendering**: Toggle pause button to pause animation while responding

---

## Deployment

### Production Checklist

- [ ] Update CORS origins (remove "*")
- [ ] Set production Claude model
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set max tokens to 2048
- [ ] Use environment variables for sensitive data
- [ ] Build frontend: `npm run build`
- [ ] Deploy backend with process manager (pm2, systemd, etc.)

### Environment Variables

**Backend**:
```
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://zyron.example.com
PORT=8001
```

**Frontend**:
```
VITE_API_URL=https://api.zyron.example.com
VITE_API_PORT=8001
```

---

## Development

### Adding Features

#### New View Mode

1. Add to `MainLayout.jsx`:
```javascript
const [viewMode, setViewMode] = useState('split')
```

2. Add button to header
3. Update CSS grid layout
4. Conditionally render sections

#### New Chat Command

1. Create handler in `MainLayout.jsx`
2. Parse message in backend
3. Return special response format
4. Update `ChatPanelContent.jsx` to display

#### Modify Visual Brain

1. Edit `frontend/src/components/VisualBrain/`
2. Update `NeuralNetwork.js` for logic
3. Update `shaders.js` for visuals
4. Rebuild and test

### Testing

**Backend Tests**:
```bash
cd backend
python -m pytest tests/
```

**Frontend Tests**:
```bash
cd frontend
npm run test
```

---

## Support & Issues

### Common Questions

**Q: Can I use a different Claude model?**
A: Yes, update `model=` in `backend/main.py`

**Q: Can I change the Visual Brain appearance?**
A: Yes, modify colors/nodes in `VisualBrain/NeuralNetwork.js` and `shaders.js`

**Q: How do I save chat history?**
A: Implement database in backend, store in React state on frontend

**Q: Can I add voice input/output?**
A: Yes, use Web Speech API for input, TTS service for output

### Reporting Issues

Include:
- Error message (exact text)
- Browser console output (F12)
- Backend logs
- Steps to reproduce
- Screenshots/videos if helpful

---

## Resources

- **Claude API**: https://docs.anthropic.com
- **Three.js**: https://threejs.org
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev
- **Vite**: https://vitejs.dev

---

## Version Information

- **Node**: 16+
- **Python**: 3.9+
- **React**: 19.1.1
- **Three.js**: 0.180.0
- **FastAPI**: 0.104.1
- **Anthropic SDK**: Latest

---

## License

MIT - See LICENSE file

---

## Changelog

### v1.0.0 (Current)
- ✅ Visual Brain neural network
- ✅ Streaming chat with Claude
- ✅ View mode switching (G/C/S)
- ✅ Dark/Light mode
- ✅ Responsive design

---

Last Updated: 2024-10-24
