"use client";

import React, { useState } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

// Mock Types
export type ModuleStatus = 'TO_DONE' | 'UNDER_REVIEW' | 'DONE' | 'AUTHORIZED';

export interface ModuleTask {
  id: string;
  title: string;
  subtitle?: string;
  status: ModuleStatus;
  user: string; // assigned user
}

const defaultCols: { id: ModuleStatus; title: string }[] = [
  { id: 'TO_DONE', title: 'To Do' },
  { id: 'UNDER_REVIEW', title: 'Under Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'AUTHORIZED', title: 'Authorized' },
];

const initialTasks: ModuleTask[] = [
  { id: 'task-1', title: 'Needs Analysis', subtitle: 'Describe the background', status: 'TO_DONE', user: 'GS' },
  { id: 'task-2', title: 'Target Group', subtitle: 'Define primary target', status: 'TO_DONE', user: 'JD' },
  { id: 'task-3', title: 'Methodology', status: 'UNDER_REVIEW', user: 'GS' },
  { id: 'task-4', title: 'Impact', status: 'DONE', user: 'AB' },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<ModuleTask[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = defaultCols;

  function findContainer(id: string) {
    if (columns.find((col) => col.id === id)) {
      return id;
    }
    const task = tasks.find((t) => t.id === id);
    return task?.status;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
    ) {
        return;
    }

    // Move task to new specific container status
    setTasks((prev) => {
        const activeItems = prev.filter((t) => t.status === activeContainer);
        const overItems = prev.filter((t) => t.status === overContainer);

        // Find index in main list? No, we filter by status. 
        // Simplification: We update the status of the dragged item to the overContainer 
        // IF we are dragging over a Column directly, or dragging over a Card in a different column.
        
        // This logic handles "preview" during drag.
        const activeIndex = prev.findIndex((t) => t.id === active.id);
        const newStatus = overContainer as ModuleStatus;

        if (prev[activeIndex].status !== newStatus) {
            const newTasks = [...prev];
            newTasks[activeIndex] = { ...newTasks[activeIndex], status: newStatus };
            return newTasks;
        }
        return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = over ? findContainer(over.id as string) : null;

    if (
        activeContainer &&
        overContainer &&
        activeContainer === overContainer
    ) {
        // Reordering within same column
        const activeIndex = tasks.findIndex((t) => t.id === active.id);
        const overIndex = tasks.findIndex((t) => t.id === over.id);

        if (activeIndex !== overIndex) {
            setTasks((items) => arrayMove(items, activeIndex, overIndex));
        }
    }

    setActiveId(null);
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasks.filter((t) => t.status === col.id)}
                    />
                ))}
            </div>
            
            <DragOverlay>
                {activeId ? (
                   <div className="opacity-80 rotate-2 scale-105">
                        <KanbanCard task={tasks.find((t) => t.id === activeId)!} />
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    </div>
  );
}
