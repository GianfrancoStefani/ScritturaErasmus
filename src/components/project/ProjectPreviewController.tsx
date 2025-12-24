"use client";

import React, { useState, useMemo } from "react";
import { 
    Eye, 
    Edit3, 
    MessageSquare, 
    FileText, 
    Settings, 
    X, 
    ArrowLeft,
    ChevronDown,
    Filter,
    User,
    Clock,
    Layout,
    MousePointer2,
    Highlighter,
    Circle,
    ArrowUpRight,
    Palette
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ProjectZenContent } from "./ProjectZenContent";
import clsx from "clsx";

type PreviewMode = 'READER' | 'NOTES' | 'REVIEW' | 'FULL';

interface ProjectPreviewControllerProps {
    project: any;
}

export function ProjectPreviewController({ project }: ProjectPreviewControllerProps) {
    const [mode, setMode] = useState<PreviewMode>('READER');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [visibleSections, setVisibleSections] = useState<string[]>(project.sections.map((s: any) => s.id));
    const [showComments, setShowComments] = useState(true);
    const [showAuthors, setShowAuthors] = useState(true);
    const [showEmptyModules, setShowEmptyModules] = useState(true);
    const [activeTool, setActiveTool] = useState<'CURSOR' | 'HIGHLIGHTER' | 'CIRCLE' | 'ARROW'>('CURSOR');
    const [activeColor, setActiveColor] = useState('#ef4444'); // Default red

    const filteredProject = useMemo(() => {
        // Create a deep copy to avoid mutating the original
        const p = JSON.parse(JSON.stringify(project));
        p.sections = p.sections.filter((s: any) => visibleSections.includes(s.id));
        return p;
    }, [project, visibleSections]);

    const toggleSection = (id: string) => {
        setVisibleSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar Config */}
            {isSidebarOpen && (
                <div className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-xl z-20 animate-in slide-in-from-left duration-300">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layout className="text-indigo-600" size={20} />
                            <h2 className="font-bold text-slate-800">Review Options</h2>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="p-1 hover:bg-slate-100 rounded text-slate-400"
                            title="Close Config"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Mode Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visualization Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <ModeButton 
                                    active={mode === 'READER'} 
                                    onClick={() => setMode('READER')}
                                    icon={<Eye size={16} />}
                                    label="Reader"
                                    description="Clean layout"
                                />
                                <ModeButton 
                                    active={mode === 'NOTES'} 
                                    onClick={() => setMode('NOTES')}
                                    icon={<Edit3 size={16} />}
                                    label="Notes"
                                    description="Add thoughts"
                                />
                                <ModeButton 
                                    active={mode === 'REVIEW'} 
                                    onClick={() => setMode('REVIEW')}
                                    icon={<MessageSquare size={16} />}
                                    label="Review"
                                    description="Feedbacks"
                                />
                                <ModeButton 
                                    active={mode === 'FULL'} 
                                    onClick={() => setMode('FULL')}
                                    icon={<FileText size={16} />}
                                    label="Full"
                                    description="All data"
                                />
                            </div>
                        </div>

                        {/* Content Filters */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Filters</label>
                            <div className="space-y-2">
                                {project.sections.map((s: any) => (
                                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors border border-transparent">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleSections.includes(s.id)} 
                                            onChange={() => toggleSection(s.id)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700 truncate">{s.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Display Toggles */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <Toggle label="Show Authors" checked={showAuthors} onChange={setShowAuthors} />
                            <Toggle label="Show Comments" checked={showComments} onChange={setShowComments} />
                            <Toggle label="Show Empty Modules" checked={showEmptyModules} onChange={setShowEmptyModules} />
                        </div>

                        {/* Annotation Tools */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Palette size={12} /> Annotation Tools
                             </label>
                             <div className="grid grid-cols-4 gap-2">
                                <ToolButton active={activeTool === 'CURSOR'} onClick={() => setActiveTool('CURSOR')} icon={<MousePointer2 size={16} />} title="Cursor" />
                                <ToolButton active={activeTool === 'HIGHLIGHTER'} onClick={() => setActiveTool('HIGHLIGHTER')} icon={<Highlighter size={16} />} title="Highlighter" />
                                <ToolButton active={activeTool === 'CIRCLE'} onClick={() => setActiveTool('CIRCLE')} icon={<Circle size={16} />} title="Circle" />
                                <ToolButton active={activeTool === 'ARROW'} onClick={() => setActiveTool('ARROW')} icon={<ArrowUpRight size={16} />} title="Arrow" />
                             </div>
                             
                             <div className="flex justify-between items-center px-1">
                                {['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-pink-500'].map(colorClass => (
                                    <button 
                                        key={colorClass}
                                        onClick={() => setActiveColor(colorClass)}
                                        className={clsx(
                                            "w-6 h-6 rounded-full border-2 transition-all",
                                            colorClass,
                                            activeColor === colorClass ? "border-slate-800 scale-125 shadow-sm" : "border-transparent hover:scale-110"
                                        )}
                                        title={`Select color`}
                                    />
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100">
                        <Link href={`/dashboard/projects/${project.id}`}>
                            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500 hover:text-slate-800">
                                <ArrowLeft size={16} /> Exit Preview
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative bg-white">
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-6 left-6 z-30 p-2 bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all text-indigo-600"
                        title="Open Config"
                    >
                        <Settings size={20} />
                    </button>
                )}

                <div className={clsx(
                    "max-w-4xl mx-auto py-20 px-8 transition-all duration-500",
                    mode === 'READER' ? "max-w-3xl" : "max-w-5xl"
                )}>
                    {/* Header Info */}
                    <div className="mb-16 pb-8 border-b border-slate-100">
                        <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase mb-4 block">Project Submission Review</span>
                        <h1 className="text-5xl font-black text-slate-900 mb-6">{project.title}</h1>
                        <div className="flex gap-6 text-slate-400 text-sm">
                            <div className="flex items-center gap-1.5"><Clock size={16} /> Created {new Date(project.createdAt).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5"><User size={16} /> {project.acronym}</div>
                        </div>
                    </div>

                    {/* Rendering Engine */}
                    <ProjectZenContent 
                        project={filteredProject} 
                        mode={mode}
                        showAuthors={showAuthors}
                        showComments={showComments}
                        showEmptyModules={showEmptyModules}
                        activeTool={activeTool}
                        activeColor={activeColor}
                    />
                </div>
            </div>
        </div>
    );
}

function ModeButton({ active, onClick, icon, label, description }: any) {
    return (
        <button 
            onClick={onClick}
            className={clsx(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                active ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
            )}
        >
            <div className={clsx("mb-2", active ? "text-indigo-600" : "text-slate-400")}>{icon}</div>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[9px] opacity-70 mt-0.5">{description}</span>
        </button>
    );
}

function ToolButton({ active, onClick, icon, title }: any) {
    return (
        <button 
            onClick={onClick}
            title={title}
            className={clsx(
                "flex items-center justify-center p-2 rounded-lg border transition-all",
                active ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
            )}
        >
            {icon}
        </button>
    );
}

function Toggle({ label, checked, onChange }: any) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
            <div className="relative inline-flex items-center">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
        </label>
    );
}
