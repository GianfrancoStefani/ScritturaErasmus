"use client";

// Logic: We need to wrap the editor in a client component that calls the server action.
// But the page itself can be server component to fetch data.
// Wait, I am writing the PAGE file here.

// I will make a wrapper component `ModuleEditor` and use it in the page.
// Actually, I can just make this page a client component for simplicity or fetch in a parent Server Component layout.
// Let's do Server Page -> Client Editor.

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { updateModuleContent } from "@/app/actions/updateModule";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Correct import for App Router

export default function ModuleEditorWrapper({ module }: { module: any }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const handleSave = async (content: string) => {
        setSaving(true);
        await updateModuleContent(module.id, content);
        setSaving(false);
        router.refresh();
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{module.title}</h2>
                {module.subtitle && <p className="text-slate-500">{module.subtitle}</p>}
                
                <div className="flex gap-2 mt-2">
                    <span className="bg-slate-100 text-xs px-2 py-1 rounded">Status: {module.status}</span>
                </div>
            </div>
            
            <RichTextEditor initialContent={module.officialText || ""} onSave={handleSave} />
        </div>
    );
}
