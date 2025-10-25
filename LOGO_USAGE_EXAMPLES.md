# 🎨 Logo Component - Usage Examples

## Quick Reference

The `Logo` component is fully reusable and customizable. Here are practical examples for different use cases.

---

## 1. Default Usage (In Header)

```jsx
import Logo from './components/Logo'

export default function MainLayout() {
  return (
    <header className="main-header">
      <Logo />  {/* Uses defaults: size="md", href="/", showText={true} */}
    </header>
  )
}
```

**Result**: Medium-sized logo with icon and text "Zyron"

---

## 2. Navbar Logo (Small)

```jsx
<nav className="navbar">
  <Logo size="sm" href="/" />
  {/* Other nav items */}
</nav>
```

**Result**: Compact logo (32px icon, 16px text) - perfect for tight spaces

---

## 3. Hero Section (Large)

```jsx
<section className="hero">
  <Logo size="lg" />
  <h1>Welcome to Zyron AI</h1>
</section>
```

**Result**: Prominent 56px icon, 28px text - draws attention

---

## 4. Footer Logo (Icon Only)

```jsx
<footer className="footer">
  <Logo size="sm" showText={false} />
  <p>&copy; 2024 Zyron AI. All rights reserved.</p>
</footer>
```

**Result**: Just the hexagon icon without text

---

## 5. Custom Brand Text

To display different text, modify the Logo component:

```jsx
// Option 1: Create a variant component
export default function BrandLogo({ text = "Zyron", ...props }) {
  return (
    <Logo {...props}>
      <span className="logo__text">{text}</span>
    </Logo>
  )
}

// Usage
<BrandLogo text="Zyron AI" size="lg" />
```

---

## 6. Sidebar Logo

```jsx
<aside className="sidebar">
  <div className="sidebar-header">
    <Logo size="md" showText={false} />
  </div>
  {/* Navigation items */}
</aside>
```

**Result**: Icon-only for compact sidebar

---

## 7. Landing Page Layout

```jsx
export default function LandingPage() {
  return (
    <>
      <header className="landing-header">
        <Logo size="md" href="/" className="header-logo" />
        <nav>{/* Navigation */}</nav>
      </header>

      <section className="hero">
        <Logo size="xl" showText={true} />
        <h1>AI Neural Network Visualization</h1>
        <p>Experience real-time AI thinking</p>
      </section>

      <footer>
        <Logo size="sm" showText={false} />
        <p>© 2024 Zyron AI</p>
      </footer>
    </>
  )
}
```

---

## 8. Using with Custom Styling

```jsx
<Logo
  size="md"
  className="custom-header-logo"
/>
```

And in your CSS:

```css
.custom-header-logo {
  color: #00D1C1;  /* Cyan color */
  margin-right: 20px;
}

.custom-header-logo:hover {
  filter: drop-shadow(0 8px 16px rgba(0, 209, 193, 0.4));
}
```

---

## 9. Responsive Logo (Different Sizes on Different Screens)

```jsx
export default function ResponsiveLogo() {
  const [size, setSize] = useState('md')

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setSize('sm')
      } else if (window.innerWidth < 768) {
        setSize('md')
      } else {
        setSize('lg')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <Logo size={size} />
}
```

---

## 10. Logo in Modal/Dialog

```jsx
export default function Modal({ isOpen }) {
  if (!isOpen) return null

  return (
    <div className="modal">
      <div className="modal-header">
        <Logo size="md" href="/" />
        <h2>Settings</h2>
      </div>
      {/* Modal content */}
    </div>
  )
}
```

---

## 11. Animated Logo Entry

```jsx
export default function AnimatedLogo() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className={`logo-wrapper ${isVisible ? 'visible' : ''}`}>
      <Logo size="lg" />
    </div>
  )
}
```

```css
.logo-wrapper {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.6s ease-out;
}

.logo-wrapper.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 12. Logo with Tooltip

```jsx
export default function LogoWithTooltip() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="logo-tooltip-wrapper">
      <Logo
        size="sm"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="tooltip">Zyron AI - Neural Network Visualizer</div>
      )}
    </div>
  )
}
```

```css
.logo-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #00D1C1;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
}
```

---

## 13. Logo Grid (Multiple Sizes)

```jsx
export default function LogoShowcase() {
  return (
    <div className="logo-grid">
      <div className="logo-item">
        <Logo size="sm" />
        <p>Small (32px)</p>
      </div>
      <div className="logo-item">
        <Logo size="md" />
        <p>Medium (40px)</p>
      </div>
      <div className="logo-item">
        <Logo size="lg" />
        <p>Large (56px)</p>
      </div>
      <div className="logo-item">
        <Logo size="xl" />
        <p>Extra Large (72px)</p>
      </div>
    </div>
  )
}
```

```css
.logo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
}

.logo-item {
  text-align: center;
  padding: 20px;
  background: rgba(0, 209, 193, 0.1);
  border-radius: 8px;
}

.logo-item p {
  font-size: 12px;
  margin-top: 10px;
  color: #888;
}
```

---

## 14. Logo with Loading State

```jsx
export default function LogoWithLoader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000)
  }, [])

  return (
    <div className={`logo-loader ${isLoading ? 'loading' : ''}`}>
      <Logo size="lg" />
    </div>
  )
}
```

```css
.logo-loader {
  position: relative;
}

.logo-loader.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 15. Logo in Navigation Menu

```jsx
export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="menu">
      <div className="menu-header">
        <Logo size="sm" href="/" />
        <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
      </div>

      {isOpen && (
        <ul className="menu-items">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      )}
    </nav>
  )
}
```

---

## Size Reference Chart

| Size | Icon | Text | Gap | Use Case |
|------|------|------|-----|----------|
| `sm` | 32px | 16px | 8px | Navbar, sidebar, compact UI |
| `md` | 40px | 20px | 12px | Header, default (current) |
| `lg` | 56px | 28px | 16px | Hero section, landing page |
| `xl` | 72px | 36px | 20px | Large displays, showcase |

---

## Color Customization

The logo uses a gradient from Cyan to Purple by default:

```css
/* Override the gradient */
.logo__text {
  background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
  /* Or any other gradient */
}
```

---

## Accessibility Features

The Logo component includes:
- ✅ **ARIA Label**: `aria-label="Aller à l'accueil"`
- ✅ **Semantic HTML**: Uses `<a>` for navigation
- ✅ **Focus States**: Visible outline on keyboard focus
- ✅ **Color Contrast**: Meets WCAG standards
- ✅ **Keyboard Navigation**: Fully keyboard accessible

---

## Performance Tips

1. **Use Icon-Only on Mobile**: `showText={false}` reduces rendering
2. **Avoid Multiple Sizes**: Stick to consistent sizing
3. **Cache SVG**: Inline SVG is cached by React
4. **Font Loading**: Fonts loaded once, reused everywhere
5. **Lazy Load**: Logo is lightweight, no lazy loading needed

---

## Component Props Reference

```typescript
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'     // Default: 'md'
  href?: string                         // Default: '/'
  showText?: boolean                    // Default: true
  className?: string                    // Default: ''
}
```

---

**Ready to use the Logo component everywhere in your app!** 🚀

