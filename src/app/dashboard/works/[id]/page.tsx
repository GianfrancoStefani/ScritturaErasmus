import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskItem } from "@/components/tasks/TaskItem";
import Link from "next/link";
import { format } from "date-fns";

export default async function WorkDetailsPage({ params }: { params: { id: string } }) {
  const work = await prisma.work.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        orderBy: { startDate: 'asc' }
      }
    }
  });

  if (!work) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <Link href="/dashboard/works" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
             &larr; Back to Works
           </Link>
           <h1 className="text-3xl font-bold text-slate-900">{work.title}</h1>
           <p className="text-slate-500">
             Budget: €{work.budget.toLocaleString()} • {format(work.startDate, 'MMM yyyy')} - {format(work.endDate, 'MMM yyyy')}
           </p>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Tasks</h2>
        
        <div className="grid gap-4">
           {work.tasks.map(task => (
             <TaskItem key={task.id} task={task} workId={work.id} />
           ))}

           {work.tasks.length === 0 && (
             <p className="text-slate-500 italic">No tasks created yet.</p>
           )}
        </div>

        {/* Create New Task Form */}
        <TaskForm workId={work.id} />
      </div>
    </div>
  );
}
