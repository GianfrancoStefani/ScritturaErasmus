"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { createAbstractModule, updateModuleMetadata } from "@/app/actions/modules";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";

export function SetupAbstractSection({ projectId, abstractModule }: { projectId: string; abstractModule?: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [maxChars, setMaxChars] = useState(abstractModule?.maxChars || 5000);
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async () => {
        setIsLoading(true);
        const res = await createAbstractModule(projectId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Abstract module created!");
            router.refresh();
        }
        setIsLoading(false);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append("id", abstractModule.id);
        formData.append("title", abstractModule.title); 
        formData.append("maxChars", maxChars.toString());
        
        const res = await updateModuleMetadata(null, formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Settings saved");
            router.refresh();
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <FileText size={18} className="text-slate-500" />
                <h3 className="text-lg font-bold text-slate-800">Project Abstract</h3>
            </div>
            
            {abstractModule ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 mb-1">Official Text</p>
                            
                            {abstractModule.components && abstractModule.components.length > 0 ? (
                                <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-200 max-h-40 overflow-y-auto whitespace-pre-wrap mb-3">
                                    {abstractModule.components[0].content || abstractModule.components[0].text || <span className="italic text-slate-400">Empty text...</span>}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic mb-3">No content yet.</p>
                            )}

                            <div className="flex items-center gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Max Characters</label>
                                    <div className="flex gap-2 items-center">
                                        <Input 
                                            type="number" 
                                            value={maxChars} 
                                            onChange={(e) => setMaxChars(parseInt(e.target.value))} 
                                            className="w-24 h-8 text-xs"
                                        />
                                        <Button size="sm" variant="ghost" onClick={handleSaveSettings} disabled={isSaving}>
                                            {isSaving ? "Saving..." : "Save Limit"}
                                        </Button>
                                        {!isSaving && maxChars !== (abstractModule?.maxChars || 5000) && (
                                            <span className="text-[10px] text-amber-500 font-medium animate-pulse">Unsaved</span>
                                        )}
                                        {!isSaving && maxChars === (abstractModule?.maxChars || 5000) && (
                                            <span className="text-[10px] text-green-600 font-bold">SAVED</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link href={`/dashboard/projects/${projectId}/modules/${abstractModule.id}?returnTo=/dashboard/projects/${projectId}/setup`}>
                            <Button variant="outline" size="sm">
                                Open Editor
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200">
                    <p className="text-sm text-slate-500 mb-3">
                        The Abstract module is missing. 
                    </p>
                    <Button onClick={handleCreate} disabled={isLoading} size="sm">
                        <Plus size={16} className="mr-2" /> 
                        {isLoading ? "Creating..." : "Create Abstract"}
                    </Button>
                </div>
            )}
        </div>
    );
}
