"use client";

import { createProject } from "@/app/actions/createProject";
import { updateProject } from "@/app/actions/updateProject";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Form State Type
export type ProjectFormState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

interface ProjectFormProps {
    project?: any; // For Edit Mode
    templateId?: string; // For Create from Template
    onClose?: () => void; // For Modal usage
    isEdit?: boolean;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? "Saving..." : (isEdit ? "Save Changes" : "Create Project")}</Button>;
}

export function ProjectForm({ project, templateId, onClose, isEdit = false }: ProjectFormProps) {
    const router = useRouter();

    // Wrap createProject to match useFormState signature if needed, or stick to simple valid action
    // createProject currently redirects, so it might not need state in the same way, but let's unify.
    // Actually createProject returns void/redirect. updateProject returns state.
    // For simplicity, we'll handle them slightly differently or wrap createProject.
    
    // Wrapper for create to matching signature roughly or just use standard action attribute specific to mode
    // But hooks need consistent action.
    
    const [state, formAction] = useFormState<ProjectFormState, FormData>(async (prevState, formData) => {
        if (isEdit && project) {
            return await updateProject(project.id, prevState, formData);
        } else {
             // Create mode
             await createProject(formData);
             return { success: true }; // Won't be reached if redirect happens
        }
    }, null);

    useEffect(() => {
        if (state?.success && isEdit) {
            if (onClose) onClose();
            router.refresh();
        }
    }, [state, isEdit, onClose, router]);

    return (
        <form action={formAction} className="space-y-4">
            {templateId && <input type="hidden" name="templateId" value={templateId} />}
            
            {state?.error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                    {state.error}
                </div>
            )}

            <Input 
                name="title" 
                label="Project Title" 
                placeholder="e.g. Digital Education for All" 
                required 
                defaultValue={project?.title} 
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    name="acronym" 
                    label="Acronym" 
                    placeholder="DIGI-EDU" 
                    required 
                    defaultValue={project?.acronym} 
                />
                <Input 
                    name="nationalAgency" 
                    label="National Agency" 
                    placeholder="IT02" 
                    required 
                    defaultValue={project?.nationalAgency} 
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    name="startDate" 
                    type="date" 
                    label="Start Date" 
                    required 
                    defaultValue={project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : ''} 
                />
                <Input 
                    name="duration" 
                    type="number" 
                    label="Duration (Months)" 
                    placeholder="24" 
                    min="12" 
                    max="36" 
                    required 
                    defaultValue={project?.duration} 
                />
            </div>
            
            <Input 
                name="language" 
                label="Submission Language" 
                placeholder="English" 
                defaultValue={project?.language || "English"} 
            />

            <div className={`pt-4 border-t border-slate-100 flex ${onClose ? 'justify-end' : 'justify-end'} gap-3`}>
                {onClose && (
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                )}
                <SubmitButton isEdit={isEdit} />
            </div>
        </form>
    );
}
