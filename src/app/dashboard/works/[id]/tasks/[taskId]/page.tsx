import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { ActivityItem } from "@/components/activities/ActivityItem";
import Link from "next/link";
import { format } from "date-fns";

export default async function TaskDetailsPage({ params }: { params: { id: string, taskId: string } }) {
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: {
      activities: {
        orderBy: { estimatedStartDate: 'asc' }
      },
      work: {
        include: { project: true }
      },
      // assignments are fetched client-side in TaskAssignments
    }
  });

  if (!task) {
    notFound();
  }

  // Restore partners fetching for ActivityItem
  const partners = await prisma.partner.findMany({
    where: { projectId: task.work.projectId },
    include: { users: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <Link href={`/dashboard/works/${params.id}`} className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
             &larr; Back to {task.work.title}
           </Link>
           <h1 className="text-3xl font-bold text-slate-900">{task.title}</h1>
           <p className="text-slate-500">
             Budget: €{task.budget.toLocaleString()} • {format(task.startDate, 'MMM yyyy')} - {format(task.endDate, 'MMM yyyy')}
           </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Activities</h2>
        
        <div className="grid gap-4">
           {task.activities.map((activity: any) => (
             <ActivityItem 
                key={activity.id} 
                activity={activity} 
                projectId={task.work.projectId}
                partners={partners}
             />
           ))}

           {task.activities.length === 0 && (
             <p className="text-slate-500 italic">No activities created yet.</p>
           )}
        </div>

        {/* Create New Activity Form */}
        <ActivityForm 
            parentId={task.id} 
            projectId={task.work.projectId}
            partners={partners}
        />
      </div>

       {/* Assignments / Resources - MOVED TO ACTIVITY LEVEL */}
       {/* 
       <div className="bg-slate-50 p-4 rounded border border-slate-200">
          <p className="text-sm text-slate-500 italic">User assignments are now managed at the Activity level.</p>
       </div>
       */}
    </div>
  );
}
