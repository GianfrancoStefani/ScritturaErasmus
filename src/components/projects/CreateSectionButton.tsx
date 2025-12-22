"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { createSection } from "@/app/actions/sections";
import { Plus } from "lucide-react";


export function CreateSectionButton({ projectId }: { projectId: string }) {
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
            <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
                <Plus size={16} /> Add Section
            </Button>

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
