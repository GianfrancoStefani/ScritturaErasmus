"use client";

import { useState, useEffect } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { History, Globe, Save, ChevronRight, MessageSquare, FileDiff } from "lucide-react";
import { saveModuleVersion, getModuleVersions, restoreModuleVersion } from "@/app/actions/module_versions";
import { createComment } from "@/app/actions/comments";
import { format } from "date-fns";
import clsx from "clsx";
import { diffWords } from "diff";
import { translateText } from "@/app/actions/translate";

import { ModuleStatusSelector } from "@/components/modules/ModuleStatusSelector";
import { ModuleAttachments } from "@/components/modules/ModuleAttachments";



interface AdvancedModuleEditorProps {
    module: any;
    partners: any[];
    currentUser: any;
    initialVersions: any[];
    characterLimit?: number;
    isManager: boolean; // Add isManager prop
}

export default function AdvancedModuleEditor({ module, partners, currentUser, initialVersions, characterLimit, isManager }: AdvancedModuleEditorProps) {
    const [versions, setVersions] = useState<any[]>(initialVersions);
    const [showHistory, setShowHistory] = useState(false);
    const [showTranslate, setShowTranslate] = useState(false);
    const [currentContent, setCurrentContent] = useState(module.officialText || "");
    const [isEditing, setIsEditing] = useState(false);
    
    // Diff logic
    const [showDiff, setShowDiff] = useState(false);
    const [diffElements, setDiffElements] = useState<React.ReactNode>(null);
    const [comparedVersionDate, setComparedVersionDate] = useState("");
    
    // Post-deadline comments
    const isDeadlinePassed = module.commentEndingDate && new Date() > new Date(module.commentEndingDate);
    const [comments, setComments] = useState<any[]>(module.comments || []); 

    // Refresh versions
    const refreshVersions = async () => {
        const res = await getModuleVersions(module.id);
        if (res.versions) setVersions(res.versions);
    };

    const handleSaveVersion = async () => {
        await saveModuleVersion(module.id, currentContent);
        await refreshVersions();
        alert("Version saved!");
    };

    const handleRestore = async (versionId: string) => {
        if (!confirm("Are you sure? This will overwrite the current text.")) return;
        await restoreModuleVersion(module.id, versionId, module.projectId);
        window.location.reload(); 
    };

    const handleCompare = (index: number) => {
        const currentVer = versions[index];
        const prevVer = versions[index + 1]; // Older version because list is desc
        
        const oldText = prevVer ? prevVer.content : ""; // Or empty if it's the first version
        const newText = currentVer.content;
        
        const changes = diffWords(oldText.replace(/<[^>]*>?/gm, ' '), newText.replace(/<[^>]*>?/gm, ' '));
        
        const elements = changes.map((part, i) => {
            const color = part.added ? 'bg-green-100 text-green-800' :
                          part.removed ? 'bg-red-100 text-red-800 line-through' : 'text-slate-600';
            return (
                <span key={i} className={color}>
                    {part.value}
                </span>
            );
        });

        setDiffElements(elements);
        setComparedVersionDate(format(new Date(currentVer.createdAt), 'dd MMM HH:mm'));
        setShowDiff(true);
    };

    // Translation languages
    const languages = Array.from(new Set([
        ...partners.map(p => p.nation),
        currentUser?.motherTongue
    ].filter(Boolean)));

    // Ensure selectedLanguage defaults to motherTongue
    const [selectedLanguage, setSelectedLanguage] = useState(currentUser?.motherTongue || "en"); 
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);

    const handleTranslate = async () => {
        setIsTranslating(true);
        setTranslationError(null);
        // Strip HTML for now? Or keep it? DeepL handles XML/HTML tags partially, but let's just send text content for safety/cost in this v1
        // Actually, let's try sending the raw HTML if it's not too huge, DeepL might respect tags.
        // For cost saving, maybe text only? Let's do text only for "Guideline" style reading.
        // But this is the EDITOR content. 
        // Let's strip tags for cost safety in this implementation, users just want to understand the text.
        const textToTranslate = currentContent.replace(/<[^>]*>?/gm, '\n'); 
        
        const res = await translateText(textToTranslate, selectedLanguage);
        setIsTranslating(false);
        
        if (res.success) {
            // Re-wrap in simple paragraphs for readability
            setTranslatedContent(res.text?.split('\n').map((l: string) => `<p>${l}</p>`).join(''));
        } else {
            setTranslationError(res.error || "Unknown error");
        }
    };

    // Helper for char count to ensure consistency
    const getCharCount = (html: string) => html.replace(/<[^>]*>?/gm, '').length;
    const charCount = getCharCount(currentContent);
    const maxChars = module.maxCharacters || 3000;
    const percentage = Math.round((charCount / maxChars) * 100);

    return (
        <div className="flex flex-col h-full relative">
            {/* Toolbar Extras */}
            <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-2">
                     <ModuleStatusSelector 
                        moduleId={module.id} 
                        initialStatus={module.status} 
                        isManager={isManager} 
                     />
                     <div className="h-4 w-px bg-slate-300 mx-2" />
                     <ModuleAttachments 
                        moduleId={module.id}
                        initialAttachments={module.attachments || []}
                     />
                     <div className="h-4 w-px bg-slate-300 mx-2" />
                     <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className={showHistory ? "bg-slate-200" : ""}>
                        <History size={16} className="mr-1" /> History
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setShowTranslate(true)}>
                        <Globe size={16} className="mr-1" /> Translate
                     </Button>
                </div>
                
                <div className="flex items-center gap-4">
                     {/* Always show char count/percentage */}
                     <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                        {charCount} / {maxChars} chars
                        <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold", percentage > 100 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600")}>
                            {percentage}%
                        </span>
                     </span>

                     {!isEditing ? (
                        <div className="flex items-center gap-2">
                             <Button size="sm" onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Open Editor
                             </Button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="mr-2">
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveVersion} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Save size={16} className="mr-1" /> Save Version
                            </Button>
                        </div>
                     )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Editor / Preview Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {!isEditing ? (
                        <div className="flex-1 overflow-y-auto">
                             <div 
                                className="prose prose-sm max-w-none p-8"
                                dangerouslySetInnerHTML={{ __html: currentContent || "<p class='text-slate-400 italic'>No official text yet. Click 'Open Editor' to start drafting.</p>" }}
                            />
                        </div>
                    ) : (
                        <RichTextEditor 
                            moduleId={module.id} 
                            initialContent={module.officialText || ""} 
                            maxChars={module.maxChars || undefined}
                            onContentChange={(html) => setCurrentContent(html)}
                        />
                    )}
                    
                    {/* Post-Deadline Comments Section */}
                    {isDeadlinePassed && (
                        <div className="h-64 border-t border-slate-200 bg-slate-50 flex flex-col">
                            <div className="p-2 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase flex items-center gap-2">
                                <MessageSquare size={14} /> Comments (Post-Deadline)
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {comments.map((c: any) => (
                                    <div key={c.id} className="bg-white p-3 rounded shadow-sm text-sm">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-bold text-slate-700">{c.user.name} {c.user.surname}</span>
                                            <span className="text-[10px] text-slate-400">{format(new Date(c.createdAt), 'dd MMM HH:mm')}</span>
                                        </div>
                                        <p className="text-slate-600">{c.content}</p>
                                    </div>
                                ))}
                                {comments.length === 0 && <p className="text-slate-400 text-sm text-center italic">No comments yet</p>}
                            </div>
                            <div className="p-2 bg-white border-t border-slate-200">
                                <form action={async (formData) => {
                                    const content = formData.get('content') as string;
                                    if (!content) return;
                                    await createComment({ 
                                        moduleId: module.id, 
                                        content, 
                                        userId: currentUser.id, 
                                        path: `/dashboard/projects/${module.projectId}/modules/${module.id}` 
                                    });
                                }} className="flex gap-2">
                                    <Input name="content" placeholder="Add a comment..." className="flex-1" />
                                    <Button type="submit" size="sm">Send</Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Sidebar */}
                {showHistory && (
                    <div className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-right duration-200 z-10">
                         <div className="p-3 font-bold text-slate-700 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span>Version History</span>
                            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="h-6 w-6 p-0"><ChevronRight size={14}/></Button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {versions.map((v, i) => (
                                <div key={v.id} className="relative pl-4 border-l-2 border-slate-200 p-2 hover:bg-slate-50 rounded group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500" />
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-slate-700">Version {versions.length - i}</div>
                                        <div className="flex gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600" 
                                                title="Compare with previous"
                                                onClick={() => handleCompare(i)}
                                            >
                                                <FileDiff size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mb-1">
                                        {format(new Date(v.createdAt), 'dd MMM yyyy HH:mm')}
                                    </div>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px] w-full mt-1" onClick={() => handleRestore(v.id)}>
                                        Restore
                                    </Button>
                                </div>
                            ))}
                            {versions.length === 0 && <div className="text-sm text-slate-400 p-4 text-center">No saved versions</div>}
                         </div>
                    </div>
                )}
            </div>

            {/* Diff Modal */}
            <Modal isOpen={showDiff} onClose={() => setShowDiff(false)} title={`Changes in Version - ${comparedVersionDate}`}>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 max-h-[60vh] overflow-y-auto leading-relaxed text-sm font-mono whitespace-pre-wrap">
                    {diffElements}
                </div>
                <div className="mt-4 flex gap-4 text-xs">
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 block"></span> Added</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 block"></span> Removed</span>
                </div>
            </Modal>

            {/* Translation Modal/Overlay */}
            <Modal isOpen={showTranslate} onClose={() => setShowTranslate(false)} title="Translate Module">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Translate to:</label>
                        <div className="p-2 border rounded bg-slate-100 text-slate-700 font-bold flex justify-between items-center">
                            <span>{selectedLanguage.toUpperCase()} (Your Language)</span>
                            {!translatedContent && (
                                <Button size="sm" onClick={handleTranslate} disabled={isTranslating}>
                                    {isTranslating ? "Translating..." : "Start Translation"}
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {translationError && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                            {translationError}
                        </div>
                    )}

                    {selectedLanguage && translatedContent && (
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 h-96 overflow-y-auto relative group">
                            <div className="absolute top-2 right-2 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                                {selectedLanguage}
                            </div>
                            <div 
                                className="prose prose-sm max-w-none text-slate-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: translatedContent }}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
