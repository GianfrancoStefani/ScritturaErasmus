"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { getTemplatePreview } from "@/app/actions/templates";
import { Loader2, Layout, Briefcase, CheckSquare, FileText, Layers } from "lucide-react";

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    title: string;
}

export function TemplatePreviewModal({ isOpen, onClose, templateId, title }: TemplatePreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState<any>(null);

    useEffect(() => {
        if (isOpen && templateId) {
            setLoading(true);
            getTemplatePreview(templateId).then(res => {
                if (res.success) {
                    setTemplate(res.data);
                }
                setLoading(false);
            });
        }
    }, [isOpen, templateId]);

    const renderModules = (modules: any[], level = 0) => {
        if (!modules || modules.length === 0) return null;
        return modules.map((m: any) => (
            <div key={m.id} className={`flex items-center gap-2 py-1 text-slate-600 ${level === 0 ? 'bg-orange-50/50 p-3 rounded-lg border border-orange-100' : ''}`} style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : undefined }}>
                <FileText size={level === 0 ? 18 : 14} className="text-orange-500 shrink-0" />
                <span className={`${level === 0 ? 'text-sm font-medium text-slate-700' : 'text-xs'}`}>{m.title}</span>
            </div>
        ));
    };

    const renderActivity = (activity: any) => (
        <div key={activity.id} className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 pl-10 py-1">
                <CheckSquare size={14} className="text-blue-400 shrink-0" />
                <span>{activity.title}</span>
            </div>
            {renderModules(activity.modules, 8)}
        </div>
    );

    const renderTask = (task: any) => (
        <div key={task.id} className="space-y-2 pl-6">
            <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-slate-100">
                <Briefcase size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{task.title}</span>
            </div>
            {renderModules(task.modules, 4)}
            {task.activities?.map(renderActivity)}
        </div>
    );

    const renderWork = (work: any) => (
        <div key={work.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20 shadow-sm ml-4 my-3">
            <div className="p-3 bg-white/80 border-b border-slate-100 flex items-center gap-3">
                <Layout size={18} className="text-indigo-500 shrink-0" />
                <h5 className="text-sm font-semibold text-slate-800">{work.title}</h5>
            </div>
            <div className="p-3 space-y-2">
                {renderModules(work.modules, 2)}
                {work.tasks?.map(renderTask)}
            </div>
        </div>
    );

    const renderSection = (section: any) => (
        <div key={section.id} className="space-y-3 bg-slate-100/30 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
                <Layers size={20} className="text-slate-500 shrink-0" />
                <h4 className="font-bold text-slate-800 tracking-tight underline decoration-slate-200 underline-offset-4">{section.title}</h4>
            </div>
            <div className="space-y-2">
                {renderModules(section.modules, 2)}
                {template.works?.filter((w: any) => w.sectionId === section.id).map(renderWork)}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${title}`}>
            <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>Loading template structure...</p>
                    </div>
                ) : template ? (
                    <div className="space-y-6">
                        {/* Root Modules */}
                        {template.modules?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Global Modules</h4>
                                {renderModules(template.modules)}
                            </div>
                        )}

                        {/* Sections */}
                        {template.sections?.length > 0 && (
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Project Structure</h4>
                                {template.sections.map(renderSection)}
                            </div>
                        )}

                        {/* Orphaned Works (no section) */}
                        {template.works?.filter((w: any) => !w.sectionId).length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 italic">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Other Components</h4>
                                {template.works?.filter((w: any) => !w.sectionId).map(renderWork)}
                            </div>
                        )}

                        {template.sections?.length === 0 && template.works?.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                This template is empty.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        Template content not found.
                    </div>
                )}
            </div>
            <div className="mt-8 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Close Preview
                </button>
            </div>
        </Modal>
    );
}
