"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generatePDF, PDFConfig } from "@/lib/pdf-generator";
import { Check, FileText, ChevronRight, ChevronDown, Layers, File, Settings, Palette } from "lucide-react";

interface ExportConfiguratorProps {
    project: any;
}

export function ExportConfigurator({ project }: ExportConfiguratorProps) {
    // Initial ID collection (select all by default?)
    const getAllIds = () => {
        const ids: string[] = [];
        project.modules?.forEach((m: any) => ids.push(m.id));
        project.works?.forEach((w: any) => {
            ids.push(w.id);
            w.modules?.forEach((m: any) => ids.push(m.id));
            w.tasks?.forEach((t: any) => {
                ids.push(t.id);
                t.modules?.forEach((m: any) => ids.push(m.id));
                t.activities?.forEach((a: any) => {
                    ids.push(a.id);
                    a.modules?.forEach((m: any) => ids.push(m.id));
                });
            });
        });
        return ids;
    };

    const [config, setConfig] = useState<PDFConfig>({
        scope: { selectedIds: getAllIds() },
        options: {
            includeComments: false,
            includeCover: true,
            includeTOC: true,
            includePartners: true,
        },
        style: {
            theme: 'modern',
            customTitle: project.title,
        }
    });

    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    
    // Toggle expand
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Toggle Selection
    const toggleSelection = (id: string, childrenIds: string[] = []) => {
        const isSelected = config.scope.selectedIds.includes(id);
        let newIds = [...config.scope.selectedIds];
        
        if (isSelected) {
            // Unselect self and children
            newIds = newIds.filter(x => x !== id && !childrenIds.includes(x));
        } else {
            // Select self and children
            newIds.push(id, ...childrenIds);
        }
        
        // Deduplicate
        newIds = Array.from(new Set(newIds));
        setConfig({ ...config, scope: { ...config.scope, selectedIds: newIds } });
    };
    
    // Checkbox helper
    const Checkbox = ({ id, label, childrenIds = [], level = 0, isLeaf = false }: { id: string, label: string, childrenIds?: string[], level?: number, isLeaf?: boolean }) => {
        const isSelected = config.scope.selectedIds.includes(id);
        // Partial check logic is complex, simpler: if self is selected, show check.
        // If it's a folder, maybe auto-select children?
        
        const hasChildren = childrenIds.length > 0;
        const isExpanded = expandedIds.includes(id);

        return (
            <div className={`ml-${level * 4} select-none`}>
                <div className="flex items-center gap-2 py-1 hover:bg-slate-50 rounded px-2">
                    {hasChildren && !isLeaf ? (
                        <button onClick={() => toggleExpand(id)} className="text-slate-400 hover:text-slate-700">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : <span className="w-3.5" />} {/* Spacer */}
                    
                    <button 
                        onClick={() => toggleSelection(id, childrenIds)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}
                    >
                        {isSelected && <Check size={10} />}
                    </button>
                    
                    <span 
                        className={`text-sm cursor-pointer flex-1 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}
                        onClick={() => toggleSelection(id, childrenIds)}
                    >
                        {label}
                    </span>
                    
                    {isLeaf && <span className="text-[10px] uppercase text-slate-400 border px-1 rounded bg-slate-50">Module</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full">
            {/* Left: Scope Selection */}
            <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Layers size={18} /> Structure & Scope
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Select elements to include in the export.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {/* General Modules */}
                    {project.modules?.map((m: any) => (
                        <Checkbox key={m.id} id={m.id} label={m.title} level={0} isLeaf />
                    ))}
                    
                    {/* Work Packages */}
                    {project.works?.map((w: any) => {
                        // Gather children IDs for convenient parent selection
                        const childIds : string[] = [];
                        w.modules?.forEach((m: any) => childIds.push(m.id));
                        w.tasks?.forEach((t: any) => {
                            childIds.push(t.id);
                            t.modules?.forEach((m: any) => childIds.push(m.id));
                            t.activities?.forEach((a: any) => {
                                childIds.push(a.id);
                                a.modules?.forEach((m: any) => childIds.push(m.id));
                            });
                        });

                        return (
                           <div key={w.id}>
                               <Checkbox id={w.id} label={w.title} childrenIds={childIds} level={0} />
                               
                               {expandedIds.includes(w.id) && (
                                   <div className="ml-4 border-l border-slate-200 pl-2">
                                       {w.modules?.map((m: any) => <Checkbox key={m.id} id={m.id} label={m.title} level={1} isLeaf />)}
                                       {w.tasks?.map((t: any) => {
                                           const taskChildIds : string [] = [];
                                           t.modules?.forEach((m: any) => taskChildIds.push(m.id));
                                           t.activities?.forEach((a: any) => {
                                                taskChildIds.push(a.id);
                                                a.modules?.forEach((m: any) => taskChildIds.push(m.id));
                                            });

                                           return (
                                               <div key={t.id}>
                                                    <Checkbox id={t.id} label={t.title} childrenIds={taskChildIds} level={1} />
                                                    {expandedIds.includes(t.id) && (
                                                        <div className="ml-4 border-l border-slate-200 pl-2">
                                                            {t.modules?.map((m: any) => <Checkbox key={m.id} id={m.id} label={m.title} level={2} isLeaf />)}
                                                            {/* Activities could go here */}
                                                        </div>
                                                    )}
                                               </div>
                                           )
                                       })}
                                   </div>
                               )}
                           </div>
                        )
                    })}
                </div>
            </div>

            {/* Right: Options & Style */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-6 grid grid-cols-2 gap-8 overflow-y-auto flex-1">
                    
                    {/* Style Section */}
                    <div className="space-y-6">
                         <div className="flex items-center gap-2 text-indigo-600 mb-4 border-b pb-2">
                            <Palette size={20} />
                            <h3 className="font-semibold text-lg">Presentation & Style</h3>
                         </div>

                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['modern', 'classic', 'minimal'] as const).map(t => (
                                        <div 
                                            key={t}
                                            onClick={() => setConfig({...config, style: {...config.style, theme: t}})}
                                            className={`
                                                cursor-pointer border rounded-lg p-3 text-center capitalize text-sm transition-all
                                                ${config.style.theme === t ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 font-semibold' : 'border-slate-200 hover:border-slate-300'}
                                            `}
                                        >
                                            {t}
                                            <div className={`mt-2 h-2 rounded-full w-full ${
                                                t === 'modern' ? 'bg-blue-600' : 
                                                t === 'classic' ? 'bg-slate-800' : 'bg-slate-400'
                                            }`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <Input 
                                label="Cover Page Title"
                                value={config.style.customTitle}
                                onChange={(e) => setConfig({...config, style: {...config.style, customTitle: e.target.value}})}
                                placeholder="E.g. Final Technical Report"
                            />
                         </div>
                    </div>

                    {/* Content Options */}
                    <div className="space-y-6">
                         <div className="flex items-center gap-2 text-emerald-600 mb-4 border-b pb-2">
                            <Settings size={20} />
                            <h3 className="font-semibold text-lg">Content Settings</h3>
                         </div>
                         
                         <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={config.options.includeCover}
                                    onChange={(e) => setConfig({...config, options: {...config.options, includeCover: e.target.checked}})}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <div>
                                    <span className="block font-medium text-slate-900">Include Cover Page</span>
                                    <span className="text-xs text-slate-500">Adds a professional cover with title and date</span>
                                </div>
                            </label>

                             <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={config.options.includeTOC}
                                    onChange={(e) => setConfig({...config, options: {...config.options, includeTOC: e.target.checked}})}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <div>
                                    <span className="block font-medium text-slate-900">Table of Contents</span>
                                    <span className="text-xs text-slate-500">Auto-generated index of selected items</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={config.options.includeComments}
                                    onChange={(e) => setConfig({...config, options: {...config.options, includeComments: e.target.checked}})}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <div>
                                    <span className="block font-medium text-slate-900">Include Comments</span>
                                    <span className="text-xs text-slate-500">Append user comments to module content</span>
                                </div>
                            </label>
                         </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 items-center">
                    <span className="text-sm text-slate-500">
                        {config.scope.selectedIds.length} items selected
                    </span>
                    <Button 
                        size="lg" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        onClick={() => generatePDF(project, config)}
                    >
                        <FileText size={18} className="mr-2" /> Generate PDF Report
                    </Button>
                </div>
            </div>
        </div>
    );
}
