"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { ModuleTask } from './KanbanBoard';
import { GripVertical } from 'lucide-react';

interface KanbanCardProps {
  task: ModuleTask;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:shadow-md transition-all cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-30' : 'opacity-100'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-slate-800 line-clamp-2">{task.title}</h4>
        <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={14} />
        </button>
      </div>
      
      {task.subtitle && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.subtitle}</p>
      )}
      
      <div className="flex items-center justify-between mt-2">
         <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
            {task.user}
         </div>
         {/* Placeholder for status indicator color if needed, typically handled by column */}
      </div>
    </div>
  );
}
