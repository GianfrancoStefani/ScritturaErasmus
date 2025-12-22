"use client";

import { useState, useEffect, useTransition } from "react";
import { createContribution, reorderContributions } from "@/app/actions/module-editor";
import { ContributionEditor } from "./ContributionEditor";
import { TextComponentCard } from "./TextComponentCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function ContributionStream({ 
    moduleId, 
    components, 
    currentUserId,
    isManager 
}: { 
    moduleId: string; 
    components: any[]; 
    currentUserId: string;
    isManager: boolean;
}) {
    const [isWriting, setIsWriting] = useState(false);
    const [isPending, startTransition] = useTransition();
    
    // Local state for sorting
    const [orderedComponents, setOrderedComponents] = useState(components);

    // Sync if server props change (but respect local optimisitc updates until reload)
    useEffect(() => {
        setOrderedComponents(components);
    }, [components]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleSubmit(content: string) {
        const formData = new FormData();
        formData.append("moduleId", moduleId);
        formData.append("authorId", currentUserId);
        formData.append("type", "USER_TEXT"); // Default for now, could have selector
        formData.append("content", content);
        
        startTransition(async () => {
             await createContribution(formData);
             setIsWriting(false);
        });
    }

    async function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = orderedComponents.findIndex(i => i.id === active.id);
            const newIndex = orderedComponents.findIndex(i => i.id === over.id);
            const newItems = arrayMove(orderedComponents, oldIndex, newIndex);
            
            setOrderedComponents(newItems);

            // Prepare update payload
            const updatePayload = newItems.map((item, index) => ({
                id: item.id,
                order: index + 1 // 1-based ordering
            }));

            // Trigger server action in background (optimistic UI)
            await reorderContributions(updatePayload);
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            <div className="p-4 border-b bg-white/50 backdrop-blur sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Contributions</h3>
                {!isWriting && (
                    <Button size="sm" onClick={() => setIsWriting(true)}>
                        <Plus size={16} className="mr-1" /> Add
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isWriting && (
                    <ContributionEditor 
                        onSubmit={handleSubmit} 
                        onCancel={() => setIsWriting(false)} 
                    />
                )}
                
                {orderedComponents.length === 0 && !isWriting && (
                    <div className="text-center py-10 text-slate-400 italic">
                        No contributions yet. Start writing!
                    </div>
                )}

                <DndContext 
                    id="dnd-context"
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={orderedComponents.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {orderedComponents.map(comp => (
                            <TextComponentCard 
                                key={comp.id} 
                                component={comp} 
                                currentUserId={currentUserId}
                                isManager={isManager}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
