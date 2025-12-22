"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { TaskForm } from "./TaskForm";

export function CreateTaskButton({ workId, className }: { workId: string, className?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)} className={className}>
                <Plus size={14} className="mr-2" /> Add Task
            </Button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Add New Task">
                <TaskForm 
                    workId={workId} 
                    onSuccess={() => setOpen(false)} 
                    onCancel={() => setOpen(false)} 
                />
            </Modal>
        </>
    );
}
