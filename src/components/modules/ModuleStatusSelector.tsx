"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateModuleMetadata } from "@/app/actions/modules";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModuleStatusSelector({ moduleId, initialStatus, isManager }: { moduleId: string, initialStatus: string, isManager: boolean }) {
    const router = useRouter();
    const [status, setStatus] = useState((initialStatus === "TO_DONE" ? "TO_DO" : initialStatus) || "TO_DO");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append("id", moduleId);
        // We only send ID and Status. The server action handles partial updates if we relax the validation or merged it.
        // Wait, my `updateModuleMetadata` schema requires `title`.
        // I need to check `updateModuleMetadata` implementation.
        // It uses `UpdateModuleSchema` which has `title: z.string().min(1)`.
        // This means I can't just send ID and status. I need to send Title too.
        // BUT I don't want to pass Title here just to satisfy the schema if I'm not changing it.
        // I should probably fetch the title or Refactor the Server Action to make title optional for updates.
        // Refactoring the action is cleaner.
        // BUT for now, to avoid breaking logic, I will pass the title if I can, or update the action.
        // Actually, let's update the action to make title optional in UpdateSchema.
        
        // Let's assume for a second I update the action first.
        formData.append("status", status);
        
        // NOTE: I will update the action to make title optional.
        
        const res = await updateModuleMetadata(null, formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Status updated");
            router.refresh();
        }
        setIsSaving(false);
    };

    if (!isManager) {
        return (
            <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500 font-medium uppercase">Status:</span>
                 <StatusBadge status={initialStatus} />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border border-slate-200">
            <select 
                aria-label="Module Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded px-1 py-1"
            >
                <option value="TO_DO">TO DO</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="DONE">DONE</option>
                <option value="AUTHORIZED">AUTHORIZED</option>
            </select>
            {status !== initialStatus && (
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-6 text-[10px] px-2">
                    {isSaving ? "..." : "Save"}
                </Button>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'TO_DO': 'bg-slate-100 text-slate-600',
        'TO_DONE': 'bg-slate-100 text-slate-600',
        'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700',
        'DONE': 'bg-green-100 text-green-700',
        'AUTHORIZED': 'bg-blue-100 text-blue-700'
    };
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 whitespace-nowrap ${colors[status] || colors['TO_DONE']}`}>
            {status.replace('_', ' ')}
        </span>
    )
}
