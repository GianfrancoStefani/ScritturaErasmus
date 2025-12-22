"use client";

import { useState } from "react";
import { createActivity, updateActivity } from "@/app/actions/activities";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type ActivityData = {
  id?: string;
  title: string;
  allocatedAmount: number;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  venue?: string | null;
  expectedResults?: string | null;
}

interface ActivityFormProps {
  taskId: string;
  initialData?: ActivityData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityForm({ taskId, initialData, onSuccess, onCancel }: ActivityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!initialData;

  async function handleSubmit(formData: FormData) {
    let result;
    if (isEditing && initialData?.id) {
       result = await updateActivity(initialData.id, taskId, formData);
    } else {
       result = await createActivity(taskId, formData);
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
         <h3 className="font-semibold text-lg">{isEditing ? "Edit Activity" : "Add New Activity"}</h3>
         {onCancel && <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <input 
              name="title" 
              type="text" 
              required 
              className="input-field" 
              placeholder="Activity Title" 
              defaultValue={initialData?.title}
            />
        </div>
        
        <div className="flex flex-col gap-1">
             <label className="text-sm font-medium">Allocated Amount</label>
            <input 
              name="allocatedAmount" 
              type="number" 
              step="0.01" 
              required 
              className="input-field" 
              placeholder="0.00"
              defaultValue={initialData?.allocatedAmount}
            />
        </div>

        <div className="flex flex-col gap-1">
             <label className="text-sm font-medium">Venue</label>
            <input 
              name="venue" 
              type="text" 
              className="input-field" 
              placeholder="Location (optional)" 
              defaultValue={initialData?.venue || ""}
            />
        </div>

        <div className="flex flex-col gap-1">
             <label className="text-sm font-medium">Est. Start Date</label>
            <input 
              name="estimatedStartDate" 
              type="date" 
              required 
              className="input-field" 
              defaultValue={initialData?.estimatedStartDate ? format(initialData.estimatedStartDate, "yyyy-MM-dd") : ""}
            />
        </div>

        <div className="flex flex-col gap-1">
             <label className="text-sm font-medium">Est. End Date</label>
            <input 
              name="estimatedEndDate" 
              type="date" 
              required 
              className="input-field" 
              defaultValue={initialData?.estimatedEndDate ? format(initialData.estimatedEndDate, "yyyy-MM-dd") : ""}
            />
        </div>
        
         <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Expected Results</label>
            <textarea 
              name="expectedResults" 
              rows={2} 
              className="input-field" 
              placeholder="Describe expected results..." 
              defaultValue={initialData?.expectedResults || ""}
            />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
         {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>}
         <button type="submit" className="btn btn-primary">{isEditing ? "Update Activity" : "Create Activity"}</button>
      </div>
    </form>
  );
}
