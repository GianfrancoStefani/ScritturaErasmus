import prisma from "@/lib/prisma";

import Link from "next/link";
import { ArrowRight, Wallet, PieChart } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const dynamic = 'force-dynamic';

export default async function WorksPage() {
  const projects = await prisma.project.findMany({
    include: {
      works: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  const totalAllocated = projects.reduce((acc, p) => acc + p.works.reduce((wAcc, w) => wAcc + w.budget, 0), 0);
  const totalWorks = projects.reduce((acc, p) => acc + p.works.length, 0);

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
        <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Budget Breakdown by Project</h2>
            </div>
            <div className="table-container border-0 shadow-none rounded-none">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Acronym</th>
                            <th className="text-center">Work Packages</th>
                            <th className="text-right">Allocated Budget</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => {
                             const projectAllocated = project.works.reduce((acc, w) => acc + w.budget, 0);
                             
                             return (
                                <tr key={project.id}>
                                    <td className="font-medium">{project.title}</td>
                                    <td>
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">
                                            {project.acronym}
                                        </span>
                                    </td>
                                    <td className="text-center">{project.works.length}</td>
                                    <td className="text-right font-mono text-slate-700">€{projectAllocated.toLocaleString()}</td>
                                    <td className="text-right">
                                        <Link href={`/dashboard/projects/${project.id}`}>
                                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                Manage <ArrowRight size={14} className="ml-1" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                             );
                        })}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-400">
                                    No projects found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
