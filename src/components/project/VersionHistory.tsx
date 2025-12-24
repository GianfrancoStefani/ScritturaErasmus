"use client";

import React, { useState, useEffect } from "react";
import { 
    History, 
    Plus, 
    Trash2, 
    RotateCcw, 
    ChevronRight,
    Clock,
    X,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { 
    createSnapshotAction, 
    getProjectVersionsAction, 
    deleteSnapshotAction, 
    restoreSnapshotAction 
} from "@/app/actions/versionActions";
import { toast } from "sonner";

interface VersionHistoryProps {
    projectId: string;
}

export function VersionHistory({ projectId }: VersionHistoryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const loadVersions = async () => {
        setIsLoading(true);
        const data = await getProjectVersionsAction(projectId);
        setVersions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadVersions();
        }
    }, [isOpen, projectId]);

    const handleCreateSnapshot = async () => {
        const name = prompt("Enter a name for this version:", `Version ${new Date().toLocaleString()}`);
        if (!name) return;

        setIsCreating(true);
        const result = await createSnapshotAction(projectId, name);
        if (result.success) {
            toast.success("Snapshot created successfully");
            loadVersions();
        } else {
            toast.error(result.error || "Failed to create snapshot");
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this version?")) return;
        
        const result = await deleteSnapshotAction(id);
        if (result.success) {
            toast.success("Version deleted");
            loadVersions();
        } else {
            toast.error(result.error || "Failed to delete");
        }
    };

    const handleRestore = async (id: string, name: string) => {
        if (!confirm(`WARNING: This will overwrite your current project data with '${name}'. A safety backup is recommended. Continue?`)) return;

        setRestoringId(id);
        const result = await restoreSnapshotAction(id);
        if (result.success) {
            toast.success("Project restored successfully");
            setIsOpen(false);
            window.location.reload(); // Hard reload to ensure all server components refresh correctly
        } else {
            toast.error(result.error || "Failed to restore");
        }
        setRestoringId(null);
    };

    return (
        <>
            <Button 
                variant="secondary" 
                title="Version History"
                onClick={() => setIsOpen(true)}
                className="w-9 h-9 p-0 flex items-center justify-center bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
            >
                <History size={16} />
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Sidebar */}
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="text-amber-500" size={20} />
                                <h2 className="text-xl font-bold text-slate-800">Version History</h2>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                title="Close"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <Button 
                                onClick={handleCreateSnapshot}
                                disabled={isCreating}
                                className="w-full justify-start gap-2 mb-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Plus size={18} />
                                {isCreating ? "Creating Snapshot..." : "Create New Snapshot"}
                            </Button>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
                                        <p className="text-sm">Loading versions...</p>
                                    </div>
                                ) : versions.length === 0 ? (
                                    <div className="text-center py-10 px-6 border-2 border-dashed border-slate-100 rounded-xl">
                                        <Clock size={40} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">No snapshots found</p>
                                        <p className="text-xs text-slate-400 mt-1">Create your first snapshot to start versioning</p>
                                    </div>
                                ) : (
                                    versions.map((v) => (
                                        <div 
                                            key={v.id}
                                            className="group relative bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2 pr-12">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{v.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                        <Clock size={12} />
                                                        {format(new Date(v.createdAt), 'PPp')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleDelete(v.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Version"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                                                <Button 
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={restoringId === v.id}
                                                    onClick={() => handleRestore(v.id, v.name)}
                                                    className="flex-1 bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 gap-2 h-9"
                                                >
                                                    <RotateCcw size={14} />
                                                    {restoringId === v.id ? "Restoring..." : "Restore this version"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    Restoring a version will completely replace the current project state. 
                                    Make sure you have a current snapshot before rolling back.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
