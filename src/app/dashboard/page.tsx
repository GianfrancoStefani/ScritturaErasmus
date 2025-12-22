import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, FolderGit2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

async function getProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
        _count: {
            select: { modules: true } 
        }
    }
  });
  return projects;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <>
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome back. Here is what's happening today.</p>
            </div>
            <Link href="/dashboard/projects/new">
                <Button className="shadow-lg shadow-indigo-500/20">
                    <Plus size={18} className="mr-2" /> New Project
                </Button>
            </Link>
        </div>

        {projects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                    <FolderGit2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No projects yet</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create your first Erasmus+ project to start managing modules, partners, and budgets.</p>
                <Link href="/dashboard/projects/new">
                    <Button variant="secondary">Create Project</Button>
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                    <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block group">
                        <article className="card h-full flex flex-col relative overflow-hidden group-hover:border-indigo-200 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                                    {project.acronym}
                                </div>
                                <span className="text-slate-400 text-xs font-medium">
                                    {format(project.endDate, 'MMM yyyy')}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {project.title}
                            </h3>
                            
                            <div className="flex gap-2 mb-4 text-xs text-slate-500 font-medium">
                                <span className="px-2 py-1 bg-slate-100 rounded">{project.nationalAgency}</span>
                                <span className="px-2 py-1 bg-slate-100 rounded">{project.language}</span>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-xs text-slate-500 font-medium">
                                    <span className="text-slate-900 font-bold">{project._count.modules}</span> Modules
                                </div>
                                <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    <ArrowRight size={18} />
                                </span>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        )}
    </>
  );
}
