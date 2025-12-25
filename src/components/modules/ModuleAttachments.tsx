"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createAttachment, deleteAttachment } from "@/app/actions/attachments";
import { Paperclip, Trash2, Eye, FileText, Loader2, Plus, File } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";

interface Attachment {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType?: string | null;
}

interface ModuleAttachmentsProps {
    moduleId: string;
    initialAttachments: Attachment[];
    readOnly?: boolean;
    compact?: boolean;
}

export function ModuleAttachments({ moduleId, initialAttachments, readOnly = false, compact = false }: ModuleAttachmentsProps) {
    const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Filter out mock/broken attachments if any
    const validAttachments = attachments.filter(a => a.id);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await createAttachment(moduleId, formData);

        if (res.success && res.attachment) {
            setAttachments([res.attachment, ...attachments]);
            toast.success("Attachment added");
        } else {
            toast.error(res.error || "Upload failed");
        }
        setIsUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this attachment?")) return;
        
        // Optimistic update
        const prev = [...attachments];
        setAttachments(attachments.filter(a => a.id !== id));

        const res = await deleteAttachment(id);
        if (!res.success) {
            setAttachments(prev);
            toast.error("Failed to delete");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <>
            {compact ? (
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(true)}
                    className="h-6 px-2 text-xs hover:bg-indigo-50 text-indigo-600 font-bold"
                >
                    {validAttachments.length || 0}
                </Button>
            ) : (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(true)}
                    className="relative"
                >
                    <Paperclip size={16} className="mr-1" />
                    Attachments
                    {validAttachments.length > 0 && (
                         <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {validAttachments.length}
                        </span>
                    )}
                </Button>
            )}

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Module Attachments">
                <div className="space-y-6">
                    {!readOnly && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* File Upload */}
                            <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center absolute inset-0 z-10">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                                        {isUploading ? <Loader2 className="animate-spin" /> : <Plus />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">
                                        {isUploading ? "Uploading..." : "Upload File"}
                                    </span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>

                            {/* Add Link */}
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                                <h5 className="text-xs font-bold text-slate-500 mb-2">Add External Link</h5>
                                <form action={async (formData) => {
                                    const url = formData.get('url') as string;
                                    const name = formData.get('name') as string;
                                    if (!url || !name) return;
                                    
                                    const { createLinkAttachment } = await import("@/app/actions/attachments");
                                    const res = await createLinkAttachment(moduleId, name, url);
                                    if (res.success && res.attachment) {
                                        setAttachments([res.attachment, ...attachments]);
                                        toast.success("Link added");
                                        // clear form?
                                    } else {
                                        toast.error("Failed to add link");
                                    }
                                }} className="space-y-2">
                                    <input name="name" placeholder="Link Title (e.g. Website)" className="w-full text-xs p-2 rounded border" required />
                                    <input name="url" type="url" placeholder="https://..." className="w-full text-xs p-2 rounded border" required />
                                    <Button size="sm" type="submit" className="w-full h-8 text-xs">Add Link</Button>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Attached Files ({validAttachments.length})
                        </h4>
                        
                        {validAttachments.length === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-4">No attachments yet.</p>
                        )}

                        {validAttachments.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg group hover:border-indigo-200 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                                        <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-700 truncate">{file.name}</div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                            <span>{formatSize(file.size)}</span>
                                            {file.mimeType && <span>• {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Preview / Download"
                                    >
                                        <Eye size={16} />
                                    </a>
                                    {!readOnly && (
                                        <button 
                                            onClick={() => handleDelete(file.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </>
    );
}
