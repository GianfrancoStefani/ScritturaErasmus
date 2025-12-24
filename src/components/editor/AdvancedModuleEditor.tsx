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

interface AdvancedModuleEditorProps {
    module: any;
    partners: any[];
    currentUser: any;
    initialVersions: any[];
    characterLimit?: number;
}

export default function AdvancedModuleEditor({ module, partners, currentUser, initialVersions, characterLimit }: AdvancedModuleEditorProps) {
    const [versions, setVersions] = useState<any[]>(initialVersions);
    const [showHistory, setShowHistory] = useState(false);
    const [showTranslate, setShowTranslate] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(currentUser?.motherTongue || "");
    const [currentContent, setCurrentContent] = useState(module.officialText || "");
    
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

        // Strip HTML for cleaner text diff, or try to diff HTML string. 
        // For rich text, diffing HTML source is often messy but acceptable for "technical" view.
        // A better approach for "Text" diff is to use a DOM parser to extract text, but let's try raw HTML string diff first
        // as highlighting tags changes might be useful or confusing. 
        // User asked "highlight text differences". 
        // Let's strip tags for readability using a simple regex: .replace(/<[^>]*>?/gm, '')
        // But then we lose structure. 
        // Let's stick to raw string diff for simplicity as requested, 
        // highlighting added/removed chunks.
        
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
    const languages = Array.from(new Set(partners.map(p => p.nation).filter(Boolean)));

    return (
        <div className="flex flex-col h-full relative">
            {/* Toolbar Extras */}
            <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                     <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className={showHistory ? "bg-slate-200" : ""}>
                        <History size={16} className="mr-1" /> History
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setShowTranslate(true)}>
                        <Globe size={16} className="mr-1" /> Translate
                     </Button>
                </div>
                <div>
                     <span className="text-xs text-slate-500 mr-4 font-mono">
                        {currentContent.replace(/<[^>]*>?/gm, '').length} / {module.maxCharacters || 3000} chars 
                        ({Math.round((currentContent.replace(/<[^>]*>?/gm, '').length / (module.maxCharacters || 3000)) * 100)}%)
                     </span>
                     <Button size="sm" onClick={handleSaveVersion} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save size={16} className="mr-1" /> Save Version
                     </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Editor */}
                <div className="flex-1 flex flex-col min-w-0">
                    <RichTextEditor 
                        moduleId={module.id} 
                        initialContent={module.officialText || ""} 
                        maxChars={module.maxChars || undefined}
                        onContentChange={(html) => setCurrentContent(html)}
                    />
                    
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
                        <select 
                            className="w-full border rounded p-2" 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            aria-label="Select Language"
                        >
                            <option value="">Select Language</option>
                            {languages.map(l => (
                                <option key={String(l)} value={String(l)}>{String(l)}</option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedLanguage && (
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 h-64 overflow-y-auto relative group">
                            <div className="absolute top-2 right-2 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                                {selectedLanguage}
                            </div>
                            {/* Mock Translation */}
                            <p className="text-slate-600 leading-relaxed">
                                [Translated content to {selectedLanguage} would appear here...]
                                <br/><br/>
                                {currentContent.replace(/<[^>]*>?/gm, ' ').substring(0, 200)}...
                            </p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
