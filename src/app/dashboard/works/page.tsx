import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BudgetChart } from "@/components/works/BudgetChart";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function WorksPage() {
  const projects = await prisma.project.findMany({
    include: {
      works: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Calculate global stats (mocking project total budget since it's not on Project model explicitly in schema shown previously, I'll assume sum of works or add it.
  // Wait, I saw budget on Partner and Work, but checking schema...
  // Work has budget. Project doesn't seem to have a total budget field in the schema snippet I saw earlier (lines 10-27).
  // I will check schema again. If missing, I'll sum Works as "Allocated".
  // Actually, usually a project has a Total Grant. I should have added it.
  // For now, I'll assume "Allocated" is the sum of Works.
  
  const totalAllocated = projects.reduce((acc, p) => acc + p.works.reduce((wAcc, w) => wAcc + w.budget, 0), 0);

  return (
    <div className="flex dashboard-container">
      <Sidebar />
      <div className="flex-1 flex flex-col main-content">
        <Header />
        <main className="dashboard-main max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Financial Overview</h1>
                <p className="text-slate-500">Track budgets across all Erasmus+ projects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Allocated</p>
                            <h3 className="text-2xl font-bold text-slate-900">€{totalAllocated.toLocaleString()}</h3>
                        </div>
                    </div>
                 </div>
                 {/* Placeholders for other stats */}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Projects Budget Status</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Project</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Work Packages</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Budget Allocated</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project) => {
                                const projectAllocated = project.works.reduce((acc, w) => acc + w.budget, 0);
                                return (
                                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {project.title}
                                            <span className="block text-xs text-slate-400 font-normal">{project.acronym}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {project.works.length} WPs
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-slate-700 font-medium">€{projectAllocated.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/dashboard/projects/${project.id}`} 
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                                            >
                                                Manage <ArrowRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {projects.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No projects found.
                        </div>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
