"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createModule, updateModuleMetadata } from "@/app/actions/modules";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";
import { Plus, Edit } from "lucide-react";

const initialState = { error: null, success: false };

export function CreateModuleButton({ parentId, parentType, className }: { parentId: string, parentType: 'PROJECT' | 'WORK' | 'TASK' | 'ACTIVITY', className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <>
            <Button size="sm" onClick={() => setIsOpen(true)} className={className}>
                <Plus size={16} className="mr-1" /> Add Module
            </Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Module">
                <ModuleForm parentId={parentId} parentType={parentType} onClose={() => setIsOpen(false)} />
            </Modal>
        </>
    );
}

export function EditModuleButton({ module, className }: { module: any, className?: string }) {
     const [isOpen, setIsOpen] = useState(false);

     return (
        <>
            <button onClick={() => setIsOpen(true)} className={`text-slate-400 hover:text-indigo-600 transition-colors ${className}`}>
                 <Edit size={16} />
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Module Metadata">
                <ModuleForm module={module} onClose={() => setIsOpen(false)} isEdit />
            </Modal>
        </>
     )
}

function ModuleForm({ parentId, parentType, module, onClose, isEdit = false }: { 
    parentId?: string, 
    parentType?: string, 
    module?: any, 
    onClose: () => void,
    isEdit?: boolean
}) {
    const action = isEdit ? updateModuleMetadata : createModule;
    const [state, formAction] = useFormState(action, initialState);

    useEffect(() => {
        if (state?.success) {
            onClose();
        }
    }, [state, onClose]);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && typeof state.error === 'string' && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>
            )}

            {isEdit && <input type="hidden" name="id" value={module.id} />}
            {!isEdit && (
                <>
                    <input type="hidden" name="parentId" value={parentId} />
                    <input type="hidden" name="parentType" value={parentType} />
                </>
            )}

            <Input 
                name="title" 
                label="Module Title" 
                required 
                defaultValue={module?.title}
                error={state?.error?.title}
            />

            <Input 
                name="subtitle" 
                label="Subtitle" 
                defaultValue={module?.subtitle}
                error={state?.error?.subtitle}
            />

            <Input 
                name="maxChars" 
                label="Max Characters (Optional)" 
                type="number"
                defaultValue={module?.maxChars}
                error={state?.error?.maxChars}
                placeholder="e.g. 5000"
            />

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <SubmitButton label={isEdit ? "Save Changes" : "Create Module"} />
            </div>
        </form>
    );
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? "Saving..." : label}</Button>;
}
