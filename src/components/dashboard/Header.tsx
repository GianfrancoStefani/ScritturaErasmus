

import { Bell, Search, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { logout } from "@/app/actions/authActions";
import { Button } from "@/components/ui/Button";

export async function Header() {
    const session = await auth();
    const user = session?.user;

    const initials = user?.name ? user.name.split(' ').map((n:string) => n[0]).join('').toUpperCase().substring(0, 2) : 'GS';

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Search Bar - Placeholder */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search projects, modules..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-700">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-slate-500">{user?.email || 'Coordinator'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
            {initials}
          </div>
          
          <form action={logout}>
            <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-600">
                <LogOut size={18} />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
