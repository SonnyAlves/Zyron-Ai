import { Settings, Menu } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import ZyronLogo from './ZyronLogo';
import './Header.css';

export default function Header({ viewMode, setViewMode, onSidebarToggle }) {
  return (
    <header className="header">
      {/* Left: Logo + Brand */}
      <div className="header-left">
        <button
          className="header-hamburger"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <ZyronLogo size="sm" showText={false} className="header-logo" />
        <span className="header-title">Zyron AI</span>
      </div>

      {/* Center: Status + Navigation */}
      <div className="header-center">
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="status-text">TEST</span>
        </div>

        <div className="header-nav">
          <button
            className={`header-nav-btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            Graph
          </button>
          <button
            className={`header-nav-btn active ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            Split
          </button>
        </div>
      </div>

      {/* Right: Settings + User */}
      <div className="header-right">
        <button className="header-icon-btn" aria-label="Settings">
          <Settings size={20} />
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
