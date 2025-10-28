import { Settings, Menu } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import ZyronLogo from './ZyronLogo';
import './Header.css';

export default function Header({ onSidebarToggle }) {
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
