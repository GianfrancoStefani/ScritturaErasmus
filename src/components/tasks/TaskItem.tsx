"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteTask } from "@/app/actions/tasks";
import { TaskForm } from "./TaskForm";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { ActivityItem } from "@/components/activities/ActivityItem";
import { ModuleItem } from "@/components/project/ModuleItem";
import { CreateActivityButton } from "@/components/activities/ActivityForm";
import { CreateModuleButton } from "@/components/modules/ModuleForm";
import { ChevronDown, ChevronRight } from "lucide-react";

type TaskProps = {
  task: {
    id: string;
    title: string;
    budget: number;
    startDate: Date;
    endDate: Date;
    workId: string;
    activities?: any[];
    modules?: any[];
  };
  workId: string;
  projectId: string;
  partners: any[];
}

export function TaskItem({ task, workId, projectId, partners }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  if (isEditing) {
    return (
      <TaskForm 
        projectId={projectId}
        workId={workId} 
        initialData={task} 
        onSuccess={() => setIsEditing(false)} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="modern-card overflow-hidden">
        <div className="p-4 flex justify-between items-center bg-white border-b border-slate-100">
            <div className="flex items-center gap-3">
                 <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                 </button>
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
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 size={16} />
                </Button>
                <DeleteButton id={task.id} onDelete={deleteTask.bind(null, task.id, workId)} />
            </div>
        </div>
        
        {isOpen && (
            <div className="bg-slate-50/50 p-4 space-y-4">
                {/* Activities Section */}
                <div>
                     <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Activities</h4>
                        <CreateActivityButton taskId={task.id} className="text-xs h-8" />
                     </div>
                     <div className="space-y-2 pl-2 border-l-2 border-indigo-100 ml-1">
                        {task.activities?.map(activity => (
                             <ActivityItem key={activity.id} activity={activity} projectId={projectId} partners={partners} />
                        ))}
                        {(!task.activities || task.activities.length === 0) && (
                            <p className="text-sm text-slate-400 italic">No activities yet.</p>
                        )}
                     </div>
                </div>

                {/* Modules Section */}
                <div>
                     <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Modules</h4>
                        <div className="flex gap-2">
                            <CreateModuleButton parentId={task.id} parentType="TASK" initialType="TEXT" label="Add Text Module" className="text-xs h-8" />
                            <CreateModuleButton parentId={task.id} parentType="TASK" initialType="POPUP" label="Add Popup Module" className="text-xs h-8" />
                        </div>
                     </div>
                     <div className="space-y-2 pl-2 border-l-2 border-slate-200 ml-1">
                        {task.modules?.map(module => (
                             <ModuleItem key={module.id} module={module} projectId={task.workId} /> // projectId might need to be passed down correctly if ModuleItem needs explicit ProjectId, checking props
                        ))}
                         {(!task.modules || task.modules.length === 0) && (
                            <p className="text-sm text-slate-400 italic">No modules yet.</p>
                        )}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
}
