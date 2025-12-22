import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

async function getProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
        _count: {
            select: { modules: true } // simple count for now
        }
    }
  });
  return projects;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, Gianfranco</h1>
            <p className="text-slate-500">Here are your active Erasmus+ projects.</p>
        </div>
        <Link href="/dashboard/projects/new">
            <Button>
                <Plus size={18} className="mr-2" /> New Project
            </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FolderGit2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No projects yet</h3>
            <p className="text-slate-500 mb-6">Create your first Erasmus+ project to get started.</p>
            <Link href="/dashboard/projects/new">
                <Button variant="secondary">Create Project</Button>
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project: any) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500 h-full">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{project.acronym}</span>
                            <span className="text-slate-400 text-xs">Due {format(project.endDate, 'MMM d, yyyy')}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 line-clamp-1" title={project.title}>{project.title}</h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                           National Agency: {project.nationalAgency} | Language: {project.language}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                            <div className="flex -space-x-2">
                                {/* Placeholder for user avatars if we had assignments */}
                                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-bold">GS</div>
                            </div>
                            <div className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                                {project._count.modules} Modules
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
      )}
    </div>
  );
}

