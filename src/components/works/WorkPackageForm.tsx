"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateWork } from "@/app/actions/works";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Edit } from "lucide-react";
import { format } from "date-fns";

type WorkData = {
    id: string;
    title: string;
    budget: number;
    startDate: Date;
    endDate: Date;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : "Update Work Package"}</Button>;
}

type FormState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

function WorkPackageForm({ projectId, work, onClose }: { projectId: string; work: WorkData; onClose: () => void }) {
    const [state, formAction] = useFormState<FormState, FormData>(async (prevState, formData) => {
        const result = await updateWork(work.id, projectId, formData);
        if (result.success) {
            onClose();
            return { success: true, message: "Success" };
        }
        return result; 
    }, null);

    return (
        <form action={formAction} className="space-y-4">
             <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input name="title" className="w-full border rounded p-2" required defaultValue={work.title} />
            </div>

             <div className="space-y-1">
                <label className="text-sm font-medium">Budget (€)</label>
                <input name="budget" type="number" step="0.01" className="w-full border rounded p-2" required defaultValue={work.budget} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Start Date</label>
                    <input 
                        name="startDate" 
                        type="date" 
                        className="w-full border rounded p-2" 
                        required 
                        defaultValue={work.startDate ? format(new Date(work.startDate), "yyyy-MM-dd") : ""}
                    />
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">End Date</label>
                    <input 
                        name="endDate" 
                        type="date" 
                        className="w-full border rounded p-2" 
                        required 
                        defaultValue={work.endDate ? format(new Date(work.endDate), "yyyy-MM-dd") : ""}
                    />
                </div>
            </div>

            {state?.error && <div className="text-red-500 text-sm">{state.error}</div>}

            <div className="flex justify-end pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}

export function EditWorkPackageButton({ projectId, work, className }: { projectId: string, work: WorkData, className?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
             <button 
                onClick={() => setOpen(true)} 
                className={`text-slate-400 hover:text-indigo-600 transition-colors ${className}`}
                title="Edit Work Package"
            >
                <Edit size={16} />
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit Work Package">
                <WorkPackageForm projectId={projectId} work={work} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}
