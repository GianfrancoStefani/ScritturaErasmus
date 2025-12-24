"use client";

import { useState } from "react";
import { createTask, updateTask } from "@/app/actions/tasks";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/DatePicker";

type TaskData = {
  id?: string;
  title: string;
  budget: number;
  startDate: Date;
  endDate: Date;
}

import { TaskAssignments } from "./TaskAssignments";

interface TaskFormProps {
  workId: string;
  projectId?: string; // Add this
  initialData?: TaskData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ workId, projectId, initialData, onSuccess, onCancel }: TaskFormProps) {
// ...
// Inside render, before buttons:

  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(initialData?.startDate ? format(initialData.startDate, "yyyy-MM-dd") : "");
  const [endDate, setEndDate] = useState(initialData?.endDate ? format(initialData.endDate, "yyyy-MM-dd") : "");
  const router = useRouter();
  const isEditing = !!initialData;

  async function handleSubmit(formData: FormData) {
    let result;
    if (isEditing && initialData?.id) {
       result = await updateTask(initialData.id, workId, formData);
    } else {
       result = await createTask(workId, formData);
    }

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "An error occurred");
    } else {
      setError(null);
      router.refresh(); 
      if (onSuccess) onSuccess();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm mt-4">
      <div className="flex justify-between items-center">
         <h3 className="font-semibold text-lg">{isEditing ? "Edit Task" : "Add New Task"}</h3>
         {onCancel && <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Title</label>
            <input 
              name="title" 
              type="text" 
              required 
              className="input-field" 
              placeholder="Task Title" 
              defaultValue={initialData?.title}
            />
        </div>
        
        <div className="flex flex-col gap-1">
             <label className="text-sm font-medium">Budget</label>
            <input 
              name="budget" 
              type="number" 
              step="0.01" 
              required 
              className="input-field" 
              placeholder="0.00" 
              defaultValue={initialData?.budget}
            />
        </div>

        <DatePicker 
          name="startDate" 
          label="Start Date" 
          required 
          value={startDate}
          onChange={setStartDate}
        />

        <DatePicker 
          name="endDate" 
          label="End Date" 
          required 
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {isEditing && projectId && initialData?.id && (
         <div className="mt-8 border-t pt-4">
             <TaskAssignments taskId={initialData.id} projectId={projectId} />
         </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>}
        <button type="submit" className="btn btn-primary">{isEditing ? "Update Task" : "Create Task"}</button>
      </div>
    </form>
  );
}
