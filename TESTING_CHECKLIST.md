# Zyron AI - Testing & Verification Checklist

Complete this checklist to verify all features are working correctly.

---

## Pre-Test Setup

### Environment Check
- [ ] Backend `.env` file has valid `ANTHROPIC_API_KEY`
- [ ] Frontend built successfully (`npm run build`)
- [ ] No compilation errors in console
- [ ] Python virtual environment activated
- [ ] All dependencies installed (`npm install`, `pip install -r requirements.txt`)

### Server Status
```bash
# Backend should respond with 200
curl http://localhost:8001/health

# Frontend should load
curl http://localhost:5173
```

- [ ] Backend health check passes
- [ ] Frontend loads without 404 errors

---

## Test 1: Basic Chat Functionality

### Send Simple Message
1. [ ] Open http://localhost:5173
2. [ ] Type "Hello, what are your capabilities?" in chat input
3. [ ] Press Ctrl+Enter to send
4. [ ] Verify:
   - [ ] Input field clears
   - [ ] "Thinking..." indicator appears
   - [ ] Backend logs show message received
   - [ ] Text starts streaming in response area
   - [ ] No errors in browser console

### Verify Streaming
1. [ ] Message contains multiple words
2. [ ] Words appear one-by-one (not all at once)
3. [ ] Response completes within 30 seconds
4. [ ] "Zyron's Response" section shows:
   - [ ] Full response text
   - [ ] Proper formatting
   - [ ] No truncation

### Error Handling
1. [ ] Send empty message (press Send button)
2. [ ] Verify: Send button disabled, no request sent
3. [ ] Backend API key is invalid: Check error message displays

---

## Test 2: Visual Brain Reactivity

### Visual Feedback During Streaming
1. [ ] Type a question that generates long response
2. [ ] While streaming, verify Visual Brain:
   - [ ] Shows "Thinking" indicator (if implemented)
   - [ ] Pulses or animates differently
   - [ ] Adds new nodes for tokens
   - [ ] Animation is smooth (no freezing)

### Token Count
1. [ ] Send a 5-word question
2. [ ] Verify Visual Brain shows roughly 5 nodes added
3. [ ] Send a longer response
4. [ ] Verify more nodes are added proportionally

### Post-Response State
1. [ ] After response completes, verify:
   - [ ] Visual Brain returns to idle state
   - [ ] Send button re-enabled
   - [ ] Input field is active and ready

---

## Test 3: View Mode Switching

### Graph View (Press 'G')
1. [ ] Press **G** key
2. [ ] Verify:
   - [ ] Chat panel disappears
   - [ ] Visual Brain takes full width
   - [ ] **📊 Graph** button shows active
   - [ ] Other buttons show inactive
   - [ ] Smooth transition (no stuttering)

### Chat View (Press 'C')
1. [ ] While in Graph view, press **C**
2. [ ] Verify:
   - [ ] Visual Brain disappears
   - [ ] Chat takes full width
   - [ ] **💬 Chat** button shows active
   - [ ] Can still send messages
   - [ ] Visual Brain doesn't render (saves resources)

### Split View (Press 'S')
1. [ ] From any view, press **S**
2. [ ] Verify:
   - [ ] Both Visual Brain and Chat visible
   - [ ] 70/30 split (graph on left)
   - [ ] **⬌ Split** button shows active
   - [ ] Both components responsive
   - [ ] No overlap or rendering issues

### Button Click Switching
1. [ ] Click **📊 Graph** button → Graph view
2. [ ] Click **💬 Chat** button → Chat view
3. [ ] Click **⬌ Split** button → Split view
4. [ ] Verify same behavior as keyboard shortcuts

### Shortcuts During Typing
1. [ ] Start typing in chat input
2. [ ] Press 'G' while typing (should NOT switch)
3. [ ] Verify: View doesn't change
4. [ ] Finish typing, press Escape or click elsewhere
5. [ ] Now press 'G' (should switch to Graph)

---

## Test 4: UI/UX Features

### Header Elements
1. [ ] **Zyron Logo** visible in top-left
2. [ ] Logo clickable (links to home)
3. [ ] View mode buttons centered-right
4. [ ] Header doesn't cover content
5. [ ] Header styling matches design

### Chat Interface
1. [ ] Input field placeholder visible
2. [ ] Input field focusable
3. [ ] Send button shows correct state:
   - [ ] Enabled when message entered
   - [ ] Disabled while thinking
   - [ ] Shows "⚙️ Thinking..." while processing
   - [ ] Shows "↗️ Send" when idle
4. [ ] Clear button visible and works
5. [ ] Response area scrollable

### Visual Brain Controls
1. [ ] Dark/Light toggle in top-left works
2. [ ] Toggle switches theme visually
3. [ ] Nodes/connections visible in both themes
4. [ ] No visual bugs during mode switch
5. [ ] Graph looks good in both themes

---

## Test 5: Responsive Design

### Desktop (1920x1080)
1. [ ] All elements visible without scrolling
2. [ ] View modes work smoothly
3. [ ] No horizontal scrollbars
4. [ ] Chat input takes full width

### Tablet (768x1024)
1. [ ] Layout adjusts properly
2. [ ] Controls still accessible
3. [ ] Chat doesn't hide important elements
4. [ ] Visual Brain still renders smoothly

### Mobile (375x812)
1. [ ] App loads without errors
2. [ ] Choose preferred view mode (Chat or Graph)
3. [ ] Input field has proper keyboard layout
4. [ ] Buttons are large enough to tap
5. [ ] No horizontal scrolling needed

---

## Test 6: Performance & Stability

### Load Time
- [ ] Page loads in < 5 seconds
- [ ] Visual Brain renders in < 3 seconds
- [ ] No 404 errors for assets

### Rapid Messages
1. [ ] Send 3 messages in quick succession
2. [ ] Each response streams correctly
3. [ ] No visual glitches
4. [ ] No request failures

### Long Responses
1. [ ] Send a question that generates 500+ token response
2. [ ] Visual Brain handles many nodes smoothly
3. [ ] Chat panel displays full response
4. [ ] No memory leaks (check DevTools Memory)

### Browser Console
- [ ] No red errors
- [ ] Warnings are acceptable (e.g., deprecated APIs)
- [ ] Network tab shows successful requests
- [ ] WebSocket/SSE connection working

---

## Test 7: Keyboard Shortcuts

### Shortcut Functionality
- [ ] **G** → Graph view
- [ ] **C** → Chat view
- [ ] **S** → Split view
- [ ] **Ctrl+Enter** → Send message (in chat)
- [ ] **Escape** → Unfocus from shortcuts (should disable G/C/S)

### Shortcut Prevention
1. [ ] Click in chat input
2. [ ] Type: "The letter S is great"
3. [ ] Verify: View doesn't switch to Split
4. [ ] Click outside input
5. [ ] Press **S**: Now should switch to Split

### Keyboard Navigation
- [ ] Tab through buttons works
- [ ] Enter activates focused button
- [ ] Focus indicators visible

---

## Test 8: Dark/Light Mode

### Dark Mode
1. [ ] Visual Brain has dark background
2. [ ] Nodes/connections are bright colors
3. [ ] Chat panel dark background
4. [ ] Text is light colored (readable)
5. [ ] No eye strain during extended use

### Light Mode
1. [ ] Toggle to light mode
2. [ ] Visual Brain has light background
3. [ ] Nodes/connections are dark colors
4. [ ] Chat panel light background
5. [ ] Text is dark colored (readable)
6. [ ] No glaring white background

### Mode Persistence
1. [ ] Switch to light mode
2. [ ] Send a message
3. [ ] Reload page (F5)
4. [ ] Verify mode persists (if implemented)

---

## Test 9: Edge Cases

### Empty/Whitespace Messages
1. [ ] Type only spaces
2. [ ] Click Send
3. [ ] Verify: Request not sent, input cleared

### Very Long Message
1. [ ] Type 5000+ character message
2. [ ] Click Send
3. [ ] Verify: Handles gracefully, no truncation

### Network Issues
1. [ ] Disconnect internet (airplane mode)
2. [ ] Try sending message
3. [ ] Verify: Shows error message
4. [ ] Reconnect
5. [ ] Message sends successfully

### Rapid View Switching
1. [ ] Press G, C, S, G, C, S rapidly
2. [ ] Verify: No visual glitches
3. [ ] Components render correctly each time
4. [ ] No console errors

---

## Test 10: Accessibility

### Keyboard Navigation
1. [ ] Tab through all buttons
2. [ ] All buttons have visible focus
3. [ ] Enter activates focused button
4. [ ] Can reach chat input with Tab

### ARIA Labels
1. [ ] Open DevTools Inspector
2. [ ] Check elements have aria-label
3. [ ] Verify labels are descriptive:
   - [ ] "Full Graph View"
   - [ ] "Split View"
   - [ ] "Full Chat View"

### Screen Reader (optional)
- [ ] Test with VoiceOver (Mac), NVDA (Windows), or mobile
- [ ] All important elements announced
- [ ] Navigation logical

### Color Contrast
- [ ] Check text contrast ratios:
  - [ ] Dark text on light: ≥ 4.5:1
  - [ ] Light text on dark: ≥ 4.5:1
- [ ] No color-only messaging (use icons + text)

---

## Test 11: Browser Compatibility

### Chrome/Edge (Latest)
- [ ] All features work
- [ ] Streaming smooth
- [ ] No console errors

### Firefox (Latest)
- [ ] All features work
- [ ] Streaming smooth
- [ ] No console errors

### Safari (Latest)
- [ ] All features work
- [ ] Streaming smooth
- [ ] No console errors

### Mobile Safari (iOS)
- [ ] Loads without errors
- [ ] Touch interactions work
- [ ] Keyboard appears when needed

---

## Test 12: API Integration

### Backend Health
```bash
curl -X GET http://localhost:8001/health
# Should return: {"status": "healthy"}
```
- [ ] Returns 200 status
- [ ] JSON response valid

### Chat Endpoint
```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
# Should stream responses
```
- [ ] Returns 200 status
- [ ] Content-Type: text/event-stream
- [ ] Data chunks arrive continuously
- [ ] Format correct (data: ...)

### CORS Headers
1. [ ] Open DevTools Network tab
2. [ ] Send a chat message
3. [ ] Check request headers:
   - [ ] Origin header present
   - [ ] Access-Control headers correct
   - [ ] No CORS errors

---

## Test 13: Error Scenarios

### Invalid API Key
1. [ ] Set wrong ANTHROPIC_API_KEY in .env
2. [ ] Restart backend
3. [ ] Try to send message
4. [ ] Verify error message displays
5. [ ] Fix API key, restart, retry (should work)

### Backend Offline
1. [ ] Stop backend server
2. [ ] Try to send message
3. [ ] Verify error shows (can't connect)
4. [ ] Start backend
5. [ ] Message sends successfully

### Slow Network
1. [ ] Throttle network in DevTools (3G)
2. [ ] Send a message
3. [ ] Verify:
   - [ ] Streaming still works (just slower)
   - [ ] Visual Brain responds
   - [ ] No timeout errors

---

## Test 14: Browser DevTools

### Console
- [ ] No red errors
- [ ] Warnings are acceptable
- [ ] No memory leaks (check Memory tab)

### Network
- [ ] All requests 200 (except intentional failures)
- [ ] No failed asset loads
- [ ] SSE connection established
- [ ] Streaming data arriving continuously

### Performance
- [ ] Lighthouse score > 80 (if run)
- [ ] Page load < 3 seconds
- [ ] Streaming responsive (< 100ms latency)

### Application/Storage
- [ ] LocalStorage used correctly
- [ ] No storage quota exceeded errors
- [ ] Session data cleared on logout (if implemented)

---

## Final Sign-Off

### Overall Assessment
- [ ] **Functionality**: All features working as expected
- [ ] **Performance**: Acceptable on all devices
- [ ] **Usability**: Intuitive and easy to use
- [ ] **Accessibility**: Keyboard and screen reader friendly
- [ ] **Compatibility**: Works on target browsers
- [ ] **Stability**: No crashes or major bugs

### Known Issues (if any)
```
Issue 1: [Describe issue]
- Severity: [Low/Medium/High]
- Workaround: [If applicable]

Issue 2: [Describe issue]
- Severity: [Low/Medium/High]
- Workaround: [If applicable]
```

### Test Summary
- **Total Tests**: 14 categories
- **Pass**: ___ / 14
- **Fail**: ___ / 14
- **Date Tested**: [Date]
- **Tested By**: [Name]

### Recommendation
- [ ] **READY FOR DEPLOYMENT** - All tests passed
- [ ] **NEEDS FIXES** - Some tests failed, see above
- [ ] **BLOCKED** - Critical issues prevent deployment

---

## Quick Test Commands

```bash
# Check backend is running
curl http://localhost:8001/health

# Test streaming endpoint
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}'

# Check frontend build
cd frontend && npm run build

# Run frontend dev server
cd frontend && npm run dev

# Check frontend loads
curl http://localhost:5173
```

---

## Test Results Log

```
Date: ________________
Tester: ________________
Build Version: ________________
Browser: ________________
OS: ________________

Test Results:
[Paste results here]

Notes:
[Add any observations]
```

---

**Last Updated**: 2024-10-24
**Status**: Ready for Testing
