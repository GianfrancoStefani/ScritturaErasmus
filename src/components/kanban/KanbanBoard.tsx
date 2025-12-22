"use client";

import React, { useState, useEffect, useOptimistic, useTransition } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { updateModuleStatus } from '@/app/actions/kanban';
import { useRouter } from 'next/navigation';

export type ModuleStatus = 'TO_DONE' | 'UNDER_REVIEW' | 'DONE' | 'AUTHORIZED';

export interface ModuleTask {
  id: string;
  title: string;
  subtitle?: string;
  status: ModuleStatus;
  user: string; // assigned user
  projectTitle?: string;
}

const defaultCols: { id: ModuleStatus; title: string }[] = [
  { id: 'TO_DONE', title: 'To Do' },
  { id: 'UNDER_REVIEW', title: 'Under Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'AUTHORIZED', title: 'Authorized' },
];

export function KanbanBoard({ initialModules }: { initialModules: ModuleTask[] }) {
  // Use optimistic UI for instant feedback
  const [optimisticModules, addOptimisticModule] = useOptimistic(
    initialModules,
    (state, updatedModule: { id: string; status: ModuleStatus }) => {
        return state.map((m) => m.id === updatedModule.id ? { ...m, status: updatedModule.status } : m);
    }
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // Prevent accidental drags
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = defaultCols;

  function findContainer(id: string) {
    if (columns.find((col) => col.id === id)) {
      return id;
    }
    const task = optimisticModules.find((t) => t.id === id);
    return task?.status;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = over ? findContainer(over.id as string) : null;

    if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
    ) {
        setActiveId(null);
        return;
    }

    // It's a valid move to a different column
    const newStatus = overContainer as ModuleStatus;
    const moduleId = active.id as string;

    startTransition(async () => {
        // Optimistic update
        addOptimisticModule({ id: moduleId, status: newStatus });
        
        // Server Action
        await updateModuleStatus(moduleId, newStatus);
        
        // Refresh to get consistent state
        // router.refresh(); // Not strictly needed if revalidatePath works, but safe.
    });

    setActiveId(null);
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={optimisticModules.filter((t) => t.status === col.id)}
                    />
                ))}
            </div>
            
            <DragOverlay>
                {activeId ? (
                   <div className="opacity-80 rotate-2 scale-105">
                        <KanbanCard task={optimisticModules.find((t) => t.id === activeId)!} />
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    </div>
  );
}
