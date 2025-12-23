"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { createSection } from "@/app/actions/sections";
import { Plus } from "lucide-react";


export function CreateSectionButton({ projectId, minimal = false }: { projectId: string, minimal?: boolean }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await createSection(projectId, title);
        setLoading(false);
        if (res.success) {
            setOpen(false);
            setTitle("");
        } else {
            alert("Error creating section");
        }
    };

    return (
        <>
            {minimal ? (
                <Button size="sm" onClick={() => setOpen(true)} className="h-8 px-3 text-xs gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm font-medium" title="Add Section">
                    <Plus size={14} /> Add Section
                </Button>
            ) : (
                <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
                    <Plus size={16} /> Add Section
                </Button>
            )}

            <Modal isOpen={open} onClose={() => setOpen(false)} title="Create New Section">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Section Title"
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Section"}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
