import React from 'react';
import { Home, Camera, Sparkles, LayoutDashboard, Settings, Info, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'live', label: 'Live Recognition', icon: Camera },
    { id: 'personalize', label: 'Personalize', icon: Sparkles },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-64 glass-card border-r border-slate-800/80 p-5 flex flex-col justify-between hidden md:flex min-h-screen">
      <div>
        {/* Branding Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-neon-cyan">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
              SIGNYFY<span className="text-cyan-400">X</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wide font-medium">
              AI Sign Language Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 rounded-xl glass-card bg-slate-950/40 border border-slate-800/60 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span>Engine Status</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-500">Phase 3 College Project</p>
      </div>
    </aside>
  );
};
