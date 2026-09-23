import React, { useState } from 'react';
import { Trophy, CalendarCheck, ShieldCheck, Flame, Users, Lock, Unlock, Menu, X, Target } from 'lucide-react';
import { ASSETS } from '../utils/assets';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isAdmin,
  onOpenAdminModal,
  onLogoutAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'leaderboards', label: 'Leaderboards', icon: Flame },
    { id: 'generator', label: 'Session Match Generator', icon: CalendarCheck, highlight: true },
    { id: 'fixtures', label: 'Fixtures & Results', icon: Users },
    { id: 'scorer', label: '301 Live Scorer', icon: Target },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavClick('standings')}
            className="flex items-center gap-3 cursor-pointer group py-2"
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-red-600 shadow-md shadow-red-950/50 group-hover:border-blue-500 transition-colors">
              <img
                src={ASSETS.mascotLogo}
                alt="The Smoke Box Mascot Bear"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase font-sans">
                  The Smoke <span className="text-red-600">Box</span>
                </span>
                <span className="hidden sm:inline-block text-xs uppercase px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-semibold tracking-widest">
                  301 D.O.
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Darts League · Double Round-Robin
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-inner border border-neutral-700/80 text-red-400'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  } ${item.highlight && !isActive ? 'border border-red-900/40 text-neutral-300' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : item.highlight ? 'text-blue-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Admin Access Button */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/80 rounded-lg px-3 py-1.5">
                <ShieldCheck className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider hidden sm:inline">
                  Admin Mode
                </span>
                <button
                  onClick={onOpenAdminModal}
                  className="ml-1.5 px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors"
                >
                  Portal
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="Lock Admin"
                  className="p-1 hover:text-neutral-200 text-neutral-400 transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950/98 px-4 py-3 space-y-1 shadow-2xl">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white border border-neutral-700 text-red-400'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-blue-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
