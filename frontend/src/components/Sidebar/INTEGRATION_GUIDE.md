# Sidebar Integration Guide

Complete guide to integrating the production-grade Sidebar component into your Zyron AI application.

## Overview

The Sidebar component provides a SOTA (state-of-the-art) conversation management interface with:
- Fuzzy search with cmdk
- Date-based conversation grouping (Today/Yesterday/Last 7 days/Older)
- Hover-triggered action menus (Rename/Delete)
- Keyboard shortcuts (Cmd+K, Cmd+N, Escape)
- Mobile-responsive full-screen overlay
- Smooth animations and transitions
- Accessibility features (reduced-motion support)

## Components Included

### 1. **Sidebar.jsx** (Main Component)
The main container component that manages:
- Sidebar state (open/collapsed)
- Search dialog state
- Keyboard shortcuts
- Conversation grouping and display

**Props:**
```javascript
{
  conversations: Array,           // Array of conversation objects
  activeConversationId: String,   // Currently active conversation ID
  onSelectConversation: Function, // Handler: (conversation) => void
  onNewConversation: Function,    // Handler: () => void
  onRenameConversation: Function, // Handler: (conversationId) => void
  onDeleteConversation: Function, // Handler: (conversationId) => void
  isOpen: Boolean,                // Sidebar visibility state
  onToggle: Function              // Handler: () => void
}
```

### 2. **ConversationItem.jsx**
Renders individual conversation entries with:
- Title truncation with ellipsis
- Active state indicator (left border)
- Hover-triggered dropdown menu
- Memoized for performance

**Props:**
```javascript
{
  id: String,              // Conversation ID
  title: String,           // Conversation title
  isActive: Boolean,       // Active state
  onClick: Function,       // Handler: () => void
  onRename: Function,      // Handler: (id) => void
  onDelete: Function       // Handler: (id) => void
}
```

### 3. **SearchBar.jsx**
Modal search interface powered by cmdk with:
- Fuzzy search functionality
- Keyboard navigation (Escape to close)
- Search result display
- Empty state messaging

**Props:**
```javascript
{
  conversations: Array,    // Conversations to search
  onSelect: Function,      // Handler: (conversation) => void
  isOpen: Boolean,         // Dialog visibility
  onOpenChange: Function   // Handler: (boolean) => void
}
```

### 4. **SectionHeader.jsx**
Simple section header component for grouping conversations by date.

### 5. **sidebar.css**
Comprehensive stylesheet with:
- SOTA design patterns
- Smooth animations
- Mobile responsive breakpoints (768px)
- Dark mode support (prepared)
- Accessibility features

## Integration Steps

### Step 1: Import the Sidebar

```javascript
import Sidebar from './components/Sidebar/Sidebar';
```

### Step 2: Add State Management

Use Zustand or React Context to manage:
- Conversations list
- Active conversation ID
- Sidebar open/closed state

**Example with Zustand:**

```javascript
import { create } from 'zustand';

export const useConversationStore = create((set) => ({
  conversations: [],
  activeConversationId: null,
  sidebarOpen: true,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),

  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter(c => c.id !== id),
  })),

  renameConversation: (id, newTitle) => set((state) => ({
    conversations: state.conversations.map(c =>
      c.id === id ? { ...c, title: newTitle } : c
    ),
  })),
}));
```

### Step 3: Integrate into MainLayout

```javascript
import Sidebar from './Sidebar/Sidebar';
import { useConversationStore } from '../store/conversationStore';

export default function MainLayout() {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    toggleSidebar,
  } = useConversationStore();

  const handleSelectConversation = (conversation) => {
    setActiveConversationId(conversation.id);
    // Navigate or load conversation
  };

  const handleNewConversation = () => {
    // Create new conversation
    // Add to store
  };

  const handleRenameConversation = (id) => {
    // Show modal or inline edit
    // Update via API and store
  };

  const handleDeleteConversation = (id) => {
    // Show confirmation
    // Delete via API and store
  };

  return (
    <div className="main-layout">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <main className="main-content">
        {/* Rest of layout */}
      </main>
    </div>
  );
}
```

### Step 4: Expected Conversation Object Structure

```javascript
{
  id: "conv_123456",              // Unique identifier
  title: "Debug API authentication",  // Conversation title (50 chars max)
  created_at: "2025-10-27T14:30:00Z",
  updated_at: "2025-10-27T15:45:00Z",
  message_count: 12               // For preview in search
}
```

### Step 5: Handle API Integration

Connect to Supabase or your backend:

```javascript
// Fetch conversations on mount
useEffect(() => {
  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    setConversations(data);
  };

  fetchConversations();
}, []);

// Create new conversation
const handleNewConversation = async () => {
  const { data } = await supabase
    .from('conversations')
    .insert([{
      title: 'New conversation',
      user_id: userId,
    }])
    .select();

  addConversation(data[0]);
  setActiveConversationId(data[0].id);
};

// Rename conversation
const handleRenameConversation = async (id, newTitle) => {
  await supabase
    .from('conversations')
    .update({ title: newTitle })
    .eq('id', id);

  renameConversation(id, newTitle);
};

// Delete conversation
const handleDeleteConversation = async (id) => {
  await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  removeConversation(id);
};
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + N` | New conversation |
| `Escape` | Close search/menus |

## Styling & Customization

### CSS Variables (Future Enhancement)

To customize colors, you can add CSS variables:

```css
:root {
  --sidebar-width: 280px;
  --sidebar-bg: #ffffff;
  --sidebar-text: #1a1a1a;
  --sidebar-border: #e5e5e5;
  --sidebar-hover: #f7f7f7;
  --sidebar-active: #f7f7f7;
  --sidebar-accent: #1a1a1a;
}
```

### Responsive Breakpoint

The sidebar becomes a mobile overlay on screens < 768px:

```css
@media (max-width: 768px) {
  .sidebar {
    /* Full-screen slide-in animation */
  }
}
```

## Performance Optimizations

1. **Memoization**: ConversationItem is memoized to prevent unnecessary re-renders
2. **useMemo**: Conversation grouping is memoized
3. **useCallback**: Event handlers are memoized
4. **Lazy Loading**: Older conversations limited to 5 initially, can expand
5. **Virtual Scrolling**: Ready for implementation with react-virtual if > 50 conversations

## Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels on buttons
- Reduced-motion support (respects prefers-reduced-motion)
- Color contrast WCAG AA compliant
- Focus states visible on all interactive elements

## Mobile Behavior

### < 768px

- Sidebar becomes full-screen overlay
- Hamburger menu toggle in header
- Backdrop click closes sidebar
- Smooth slide-in animation from left
- No search kbd hint on small screens

### > 768px

- Sidebar always visible (fixed left)
- Backdrop hidden
- Toggle button hidden
- Search kbd hints visible

## Testing Checklist

- [ ] Search fuzzy matching works
- [ ] Hover menu appears smoothly
- [ ] Active conversation has visual indicator
- [ ] Collapse/expand animations smooth
- [ ] Mobile overlay works correctly
- [ ] Keyboard shortcuts functional
- [ ] Empty state displays correctly
- [ ] Load more button expands older conversations
- [ ] Rename/delete callbacks fire with correct data
- [ ] No console errors or warnings

## Common Issues & Solutions

### Issue: Sidebar not showing
**Solution**: Check that `isOpen` prop is `true` and z-index isn't blocked by other elements

### Issue: Conversations not updating
**Solution**: Ensure you're calling store methods or passing updated arrays via props

### Issue: Search not fuzzy matching
**Solution**: Verify conversation titles exist and search input receives text

### Issue: Mobile overlay not closing
**Solution**: Check that `onToggle` is properly connected and state is updating

## Next Steps

1. **Integrate with real data**: Connect to Supabase conversations table
2. **Add animations**: Use Framer Motion for advanced transitions
3. **Implement virtualization**: Add react-virtual for 100+ conversations
4. **Add folders/filters**: Extend with conversation organization
5. **Dark mode**: Complete dark mode CSS variants
6. **User preferences**: Save sidebar state (open/closed) to localStorage

## File Locations

```
src/
├── components/
│   └── Sidebar/
│       ├── Sidebar.jsx
│       ├── ConversationItem.jsx
│       ├── SearchBar.jsx
│       ├── SectionHeader.jsx
│       ├── sidebar.css
│       └── INTEGRATION_GUIDE.md ← You are here
├── utils/
│   └── groupConversations.js
└── store/
    └── conversationStore.js (to be created)
```

## Support

For issues or questions:
1. Check this integration guide
2. Review the component code comments
3. Check console for error messages
4. Verify data structure matches expected format

---

**Status**: Production Ready ✅
**Last Updated**: 2025-10-27
**Version**: 1.0.0
