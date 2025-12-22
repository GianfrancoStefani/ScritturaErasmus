import prisma from "@/lib/prisma";
import { GanttChart } from "@/components/project/GanttChart";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProjectTimelinePage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            works: {
                include: {
                    tasks: {
                        include: {
                            activities: true
                        },
                        orderBy: { startDate: 'asc' }
                    }
                },
                orderBy: { startDate: 'asc' }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    // Transform Data
    const timelineItems: any[] = project.works.map(work => ({
        id: work.id,
        title: work.title,
        startDate: work.startDate,
        endDate: work.endDate,
        type: 'WORK',
        children: work.tasks.map(task => ({
            id: task.id,
            title: task.title,
            startDate: task.startDate,
            endDate: task.endDate,
            type: 'TASK',
            children: task.activities.map(act => ({
                id: act.id,
                title: act.title,
                startDate: act.estimatedStartDate,
                endDate: act.estimatedEndDate,
                type: 'ACTIVITY',
                children: []
            }))
        }))
    }));

    // Safety checks for null dates? The schema has them as mandatory mostly, but Activity has estimated which are mandatory in Prisma schema?
    // Checking schema: Activity: estimatedStartDate DateTime (Required). Good.
    // However, if data is bad, it might crash. Assuming valid data for now.
    
    // Project dates for grid
    const startDate = project.startDate;
    const endDate = project.endDate;

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)]">
             <div className="mb-4">
                <Link 
                    href={`/dashboard/projects/${params.id}`} 
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-2 w-fit transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Project Overview
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">
                    Project Timeline
                </h1>
            </div>
            
            <div className="flex-1 min-h-0">
                <GanttChart 
                    items={timelineItems} 
                    projectStart={startDate} 
                    projectEnd={endDate} 
                />
            </div>
        </div>
    );
}
