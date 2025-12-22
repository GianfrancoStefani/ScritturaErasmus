"use client";

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { ModuleTask } from './KanbanBoard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: ModuleTask[];
}

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col w-80 bg-slate-100/50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
            {tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 min-h-[150px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
                <KanbanCard key={task.id} task={task} />
            ))}
        </SortableContext>
      </div>
    </div>
  );
}
