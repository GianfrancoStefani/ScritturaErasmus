import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import prisma from "@/lib/prisma";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteProject } from "@/app/actions/deleteProject";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { isTemplate: false },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { modules: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">All Projects</h1>
        <Link href="/dashboard/projects/new">
            <Button className="gap-2">
                <Plus size={18} /> New Project
            </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: any) => (
             <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500 h-full">
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{project.acronym}</span>
                        <span className="text-slate-400 text-xs">{format(project.updatedAt, 'MMM d, yyyy')}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{project.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                        {project.titleEn}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{project._count.modules} Modules</span>
                            <span>•</span>
                            <span>{project.language}</span>
                        </div>
                        <DeleteButton 
                            id={project.id} 
                            onDelete={deleteProject} 
                            confirmMessage="Are you sure you want to delete this project? All associated data will be lost."
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        />
                    </div>
                </Card>
            </Link>
        ))}
        {projects.length === 0 && (
             <div className="col-span-full text-center py-12 text-slate-500 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                <p className="mb-4">No projects found. Start by creating one!</p>
             </div>
        )}
      </div>
    </div>
  );
}
