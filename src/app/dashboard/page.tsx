import { Button } from '@/components/ui/Button';
import { Plus, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ProjectList } from '@/components/dashboard/ProjectList';

import { auth } from '@/auth';

async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const projects = await prisma.project.findMany({
    where: {
        members: {
            some: {
                userId: session.user.id
            }
        }
    },
    orderBy: { updatedAt: 'desc' },
    include: {
        modules: true,
        members: true 
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
                <p className="text-slate-500 mt-1">Manage your Erasmus+ projects and proposals.</p>
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
            <ProjectList projects={projects} />
        )}
    </>
  );
}
