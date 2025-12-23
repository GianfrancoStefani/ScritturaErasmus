import prisma from "@/lib/prisma";

import Link from "next/link";
import { ArrowRight, Wallet, PieChart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorksTable } from "@/components/works/WorksTable";

export const dynamic = 'force-dynamic';

export default async function WorksPage() {
  const projects = await prisma.project.findMany({
    where: {
        isTemplate: false
    },
    include: {
      works: true,
      partners: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  const totalAllocated = projects.reduce((acc: number, p: any) => acc + p.works.reduce((wAcc: number, w: any) => wAcc + w.budget, 0), 0);
  const totalWorks = projects.reduce((acc: number, p: any) => acc + p.works.length, 0);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Works & Budget</h1>
                <p className="text-slate-500 mt-1">Financial overview of all active projects.</p>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                     <Wallet size={24} />
                 </div>
                 <div>
                     <p className="text-sm font-medium text-slate-500">Total Allocated Budget</p>
                     <h3 className="text-2xl font-bold text-slate-900">€{totalAllocated.toLocaleString()}</h3>
                 </div>
            </div>
            
            <div className="card flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <PieChart size={24} />
                 </div>
                 <div>
                     <p className="text-sm font-medium text-slate-500">Active Work Packages</p>
                     <h3 className="text-2xl font-bold text-slate-900">{totalWorks}</h3>
                 </div>
            </div>
        </div>

        {/* Projects Budget Table */}
        <WorksTable projects={projects} />
    </div>
  );
}
