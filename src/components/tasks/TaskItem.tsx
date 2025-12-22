"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteTask } from "@/app/actions/tasks";
import { TaskForm } from "./TaskForm";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type TaskProps = {
  task: {
    id: string;
    title: string;
    budget: number;
    startDate: Date;
    endDate: Date;
    workId: string;
  };
  workId: string; // redundant but explicit
}

export function TaskItem({ task, workId }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <TaskForm 
        workId={workId} 
        initialData={task} 
        onSuccess={() => setIsEditing(false)} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="modern-card p-4 flex justify-between items-center">
       <div>
          <h3 className="font-semibold text-lg hover:text-indigo-600 transition-colors">
            <Link href={`/dashboard/works/${workId}/tasks/${task.id}`}>
              {task.title}
            </Link>
          </h3>
          <div className="text-sm text-slate-500 flex gap-4 mt-1">
             <span>€{task.budget.toLocaleString()}</span>
             <span>{format(task.startDate, 'dd MMM yyyy')} - {format(task.endDate, 'dd MMM yyyy')}</span>
          </div>
       </div>
       <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 size={16} />
          </Button>
          <DeleteButton id={task.id} onDelete={deleteTask.bind(null, task.id, workId)} />
       </div>
    </div>
  );
}
