"use client";

import { Button } from "@/components/ui/Button";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cloneWork } from "@/app/actions/works";

export function CloneWorkPackageButton({ workId, projectId, className }: { workId: string, projectId: string, className?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClone = async () => {
        if (!confirm("Are you sure you want to clone this Work Package and all its contents?")) return;
        
        startTransition(async () => {
             const result = await cloneWork(workId, projectId);
             if (result.success) {
                 router.refresh();
             } else {
                 alert("Failed to clone work package");
             }
        });
    };

    return (
        <button 
            onClick={handleClone} 
            disabled={isPending}
            className={`text-slate-400 hover:text-indigo-600 transition-colors ${className}`}
            title="Clone Work Package"
        >
            <Copy size={16} className={isPending ? "animate-spin" : ""} />
        </button>
    );
}
