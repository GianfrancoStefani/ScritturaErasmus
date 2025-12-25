"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { User, MessageCircle, FileText, Bookmark, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveUserNote } from "@/app/actions/editor";
import { toast } from "sonner";
import { AnnotationLayer } from "@/components/project/AnnotationLayer";

interface ProjectZenContentProps {
    project: any;
    mode: 'READER' | 'NOTES' | 'REVIEW' | 'FULL';
    showAuthors: boolean;
    showComments: boolean;
    showEmptyModules: boolean;
    showEmptySections: boolean;
    activeTool: 'CURSOR' | 'HIGHLIGHTER' | 'CIRCLE' | 'ARROW';
    activeColor: string;
    enableTranslation?: boolean;
    targetLanguage?: string;
}

function NoteEditor({ moduleId, components }: { moduleId: string, components: any[] }) {
    const existingNote = components?.find(c => c.type === 'USER_NOTE')?.content || "";
    const [note, setNote] = useState(existingNote);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await saveUserNote(moduleId, note);
        if (res.success) {
            toast.success("Note saved");
            setHasChanges(false);
        } else {
            toast.error(res.error || "Error saving note");
        }
        setIsSaving(false);
    };

    return (
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <textarea 
                className="w-full p-4 bg-amber-50/30 border border-amber-200/50 rounded-xl text-sm text-slate-600 placeholder:text-amber-800/30 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                placeholder="Jot down a quick note or reminder for this module..."
                rows={3}
                value={note}
                onChange={(e) => {
                    setNote(e.target.value);
                    setHasChanges(true);
                }}
            />
            <div className="flex justify-end mt-2">
                 <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={clsx(
                        "gap-2 rounded-lg text-xs h-8 transition-all",
                        hasChanges ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-slate-100 text-slate-400"
                    )}
                 >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : (hasChanges ? <Bookmark size={14} /> : <Check size={14} />)}
                    {isSaving ? "Saving..." : (hasChanges ? "Save Note" : "Saved")}
                 </Button>
            </div>
        </div>
    );
}

export function ProjectZenContent({ 
    project, 
    mode, 
    showAuthors, 
    showComments, 
    showEmptyModules,
    showEmptySections,
    activeTool,
    activeColor,
    enableTranslation,
    targetLanguage
}: ProjectZenContentProps) {
    
    const renderModule = (m: any) => {
        const text = m.officialText || "";
        const isEmpty = !text || text.replace(/<[^>]+>/g, '').trim().length === 0;

        // If translation is enabled, we might want to show the module even if "officially" empty, to show the mock
        if (isEmpty && !showEmptyModules && mode === 'READER' && !enableTranslation) return null;

        return (
            <div key={m.id} className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700 print:animate-none print:transform-none">
                <AnnotationLayer 
                    moduleId={m.id} 
                    activeTool={activeTool} 
                    activeColor={activeColor}
                    existingAnnotations={m.components || []}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-6 bg-indigo-500/30 rounded-full" />
                        <h4 className="text-xl font-bold text-slate-800 tracking-tight">{m.title}</h4>
                        {m.status === 'AUTHORIZED' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase border border-blue-100">Official</span>
                        )}
                        {/* Completion Percentage Badge */}
                        <span className={clsx(
                            "px-2 py-0.5 text-[10px] font-bold rounded uppercase border ml-auto",
                            Math.round(((m.officialText || "").replace(/<[^>]+>/g, '').length / (m.maxCharacters || 3000)) * 100) > 100 
                                ? "bg-red-50 text-red-600 border-red-100" 
                                : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                            {Math.round(((m.officialText || "").replace(/<[^>]+>/g, '').length / (m.maxCharacters || 3000)) * 100)}%
                        </span>
                        
                        {enableTranslation && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase border border-amber-100">
                                Translated to {targetLanguage} (Preview)
                            </span>
                        )}
                    </div>
                
                    <div className={clsx(
                        "prose prose-slate max-w-none text-slate-700 leading-relaxed",
                        isEmpty ? "italic text-slate-300" : ""
                    )}>
                        {enableTranslation ? (
                            <div className="p-4 bg-amber-50/20 border border-amber-100/50 rounded-lg">
                                {/* Mock Translation */}
                                <p className="text-slate-600 mb-4">[Translated content to {targetLanguage}...]</p>
                                <div dangerouslySetInnerHTML={{ __html: text }} className="opacity-80 grayscale-[30%]" />
                            </div>
                        ) : (
                            isEmpty ? "This module has no content yet." : (
                                <div dangerouslySetInnerHTML={{ __html: text }} className="[&>p]:mb-4" />
                            )
                        )}
                    </div>
                </AnnotationLayer>

                {/* Authors (Show if toggled ON) */}
                {showAuthors && m.components && m.components.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2 items-center text-xs">
                        <span className="text-slate-400 font-medium">Contributors:</span>
                        {Array.from(new Set(m.components.filter((c: any) => c.type !== 'USER_NOTE' && c.type !== 'ANNOTATION').map((c: any) => c.author.name))).map((name: any) => (
                            <span key={name as string} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                                <User size={10} /> {name as string}
                            </span>
                        ))}
                    </div>
                )}

                {/* Comments (Show if toggled ON) */}
                {showComments && m.comments && m.comments.length > 0 && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            <MessageCircle size={12} /> External Feedback
                        </h5>
                        {m.comments.map((c: any) => (
                            <div key={c.id} className="text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700">{c.user.name}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
                                </div>
                                <p className="text-slate-600">{c.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Notes Mode */}
                {mode === 'NOTES' && (
                    <NoteEditor moduleId={m.id} components={m.components} />
                )}
            </div>
        );
    };

    return (
        <div className="space-y-16">
            {/* Top Level Modules */}
            {project.modules && project.modules.length > 0 && (
                <section>
                    <header className="mb-10 flex items-center gap-4">
                        <FileText className="text-slate-400" size={24} />
                        <h2 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">Direct project modules</h2>
                    </header>
                    {project.modules.map(renderModule)}
                </section>
            )}

            {/* Sections */}
            {project.sections.map((s: any) => {
                // Check if section is effectively empty
                // It is empty if it has no works AND (no modules OR all modules are empty and showEmptyModules is false)
                // Note: determining if a module is "empty" relies on the same logic as renderModule, 
                // but since renderModule returns null if empty & !showEmpty, we can just check raw data here.
                
                const hasWorks = s.works && s.works.length > 0;
                
                // Helper to check if a module has content
                const hasModuleContent = (m: any) => {
                     const text = m.officialText || "";
                     const hasText = text && text.replace(/<[^>]+>/g, '').trim().length > 0;
                     return hasText;
                };

                const hasVisibleModules = s.modules && s.modules.some((m: any) => {
                    if (showEmptyModules) return true; // checking mere existence
                    return hasModuleContent(m);
                });

                const isEffectiveEmpty = !hasWorks && !hasVisibleModules;

                if (isEffectiveEmpty && !showEmptySections && mode === 'READER') return null;

                return (
                <section key={s.id} className="pt-8">
                    <header className="mb-12 border-l-8 border-indigo-600 pl-6 py-2">
                        <span className="text-indigo-600 text-sm font-black uppercase tracking-widest mb-1 block">Project Section</span>
                        <h2 className="text-4xl font-black text-slate-900 leading-tight">{s.title}</h2>
                    </header>

                    {/* Section Modules */}
                    {s.modules?.map(renderModule)}

                    {/* Works / WPs */}
                    <div className="space-y-20 ml-4 lg:ml-8 border-l border-slate-100 pl-4 lg:pl-10">
                        {s.works.map((w: any) => (
                            <div key={w.id}>
                                <div className="mb-8">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 block">Work Package</span>
                                    <h3 className="text-2xl font-black text-slate-800">{w.title}</h3>
                                </div>

                                {w.modules?.map(renderModule)}

                                {/* Tasks */}
                                <div className="space-y-16 ml-4 lg:ml-8 border-l border-slate-200/50 pl-4 lg:pl-8">
                                    {w.tasks.map((t: any) => (
                                        <div key={t.id}>
                                            <div className="mb-6">
                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 block">Task</span>
                                                <h4 className="text-xl font-bold text-slate-700">{t.title}</h4>
                                            </div>

                                            {t.modules?.map(renderModule)}

                                            {/* Activities */}
                                            <div className="space-y-12 ml-6 border-l border-dashed border-slate-200 pl-6 mt-6">
                                                {t.activities.map((act: any) => (
                                                    <div key={act.id}>
                                                        <div className="mb-4">
                                                             <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 block">Activity</span>
                                                             <h5 className="text-lg font-bold text-slate-600">{act.title}</h5>
                                                        </div>
                                                        {act.modules?.map(renderModule)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                );
            })}

            {/* Unassigned Works */}
            {project.works && project.works.length > 0 && (
                 <section className="pt-20 border-t-4 border-slate-100">
                    <header className="mb-12">
                        <h2 className="text-4xl font-black text-slate-300 uppercase tracking-tighter">Independent Work Packages</h2>
                    </header>
                    {project.works.map((w: any) => (
                        <div key={w.id} className="mb-20">
                             <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-800">{w.title}</h3>
                             </div>

                             {w.modules?.map(renderModule)}

                             {/* Tasks */}
                             <div className="space-y-16 ml-4 lg:ml-8 border-l border-slate-200/50 pl-4 lg:pl-8">
                                {w.tasks?.map((t: any) => (
                                    <div key={t.id}>
                                        <div className="mb-6">
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 block">Task</span>
                                            <h4 className="text-xl font-bold text-slate-700">{t.title}</h4>
                                        </div>

                                        {t.modules?.map(renderModule)}

                                        {/* Activities */}
                                        <div className="space-y-12 ml-6 border-l border-dashed border-slate-200 pl-6 mt-6">
                                            {t.activities?.map((act: any) => (
                                                <div key={act.id}>
                                                    <div className="mb-4">
                                                         <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 block">Activity</span>
                                                         <h5 className="text-lg font-bold text-slate-600">{act.title}</h5>
                                                    </div>
                                                    {act.modules?.map(renderModule)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                 </section>
            )}
        </div>
    );
}
