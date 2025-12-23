import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModuleTask } from './KanbanBoard';
import clsx from 'clsx';
import { GripVertical, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button'; // Assuming we have Button, or generic button

interface KanbanCardProps {
  task: ModuleTask;
  onPreview?: (task: ModuleTask) => void;
}

export function KanbanCard({ task, onPreview }: KanbanCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all group relative select-none",
        isDragging ? "z-50 shadow-xl scale-105" : "hover:shadow-md hover:border-indigo-200"
      )}
    >
      {/* Drag Handle & Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPreview && (
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onPreview(task)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                title="Preview Content"
              >
                  <Eye size={14} />
              </button>
          )}
          {task.projectId && (
               <Link href={`/dashboard/projects/${task.projectId}/modules/${task.id}`} passHref legacyBehavior>
                   <a 
                     onPointerDown={(e) => e.stopPropagation()}
                     className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                     target="_blank"
                     title="Open in new tab"
                   >
                       <ExternalLink size={14} />
                   </a>
               </Link>
          )}
          <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
              <GripVertical size={14} />
          </div>
      </div>

      <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider pr-16 truncate">{task.subtitle}</div>
            <div className="font-bold text-slate-800 text-sm leading-snug pr-8">{task.title}</div>
            
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex -space-x-1.5 ">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {task.user?.slice(0,2)}
                    </div>
                </div>
                <div title={task.status} className={clsx(
                    "w-2 h-2 rounded-full",
                    task.status === 'DONE' ? "bg-emerald-400" :
                    task.status === 'AUTHORIZED' ? "bg-blue-500" :
                    task.status === 'UNDER_REVIEW' ? "bg-amber-400" : "bg-slate-300"
                )} />
            </div>
      </div>
    </div>
  );
}
