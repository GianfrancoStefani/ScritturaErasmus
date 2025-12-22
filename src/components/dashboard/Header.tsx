"use client";

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="ghost" size="sm" style={{ display: 'none' }} className="mobile-menu-btn"> {/* Hide on desktop, we'll fix responsive later */}
          <Menu size={20} />
        </Button>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>Dashboard</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
            {/* Search Placeholder */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '9999px', width: '16rem' }}>
                <Search size={16} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', width: '100%', fontWeight: 500, color: '#475569' }}
                />
            </div>
        </div>

        <Button variant="ghost" style={{ position: 'relative', color: '#64748b' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', width: '0.5rem', height: '0.5rem', backgroundColor: '#ef4444', borderRadius: '9999px', border: '2px solid white' }}></span>
        </Button>
      </div>
    </header>
  );
}
