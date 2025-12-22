"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { saveProjectAsTemplate } from "@/app/actions/templates";
import { Copy } from "lucide-react";

export function SaveTemplateButton({ projectId, projectTitle }: { projectId: string, projectTitle: string }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(projectTitle + " Template");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await saveProjectAsTemplate(projectId, name);
        setLoading(false);
        if (res.success) {
            setOpen(false);
            alert("Template saved successfully!");
        } else {
            alert("Error saving template");
        }
    };

    return (
        <>
            <Button variant="secondary" onClick={() => setOpen(true)} className="gap-2">
                <Copy size={14} /> Save as Template
            </Button>

            <Modal isOpen={open} onClose={() => setOpen(false)} title="Save as Template">
                <p className="text-sm text-slate-500 mb-4">
                    This will create a reuseable copy of the current project structure (works, tasks, modules, guidelines) without user-specific data or assignments.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Template Name"
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Template"}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
