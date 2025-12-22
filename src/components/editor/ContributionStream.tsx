"use client";

import { useOptimistic, useState } from "react";
import { createContribution } from "@/app/actions/module-editor";
import { ContributionEditor } from "./ContributionEditor";
import { TextComponentCard } from "./TextComponentCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

    // Filter? Order? Usually already ordered by backend.
    
    async function handleSubmit(content: string) {
        const formData = new FormData();
        formData.append("moduleId", moduleId);
        formData.append("authorId", currentUserId);
        formData.append("type", "USER_TEXT"); // Default for now, could have selector
        formData.append("content", content);
        
        await createContribution(formData);
        setIsWriting(false);
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
                
                {components.length === 0 && !isWriting && (
                    <div className="text-center py-10 text-slate-400 italic">
                        No contributions yet. Start writing!
                    </div>
                )}

                {components.map(comp => (
                    <TextComponentCard 
                        key={comp.id} 
                        component={comp} 
                        currentUserId={currentUserId}
                        isManager={isManager}
                    />
                ))}
            </div>
        </div>
    );
}
