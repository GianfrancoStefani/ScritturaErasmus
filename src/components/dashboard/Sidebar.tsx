"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderGit2, Users, Calendar, Settings, FileText, PieChart } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/projects', label: 'Compilazione Progetti', icon: FileText },
  { href: '/dashboard/partners', label: 'Partners & Users', icon: Users },
  { href: '/dashboard/works', label: 'Works & Budget', icon: PieChart },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="p-6 border-b border-slate-800" style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
        <h1 className="text-xl font-bold">
          Erasmus+ Writer
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4" style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        <ul className="space-y-1 px-3" style={{ listStyle: 'none', padding: '0 0.75rem', margin: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href} style={{ marginBottom: '0.25rem' }}>
                <Link 
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                     // Since we don't have tailwind, we rely on inline styles for active state or define a class
                  )}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: isActive ? 'white' : '#94a3b8',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  <Icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30,41,59,0.5)' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            GS
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Gianfranco Stefani</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Coordinator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
