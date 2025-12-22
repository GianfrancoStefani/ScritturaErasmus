"use client";

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, defaultDropAnimationSideEffects, DropAnimation } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SectionItem } from "./SectionItem";
import { WorkPackageItem } from "./WorkPackageItem";
import { ModuleItem } from "./ModuleItem"; // For drag overlay

// Types
type ProjectData = any; // Simplify for now

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function ProjectBoard({ project }: { project: ProjectData }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveType(active.data.current?.type);
        setActiveItem(active.data.current?.module || active.data.current?.work || active.data.current?.section);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);
        setActiveItem(null);
        
        if (!over) return;
        
        // TODO: Implement Reorder / Move logic here
        // We will likely need a Server Action: moveNode(nodeId, overId)
        console.log(`Dropped ${active.data.current?.type} (${active.id}) over ${over.data.current?.type || over.id}`);
    }

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8">
                {/* 1. Render Sections */}
                <div className="space-y-4">
                     {project.sections?.map((section: any) => (
                         <SectionItem key={section.id} section={section} projectId={project.id} />
                     ))}
                </div>

                {/* 2. Render Unassigned Works */}
                {/* Note: Works are NOT in a SortableContext here.
                    To sort works, we need a SortableContext wrapper around them.
                    For now, focusing on rendering structure. */}
                <div className="space-y-4">
                    {project.works?.map((work: any) => (
                        <WorkPackageItem key={work.id} work={work} projectId={project.id} />
                    ))}
                </div>
            </div>

            {mounted && createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        activeType === 'MODULE' ? <ModuleItem module={activeItem} projectId={project.id} /> :
                        activeType === 'SECTION' ? <SectionItem section={activeItem} projectId={project.id} /> :
                        activeType === 'WORK' ? <WorkPackageItem work={activeItem} projectId={project.id} /> :
                        <div className="p-4 bg-white shadow-xl rounded border">Dragging {activeType}...</div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
