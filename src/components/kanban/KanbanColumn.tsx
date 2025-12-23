"use client";

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { ModuleTask } from './KanbanBoard';
import { ChevronRight, Layers } from 'lucide-react';
import { useMemo } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: ModuleTask[];
  groupBySection?: boolean;
  onPreview?: (task: ModuleTask) => void;
}

export function KanbanColumn({ id, title, tasks, groupBySection, onPreview }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const groupedTasks = useMemo(() => {
      if (!groupBySection) return null;
      
      const groups: Record<string, ModuleTask[]> = {};
      const order: string[] = []; 
      
      tasks.forEach(task => {
          const sectionKey = task.sectionTitle || "General Modules";
          if (!groups[sectionKey]) {
              groups[sectionKey] = [];
              order.push(sectionKey);
          }
          groups[sectionKey].push(task);
      });
      
      return { groups, order };
  }, [tasks, groupBySection]);

  return (
    <div ref={setNodeRef} className="flex flex-col flex-1 min-h-[150px] gap-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {groupBySection && groupedTasks ? (
                groupedTasks.order.map(section => (
                    <details key={section} open className="group/section mb-2">
                        <summary className="flex items-center gap-2 mb-2 cursor-pointer list-none select-none text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors">
                            <ChevronRight size={12} className="transition-transform group-open/section:rotate-90" />
                            {section}
                        </summary>
                        <div className="pl-2 border-l border-slate-200/60 flex flex-col gap-3">
                            {groupedTasks.groups[section].map(task => (
                                <KanbanCard key={task.id} task={task} onPreview={onPreview} />
                            ))}
                        </div>
                    </details>
                ))
            ) : (
                tasks.map((task) => (
                    <KanbanCard key={task.id} task={task} onPreview={onPreview} />
                ))
            )}
        </SortableContext>
    </div>
  );
}
