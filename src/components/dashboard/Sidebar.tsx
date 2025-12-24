"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
    Home, 
    FolderKanban, 
    Users, 
    Settings, 
    LogOut,
    Calendar,
    Wallet,
    Copy,
    Building2
} from "lucide-react";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/kanban', label: 'Kanban Board', icon: FolderKanban },
  { href: '/dashboard/works', label: 'Works & Budget', icon: Wallet },
  { href: '/dashboard/templates', label: 'Templates', icon: Copy }, // Added Templates link
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/partners', label: 'Partners', icon: Users },
  { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { href: '/dashboard/settings', label: 'My Profile', icon: Settings },
];

export function Sidebar({ projects = [] }: { projects?: any[] }) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract Project ID if in project context
  const projectMatch = pathname?.match(/\/dashboard\/projects\/([^\/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  const currentNavItems = navItems.reduce((acc: any[], item) => {
      // Contextualize Partners Link
      if (item.label === 'Partners' && projectId) {
          acc.push({
              ...item,
              label: 'Project Partners',
              href: `/dashboard/projects/${projectId}/partners`,
              activeMatch: (path: string) => path.startsWith(`/dashboard/projects/${projectId}/partners`)
          });
          // Add Team Link after Partners
          acc.push({
             href: `/dashboard/projects/${projectId}/team`,
             label: 'Project Team',
             icon: Users,
             activeMatch: (path: string) => path.startsWith(`/dashboard/projects/${projectId}/team`)
          });
          return acc;
      }
      // Contextualize Works Link
      if (item.label === 'Works & Budget' && projectId) {
           acc.push({
              ...item,
              href: `/dashboard/projects/${projectId}`, // User asked for this specific redirect
              activeMatch: (path: string) => path === `/dashboard/projects/${projectId}` || path.startsWith(`/dashboard/projects/${projectId}/works`)
           });
           return acc;
      }
      acc.push(item);
      return acc;
  }, []);

  const handleProjectSwitch = (newProjectId: string) => {
      if(!newProjectId) {
          router.push('/dashboard');
          return;
      }
      router.push(`/dashboard/projects/${newProjectId}`);
  };

  return (
    <aside className="sidebar">
      {/* Brand & Project Switcher */}
      <div className="flex flex-col gap-2 px-6 py-4 border-b border-slate-700/50">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                E+
            </div>
            <span className="font-bold text-lg tracking-tight">Erasmus<span className="text-indigo-400">Manager</span></span>
         </div>
         
         {projects.length > 0 && (
             <div className="mt-2">
                 <select 
                    value={projectId || ""}
                    onChange={(e) => handleProjectSwitch(e.target.value)}
                    className="w-full bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 p-2 outline-none focus:border-indigo-500"
                    aria-label="Switch Project"
                 >
                     <option value="">My Dashboard</option>
                     {projects.map(p => (
                         <option key={p.id} value={p.id}>
                             {p.acronym}
                         </option>
                     ))}
                 </select>
             </div>
         )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          // Custom match logic or exact match
          const isActive = (item as any).activeMatch 
              ? (item as any).activeMatch(pathname)
              : pathname === item.href;
              
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
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
             <LogOut size={20} />
             <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
