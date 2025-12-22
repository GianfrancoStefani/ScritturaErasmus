"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteActivity } from "@/app/actions/activities";
import { ActivityForm } from "./ActivityForm";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ActivityProps = {
  activity: {
    id: string;
    title: string;
    allocatedAmount: number;
    estimatedStartDate: Date;
    estimatedEndDate: Date;
    venue: string | null;
    expectedResults: string | null;
    taskId: string;
  };
}

export function ActivityItem({ activity }: ActivityProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ActivityForm 
        taskId={activity.taskId} 
        initialData={activity} 
        onSuccess={() => setIsEditing(false)} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="modern-card p-4 flex justify-between items-center bg-white">
       <div>
          <h3 className="font-semibold text-lg text-slate-900">
              {activity.title}
          </h3>
          <div className="text-sm text-slate-500 flex flex-col gap-1 mt-1">
             <div className="flex gap-4">
               <span>€{activity.allocatedAmount.toLocaleString()}</span>
               <span>{format(activity.estimatedStartDate, 'dd MMM yyyy')} - {format(activity.estimatedEndDate, 'dd MMM yyyy')}</span>
             </div>
             {activity.venue && <span>📍 {activity.venue}</span>}
             {activity.expectedResults && <p className="text-slate-600 mt-1 text-sm italic">"{activity.expectedResults}"</p>}
          </div>
       </div>
       <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 size={16} />
          </Button>
          <DeleteButton id={activity.id} onDelete={deleteActivity} />
       </div>
    </div>
  );
}
