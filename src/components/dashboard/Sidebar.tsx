"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    FolderKanban, 
    Users, 
    Settings, 
    LogOut,
    Calendar,
    Wallet
} from "lucide-react";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/kanban', label: 'Kanban Board', icon: FolderKanban },
  { href: '/dashboard/works', label: 'Works & Budget', icon: Wallet },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/partners', label: 'Partners', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-slate-700/50">
         <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
             E+
         </div>
         <span className="font-bold text-lg tracking-tight">Erasmus<span className="text-indigo-400">Manager</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <Icon size={20} className={clsx("transition-transform group-hover:scale-105", isActive && "text-white")} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
             <LogOut size={20} />
             <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
