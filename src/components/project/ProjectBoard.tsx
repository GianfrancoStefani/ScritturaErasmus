"use client";

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter, closestCorners, defaultDropAnimationSideEffects, DropAnimation } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SectionItem } from "./SectionItem";
import { WorkPackageItem } from "./WorkPackageItem";
import { ModuleItem } from "./ModuleItem"; 
import { reorderWorks, reorderSections, reorderModules } from "@/app/actions/reorder";

// Types
type ProjectData = any;

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const dragOverlayStyle = {
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    cursor: 'grabbing',
    transform: 'scale(1.02) rotate(3deg)',
    opacity: 0.9,
};

export function ProjectBoard({ project }: { project: ProjectData }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const [sections, setSections] = useState(project.sections || []);
    const [works, setWorks] = useState(project.works || []);

    useEffect(() => {
        console.log(`[ProjectBoard] Project prop updated. Sections: ${project.sections?.length}, Works: ${project.works?.length}`);
        if (project.works?.length > 0) {
             const firstWork = project.works[0];
             console.log(`[ProjectBoard] First Work Modules Order:`, firstWork.modules?.map((m: any) => m.title).join(', '));
        }
        setSections(project.sections || []);
        setWorks(project.works || []);
    }, [project.sections, project.works]);

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

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);
        setActiveItem(null);
        
        if (!over) return;
        
        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const type = active.data.current?.type;
        
        if (type === 'SECTION') {
            setSections((items: any[]) => {
                const oldIndex = items.findIndex(i => i.id === activeId);
                const newIndex = items.findIndex(i => i.id === overId);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Optimistic: Trigger server update
                const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
                reorderSections(updates, project.id);
                
                return newItems;
            });
        } else if (type === 'WORK') {
            setWorks((items: any[]) => {
                const oldIndex = items.findIndex(i => i.id === activeId);
                const newIndex = items.findIndex(i => i.id === overId);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
                reorderWorks(updates, project.id);
                
                return newItems;
            });
        } else if (type === 'MODULE') {
            // 1. Try to find in Sections
            const sourceSection = sections.find((s: any) => s.modules.some((m: any) => m.id === activeId));
            if (sourceSection) {
                const overModuleInSection = sourceSection.modules.find((m: any) => m.id === overId);
                // Ensure we are dropping over a module in the same section
                if (overModuleInSection) {
                     setSections((currentSections: any[]) => {
                        return currentSections.map(section => {
                            if (section.id === sourceSection.id) {
                                const oldIndex = section.modules.findIndex((m: any) => m.id === activeId);
                                const newIndex = section.modules.findIndex((m: any) => m.id === overId);
                                const newModules = arrayMove(section.modules, oldIndex, newIndex);
                                
                                // Server Update
                                const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                                // Dynamic import reorderModules needed or add to import
                                // (I will add import in next step or assuming it's available)
                                // Actually I need to add it to imports first.
                                // For now, let's assume I'll fix imports.
                                
                                return { ...section, modules: newModules };
                            }
                            return section;
                        });
                     });
                     
                     // Calculate updates for server call outside the setter to be clean?
                     // Or just re-calculate indices from the new state?
                     // Doing it inside map is tricky for side effects.
                     // Let's do side effect after state update? No, difficult to get new state.
                     // I will do it "optimistically" inside.
                     
                     // To properly call server, I need the new order.
                     const oldIndex = sourceSection.modules.findIndex((m: any) => m.id === activeId);
                     const newIndex = sourceSection.modules.findIndex((m: any) => m.id === overId);
                     const newModules = arrayMove(sourceSection.modules, oldIndex, newIndex);
                     const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                     // Import helper required:
                     reorderModules(updates, project.id);
                }
                return;
            }

            // 2. Try to find in Works (Direct Modules)
            const sourceWork = works.find((w: any) => w.modules.some((m: any) => m.id === activeId));
            if (sourceWork) {
                 const overInWork = sourceWork.modules.find((m: any) => m.id === overId);
                 if (overInWork) {
                     setWorks((currentWorks: any[]) => {
                         return currentWorks.map(work => {
                             if (work.id === sourceWork.id) {
                                 const oldIndex = work.modules.findIndex((m: any) => m.id === activeId);
                                 const newIndex = work.modules.findIndex((m: any) => m.id === overId);
                                 const newModules = arrayMove(work.modules, oldIndex, newIndex);
                                 return { ...work, modules: newModules };
                             }
                             return work;
                         });
                     });
                     
                     const oldIndex = sourceWork.modules.findIndex((m: any) => m.id === activeId);
                     const newIndex = sourceWork.modules.findIndex((m: any) => m.id === overId);
                     const newModules = arrayMove(sourceWork.modules, oldIndex, newIndex);
                     const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                     reorderModules(updates, project.id);
                 }
                 return;
            }
            
            // 3. Try to find in Tasks (Nested in Works)
            // Flatten tasks search
            let sourceTask: any = null;
            let parentWorkId: string | null = null;
            
            for (const work of works) {
                const task = work.tasks?.find((t: any) => t.modules.some((m: any) => m.id === activeId));
                if (task) {
                    sourceTask = task;
                    parentWorkId = work.id;
                    break;
                }
            }
            
            if (sourceTask && parentWorkId) {
                const overInTask = sourceTask.modules.find((m: any) => m.id === overId);
                if (overInTask) {
                    setWorks((currentWorks: any[]) => {
                        return currentWorks.map(work => {
                            if (work.id === parentWorkId) {
                                return {
                                    ...work,
                                    tasks: work.tasks.map((task: any) => {
                                        if (task.id === sourceTask.id) {
                                             const oldIndex = task.modules.findIndex((m: any) => m.id === activeId);
                                             const newIndex = task.modules.findIndex((m: any) => m.id === overId);
                                             const newModules = arrayMove(task.modules, oldIndex, newIndex);
                                             return { ...task, modules: newModules };
                                        }
                                        return task;
                                    })
                                }
                            }
                            return work;
                        });
                    });
                    
                    const oldIndex = sourceTask.modules.findIndex((m: any) => m.id === activeId);
                    const newIndex = sourceTask.modules.findIndex((m: any) => m.id === overId);
                    const newModules = arrayMove(sourceTask.modules, oldIndex, newIndex);
                    const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                    reorderModules(updates, project.id);
                }
            }
        }
    }

    const handleMoveModule = (moduleId: string, direction: 'UP' | 'DOWN') => {
        console.log(`[ProjectBoard] handleMoveModule ${moduleId} ${direction}`);
        
        // 1. Search in Sections
        let foundInSection = false;
        const newSections = sections.map((section: any) => {
             const index = section.modules.findIndex((m: any) => m.id === moduleId);
             if (index !== -1) {
                 foundInSection = true;
                 const newIndex = direction === 'UP' ? index - 1 : index + 1;
                 if (newIndex >= 0 && newIndex < section.modules.length) {
                     const newModules = arrayMove(section.modules, index, newIndex);
                     const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                     reorderModules(updates, project.id);
                     return { ...section, modules: newModules };
                 }
             }
             return section;
        });

        if (foundInSection) {
            setSections(newSections);
            return;
        }

        // 2. Search in Works
        const newWorks = works.map((work: any) => {
            // A. Direct Modules
            const index = work.modules.findIndex((m: any) => m.id === moduleId);
            if (index !== -1) {
                 const newIndex = direction === 'UP' ? index - 1 : index + 1;
                 if (newIndex >= 0 && newIndex < work.modules.length) {
                     const newModules = arrayMove(work.modules, index, newIndex);
                     const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                     reorderModules(updates, project.id);
                     return { ...work, modules: newModules };
                 }
            }
            
            // B. Task Modules
            const newTasks = work.tasks.map((task: any) => {
                 const tIndex = task.modules.findIndex((m: any) => m.id === moduleId);
                 if (tIndex !== -1) {
                     const newIndex = direction === 'UP' ? tIndex - 1 : tIndex + 1;
                     if (newIndex >= 0 && newIndex < task.modules.length) {
                         const newModules = arrayMove(task.modules, tIndex, newIndex);
                         const updates = newModules.map((m: any, idx: number) => ({ id: m.id, order: idx }));
                         reorderModules(updates, project.id);
                         return { ...task, modules: newModules };
                     }
                 }
                 return task;
            });
            
            return { ...work, tasks: newTasks, modules: work.modules }; // Ensure logic flows correctly if found in tasks
        });
        
        setWorks(newWorks);
    }

    return (
        <DndContext 
            id="project-board-dnd"
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 pb-20">
                {/* 1. Render Sections */}
                <SortableContext 
                    items={sections.map((s: any) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {sections.map((section: any) => (
                            <SectionItem key={section.id} section={section} projectId={project.id} partners={project.partners} members={project.members} onMoveModule={handleMoveModule} />
                        ))}
                    </div>
                </SortableContext>

                {/* 2. Render Unassigned Works */}
                <SortableContext 
                    items={works.map((w: any) => w.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {works.map((work: any) => (
                            <WorkPackageItem key={work.id} work={work} projectId={project.id} partners={project.partners} members={project.members} onMoveModule={handleMoveModule} />
                        ))}
                    </div>
                </SortableContext>
            </div>

            {mounted && createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <div style={dragOverlayStyle}>
                            {activeType === 'MODULE' ? <ModuleItem module={activeItem} projectId={project.id} /> :
                            activeType === 'SECTION' ? <SectionItem section={activeItem} projectId={project.id} /> :
                            activeType === 'WORK' ? <WorkPackageItem work={activeItem} projectId={project.id} /> :
                            <div className="p-4 bg-white shadow-xl rounded border">Dragging {activeType}...</div>}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
