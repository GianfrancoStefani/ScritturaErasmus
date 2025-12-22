"use client";

import { useState, useOptimistic, useTransition, useId } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { updateModuleStatus } from '@/app/actions/kanban';

export type ModuleStatus = "TO_DONE" | "UNDER_REVIEW" | "DONE" | "AUTHORIZED";

export interface ModuleTask {
  id: string;
  title: string;
  subtitle: string;
  status: ModuleStatus;
  user?: string;
}

interface KanbanBoardProps {
    initialModules: ModuleTask[];
}

const columns: { id: ModuleStatus; title: string }[] = [
  { id: 'TO_DONE', title: 'To Do' },
  { id: 'UNDER_REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'AUTHORIZED', title: 'Authorized' },
];

export function KanbanBoard({ initialModules }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticModules, setOptimisticModules] = useOptimistic(
      initialModules,
      (state, { id, status }: { id: string; status: ModuleStatus }) => {
          return state.map(m => m.id === id ? { ...m, status } : m);
      }
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string; // Could be a container or a card

    // Check if dropped on a container
    let newStatus: ModuleStatus | null = null;
    if (columns.some(col => col.id === overId)) {
        newStatus = overId as ModuleStatus;
    } else {
        // Dropped on a card, find its status
        const overCard = optimisticModules.find(m => m.id === overId);
        if (overCard) {
            newStatus = overCard.status;
        }
    }

    if (newStatus) {
        const currentModule = optimisticModules.find(m => m.id === activeId);
        if (currentModule && currentModule.status !== newStatus) {
             startTransition(async () => {
                 setOptimisticModules({ id: activeId, status: newStatus! });
                 await updateModuleStatus(activeId, newStatus!);
             });
        }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4 px-2">
        {columns.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-100/50 border border-slate-200/60">
             <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10">
                 <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{col.title}</h3>
                 <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                     {optimisticModules.filter(m => m.status === col.id).length}
                 </span>
             </div>
             <div className="flex-1 p-3 overflow-y-auto">
                 <KanbanColumn 
                    id={col.id} 
                    title={col.title} 
                    tasks={optimisticModules.filter(m => m.status === col.id)} 
                 />
             </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
           <div className="transform rotate-2 opacity-90 cursor-grabbing">
             <KanbanCard task={optimisticModules.find(m => m.id === activeId)!} />
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
