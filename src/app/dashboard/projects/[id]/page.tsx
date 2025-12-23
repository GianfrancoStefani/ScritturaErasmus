import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Plus, FileText, Layers, Calendar, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteProject } from "@/app/actions/deleteProject";
import { deleteModule } from "@/app/actions/deleteModule";
import { CreateModuleButton, EditModuleButton } from "@/components/modules/ModuleForm";
import { CreateSectionButton } from "@/components/projects/CreateSectionButton";
import { SaveTemplateButton } from "@/components/projects/SaveTemplateButton";
import { ProjectBoard } from "@/components/project/ProjectBoard";
import { auth } from "@/auth";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { NamingChallenge } from "@/components/project/NamingChallenge";

async function getProject(id: string) {
  const moduleInclude = {
    components: {
        include: { comments: true }
    }
  };

  return await prisma.project.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
            modules: { include: moduleInclude, orderBy: { order: 'asc' } },
            works: {
                orderBy: { order: 'asc' },
                include: {
                    modules: { include: moduleInclude, orderBy: { order: 'asc' } },
                    tasks: {
                        include: {
                            modules: { include: moduleInclude, orderBy: { order: 'asc' } },
                            activities: {
                                include: { 
                                    modules: { include: moduleInclude, orderBy: { order: 'asc' } }
                                }
                            }
                        }
                    }
                }
            }
        }
      },
      works: {
        where: { sectionId: null },
        orderBy: { order: 'asc' },
        include: {
          modules: { include: moduleInclude, orderBy: { order: 'asc' } },
          tasks: {
            include: {
              modules: { include: moduleInclude, orderBy: { order: 'asc' } },
              activities: {
                include: { 
                    modules: { include: moduleInclude, orderBy: { order: 'asc' } }
                }
              }
            }
          }
        }
      },
      modules: { 
          where: { sectionId: null }, 
          orderBy: { order: 'asc' },
          include: moduleInclude
      },
      partners: true
    }
  });
}

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const project = await getProject(params.id);

  if (!project) notFound();

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Logo Upload */}
      <ProjectHeader project={project}>
          <CreateSectionButton projectId={project.id} />
          <Link href={`/dashboard/projects/${project.id}/partners`}>
            <Button variant="secondary">Manage Partners</Button>
          </Link>
          <Link href={`/dashboard/projects/${project.id}/timeline`}>
            <Button variant="secondary">Gantt Timeline</Button>
          </Link>
          <Link href={`/dashboard/projects/${project.id}/export`}>
            <Button variant="secondary">Export PDF</Button>
          </Link>
          <SaveTemplateButton projectId={project.id} projectTitle={project.title} />
          <DeleteButton 
            id={project.id} 
            onDelete={deleteProject} 
            redirectAfter="/dashboard/projects"
            confirmMessage="Are you sure you want to delete this ENTIRE project?"
          />
      </ProjectHeader>

      {/* Naming Challenge */}
      {session?.user?.id && (
          <NamingChallenge projectId={project.id} userId={session.user.id} />
      )}

      {/* Project Board (Client Component handling DND and Layout) */}
      <ProjectBoard project={project} />
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-700">{title}</h2>
            {children}
        </div>
    )
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    // Note: This is an async server component so we can't use useState directly in the component body
    // unless we make it a client component. 
    // BUT Section was Server Component. 
    // We should make a client wrapper for the collapsible part OR just use "details/summary".
    // "details" is native and works without client-side JS (mostly).
    
    return (
        <details className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 open:ring-2 open:ring-indigo-100" open={defaultOpen}>
            <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none select-none">
                <div className="flex items-center gap-3">
                     <div className="p-1 bg-white rounded border border-slate-200 text-indigo-600">
                        <Layers size={16} />
                     </div>
                     <span className="font-exbold text-lg text-slate-800">{title}</span>
                </div>
                <div className="transform group-open:rotate-180 transition-transform text-slate-400">
                    <ArrowLeft size={16} className="-rotate-90" />
                </div>
            </summary>
            <div className="p-4 border-t border-slate-100">
                {children}
            </div>
        </details>
    );
}

function WorkPackageCard({ work, index, projectId }: { work: any, index: number, projectId: string }) {
    return (
        <Card className="border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">WP{index+1}: {work.title}</h3>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {work.startDate ? format(new Date(work.startDate), 'MM/yy') : 'N/A'} - {work.endDate ? format(new Date(work.endDate), 'MM/yy') : 'N/A'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <CreateModuleButton parentId={work.id} parentType="WORK" className="text-xs h-8" />
                    <Link href={`/dashboard/works/${work.id}`}>
                        <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            Manage Tasks
                        </Button>
                    </Link>
                </div>
            </div>
            
            {/* WP Modules */}
            {(work.modules.length > 0) && (
                <div className="mb-4 space-y-2">
                        <div className="flex justify-between items-center bg-slate-50 p-1 px-2 rounded">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">General Modules</h4>
                        </div>
                        {work.modules.map((m: any) => <ModuleRow key={m.id} module={m} projectId={projectId} />)}
                </div>
            )}

            {/* Tasks */}
            <div className="pl-4 border-l-2 border-slate-100 space-y-6 mt-4">
                {work.tasks.map((task: any, tIdx: number) => (
                    <div key={task.id}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 text-sm">Task {index+1}.{tIdx+1}:</span>
                                <span className="text-slate-600 text-sm">{task.title}</span>
                            </div>
                            <CreateModuleButton parentId={task.id} parentType="TASK" className="h-6 text-[10px] py-0" />
                        </div>
                        
                        {/* Task Modules */}
                        {task.modules.length > 0 && (
                            <div className="ml-4 space-y-2 mb-2">
                                    {task.modules.map((m: any) => <ModuleRow key={m.id} module={m} projectId={projectId} />)}
                            </div>
                        )}

                        {/* Activities */}
                        {task.activities.length > 0 && (
                                <div className="ml-6 space-y-3 mt-2">
                                {task.activities.map((act: any, aIdx: number) => (
                                    <div key={act.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group/activity">
                                        <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-500 text-xs">Activity {index+1}.{tIdx+1}.{aIdx+1}</span>
                                                <span className="text-slate-800 text-sm font-medium">{act.title}</span>
                                                </div>
                                                <CreateModuleButton parentId={act.id} parentType="ACTIVITY" className="h-6 text-[10px] py-0 opacity-0 group-hover/activity:opacity-100 transition-opacity" />
                                        </div>
                                        {/* Activity Modules */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {act.modules.map((m: any) => <ModuleRow key={m.id} module={m} projectId={projectId} />)}
                                        </div>
                                    </div>
                                ))}
                                </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}


function ModuleCard({ module, projectId }: { module: any, projectId: string }) {
    const contributionsCount = module.components?.length || 0;
    const commentsCount = module.components?.reduce((acc: number, c: any) => acc + (c.comments?.length || 0), 0) || 0;
    
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer group relative flex flex-col h-full">
             <div className="absolute top-2 right-2 flex gap-1 bg-white/80 backdrop-blur rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <EditModuleButton module={module} />
                <DeleteButton 
                    id={module.id} 
                    onDelete={deleteModule.bind(null, projectId)} 
                    className="text-red-500"
                    confirmMessage="Delete this module?"
                />
            </div>
            <Link href={`/dashboard/projects/${projectId}/modules/${module.id}`} className="flex flex-col h-full"> 
                <div className="flex justify-between items-start mb-2">
                    <FileText size={20} className="text-blue-500" />
                    <div className="flex items-center gap-2">
                        <StatusBadge status={module.status} />
                    </div>
                </div>
                <h4 className="font-bold text-slate-800 line-clamp-1 pr-6">{module.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4 flex-1">{module.subtitle || "No subtitle"}</p>
                
                <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>Progress</span>
                            <span>{module.completion}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            {/* eslint-disable-next-line react-dom/no-unsafe-inline-style */}
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all" 
                                style={{ width: `${module.completion}%` }} 
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                         <div className="flex items-center gap-1" title="Contributions">
                            <Layers size={14} /> {contributionsCount}
                         </div>
                         <div className="flex items-center gap-1" title="Comments">
                             <FileText size={14} /> {commentsCount}
                         </div>
                         {module.maxChars && (
                             <div className="flex items-center gap-1 ml-auto font-mono text-[10px]">
                                {module.maxChars} ch
                             </div>
                         )}
                    </div>
                </div>
            </Link>
        </Card>
    )
}

function ModuleRow({ module, projectId }: { module: any, projectId: string }) {
    const contributionsCount = module.components?.length || 0;
    const commentsCount = module.components?.reduce((acc: number, c: any) => acc + (c.comments?.length || 0), 0) || 0;

    return (
        <div className="flex items-center justify-between p-2 lg:p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText size={16} className="text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
                <Link href={`/dashboard/projects/${projectId}/modules/${module.id}`} className="min-w-0 flex-1 hover:underline decoration-slate-300 underline-offset-2">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{module.title}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{module.completion}%</span>
                    </div>
                   {module.subtitle && <p className="text-xs text-slate-400 truncate">{module.subtitle}</p>}
                </Link>
            </div>
            
            <div className="flex items-center gap-4 mr-4">
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                     <span className="flex items-center gap-1" title="Contributions"><Layers size={14} /> {contributionsCount}</span>
                     <span className="flex items-center gap-1" title="Comments"><FileText size={14} /> {commentsCount}</span>
                 </div>
            </div>

            <div className="flex items-center gap-2">
                <StatusBadge status={module.status} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditModuleButton module={module} />
                    <Link href={`/dashboard/projects/${projectId}/modules/${module.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2">Open</Button>
                    </Link>
                    <DeleteButton 
                        id={module.id} 
                        onDelete={deleteModule.bind(null, projectId)} 
                        className="text-red-500"
                        redirectAfter={undefined}
                    />
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'TO_DONE': 'bg-slate-100 text-slate-600',
        'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700',
        'DONE': 'bg-green-100 text-green-700',
        'AUTHORIZED': 'bg-blue-100 text-blue-700'
    };
    return (
        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 whitespace-nowrap", colors[status] || colors['TO_DONE'])}>
            {status.replace('_', ' ')}
        </span>
    )
}
