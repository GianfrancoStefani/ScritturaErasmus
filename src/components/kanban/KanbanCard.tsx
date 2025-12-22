import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModuleTask } from './KanbanBoard';
import clsx from 'clsx';
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:shadow-md hover:border-indigo-200 transition-all group relative",
        "flex flex-col gap-2 mb-3 select-none active:cursor-grabbing"
      )}
    >
      <div className="absolute top-2 right-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} />
      </div>

      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{task.subtitle}</div>
      <div className="font-bold text-slate-800 text-sm leading-snug">{task.title}</div>
      
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex -space-x-1.5">
               {/* Avatar placeholder */}
              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {task.user?.slice(0,2)}
              </div>
          </div>
          <div className={clsx(
              "w-2 h-2 rounded-full",
              task.status === 'DONE' ? "bg-emerald-400" :
              task.status === 'AUTHORIZED' ? "bg-blue-500" :
              task.status === 'UNDER_REVIEW' ? "bg-amber-400" : "bg-slate-300"
          )} />
      </div>
    </div>
  );
}
