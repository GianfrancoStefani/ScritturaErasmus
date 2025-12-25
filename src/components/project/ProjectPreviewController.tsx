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
    Palette,
    History,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ProjectZenContent } from "@/components/project/ProjectZenContent";
import clsx from "clsx";
import { getAnnotatedVersionsForModules } from "@/app/actions/module_versions";
import { toast } from "sonner";

type PreviewMode = 'READER' | 'NOTES' | 'REVIEW' | 'FULL';
type SidebarTab = 'OPTIONS' | 'VERSIONS';

interface ProjectPreviewControllerProps {
    project: any;
    currentUser?: any;
}

export function ProjectPreviewController({ project, currentUser }: ProjectPreviewControllerProps) {
    const [mode, setMode] = useState<PreviewMode>('READER');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('OPTIONS');
    
    // Filters & Config
    const [visibleSections, setVisibleSections] = useState<string[]>(project.sections.map((s: any) => s.id));
    const [showComments, setShowComments] = useState(true);
    const [showAuthors, setShowAuthors] = useState(true);
    const [showEmptyModules, setShowEmptyModules] = useState(true);
    const [showAbstract, setShowAbstract] = useState(true);
    const [showWorkPackages, setShowWorkPackages] = useState(true);
    const [activeTool, setActiveTool] = useState<'CURSOR' | 'HIGHLIGHTER' | 'CIRCLE' | 'ARROW'>('CURSOR');
    const [activeColor, setActiveColor] = useState('#ef4444'); // Default red
    const [showEmptySections, setShowEmptySections] = useState(true);
    const [isSectionsOpen, setIsSectionsOpen] = useState(true);
    const [enableTranslation, setEnableTranslation] = useState(false);

    // Versions State
    const [versions, setVersions] = useState<any[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    // Fetch Versions on Tab Change
    React.useEffect(() => {
        if (activeTab === 'VERSIONS') {
            fetchVersions();
        }
    }, [activeTab]);

    const fetchVersions = async () => {
        setIsLoadingVersions(true);
        // Collect all module IDs from the project tree
        const moduleIds: string[] = [];
        if (project.modules) project.modules.forEach((m:any) => moduleIds.push(m.id));
        project.sections.forEach((s:any) => {
            if (s.modules) s.modules.forEach((m:any) => moduleIds.push(m.id));
            if (s.works) s.works.forEach((w:any) => {
                if (w.modules) w.modules.forEach((m:any) => moduleIds.push(m.id));
                if (w.tasks) w.tasks.forEach((t:any) => {
                    if (t.modules) t.modules.forEach((m:any) => moduleIds.push(m.id));
                });
            });
        });

        // Filter valid IDs
        const uniqueIds = Array.from(new Set(moduleIds));
        
        const res = await getAnnotatedVersionsForModules(uniqueIds);
        if (res.error) {
            toast.error("Failed to load versions history");
        } else {
            setVersions(res.versions || []);
        }
        setIsLoadingVersions(false);
    };

    // Mode Presets
    React.useEffect(() => {
        switch (mode) {
            case 'READER':
                setShowAuthors(false);
                setShowComments(false);
                setShowEmptyModules(false);
                setShowEmptySections(false);
                break;
            case 'REVIEW':
                setShowAuthors(true);
                setShowComments(true);
                setShowEmptyModules(true);
                setShowEmptySections(true);
                break;
            case 'NOTES':
                setShowAuthors(false);
                setShowComments(false);
                setShowEmptyModules(true);
                setShowEmptySections(true);
                break;
            case 'FULL':
                setShowAuthors(true);
                setShowComments(true);
                setShowEmptyModules(true);
                setShowEmptySections(true);
                break;
        }
    }, [mode]);

    const filteredProject = useMemo(() => {
        // Create a deep copy to avoid mutating the original
        const p = JSON.parse(JSON.stringify(project));
        
        // If a specific version is selected, we need to inject that content
        // For simplicity in this "Project Preview" scope, we might just look up the version content 
        // if we had a mapping. Since getAnnotatedVersionsForModules returns a list, 
        // actually applying a *Project Wide* version restore state visualization is complex 
        // because versions are per-module. 
        // The user asked for "cronologia versioni ANNOTATE salvate".
        // We will display them in the list. Clicking one might just show a "Preview" modal or 
        // conceptually, since they are independent, we can't easily "show the whole project at time X" 
        // unless we had ProjectVersions. 
        // However, we can inject the specific version content into the specific module in the preview?
        // Let's implement injection logic if selectedVersionId matches a module.
        // Actually, the list will show "Module X - Version Y". 
        // If clicked, we find that module in `p` and replace its text/components.

        if (selectedVersionId) {
             const selectedVersion = versions.find(v => v.id === selectedVersionId);
             if (selectedVersion) {
                 console.log("Previewing Version:", selectedVersion);
                 // Deep traverse to find the module and replace content
                 const replaceInModules = (modules: any[]) => {
                     const m = modules.find((mod: any) => mod.id === selectedVersion.moduleId);
                     if (m) {
                         m.officialText = selectedVersion.content; // Show version text
                         
                         // Restore Annotations
                         if (selectedVersion.annotations) {
                             try {
                                 // Handle both stringified JSON and direct object (Prisma might return object)
                                 const restored = typeof selectedVersion.annotations === 'string' 
                                     ? JSON.parse(selectedVersion.annotations) 
                                     : selectedVersion.annotations;
                                 
                                 m.components = Array.isArray(restored) ? restored : [];
                                 console.log("Restored components:", m.components);
                             } catch (e) {
                                 console.error("Failed to restore annotations:", e);
                                 m.components = [];
                             }
                         } else {
                             m.components = [];
                         }

                         m.isVersionPreview = true;
                     }
                 };

                 // Traverse project structure
                 if (p.modules) replaceInModules(p.modules);
                 p.sections.forEach((s: any) => {
                     if (s.modules) replaceInModules(s.modules);
                     if (s.works) {
                         s.works.forEach((w: any) => {
                             if (w.modules) replaceInModules(w.modules);
                             if (w.tasks) {
                                 w.tasks.forEach((t: any) => {
                                     if (t.modules) replaceInModules(t.modules);
                                     if (t.activities) {
                                         t.activities.forEach((a: any) => {
                                             if (a.modules) replaceInModules(a.modules);
                                         });
                                     }
                                 });
                             }
                         });
                     }
                 });
             }
        }

        // Filter Abstract (Top level modules)
        if (!showAbstract) {
            p.modules = [];
        }

        // Filter Work Packages (Top level works)
        if (!showWorkPackages) {
            p.works = [];
        }

        // Filter Sections and their content
        p.sections = p.sections.filter((s: any) => visibleSections.includes(s.id));
        
        // Filter WPs inside sections if hidden
        if (!showWorkPackages) {
             p.sections.forEach((s: any) => {
                 s.works = [];
             });
        }

        return p;
    }, [project, visibleSections, showAbstract, showWorkPackages, selectedVersionId, versions]);

    const toggleSection = (id: string) => {
        setVisibleSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const targetLanguage = currentUser?.motherTongue || 'en';

    return (
        <div className="fixed inset-0 z-[100] flex h-screen overflow-hidden bg-slate-50 print:bg-white print:h-auto print:static">
             <style jsx global>{`
                @media print {
                    @page { 
                        margin: 20mm; 
                        size: A4; 
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: #fff !important;
                        font-family: 'Times New Roman', Times, serif; /* Professional serif for print */
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .print-content { 
                        position: static !important; 
                        width: 100% !important; 
                        max-width: none !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* Typography overrides for professional print */
                    h1 { font-size: 24pt !important; color: #000 !important; margin-bottom: 20pt !important; }
                    h2 { font-size: 18pt !important; color: #000 !important; border-color: #000 !important; margin-top: 20pt !important; }
                    h3 { font-size: 14pt !important; color: #000 !important; }
                    h4 { font-size: 12pt !important; color: #000 !important; }
                    p { font-size: 11pt !important; line-height: 1.5 !important; color: #000 !important; text-align: justify; }
                    
                    /* Hide decorative elements */
                    .bg-indigo-500\/30 { display: none !important; } /* Module bar */
                    
                    /* Page Breaks */
                    section { page-break-inside: avoid; }
                    h1, h2 { page-break-after: avoid; }
                }
            `}</style>
            
            {/* Sidebar Config */}
            {isSidebarOpen && (
                <div className="w-80 border-r border-slate-200 bg-white flex flex-col shadow-xl z-20 animate-in slide-in-from-left duration-300 no-print">
                    
                    {/* Header with Tabs */}
                    <div className="border-b border-slate-100">
                        <div className="p-4 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800">Preview Controller</h2>
                             <button 
                                onClick={() => setIsSidebarOpen(false)} 
                                className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                title="Close Config"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex px-4 gap-4">
                            <button 
                                onClick={() => setActiveTab('OPTIONS')}
                                className={clsx(
                                    "pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2",
                                    activeTab === 'OPTIONS' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Options
                            </button>
                            <button 
                                onClick={() => setActiveTab('VERSIONS')}
                                className={clsx(
                                    "pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1",
                                    activeTab === 'VERSIONS' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                History <History size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {activeTab === 'OPTIONS' ? (
                            <>
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
                                    <button 
                                        onClick={() => setIsSectionsOpen(!isSectionsOpen)}
                                        className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                                    >
                                        <span>Sections & Modules</span>
                                        {isSectionsOpen ? <ChevronDown size={14} /> : <span className="text-lg leading-3">+</span>}
                                    </button>
                                    
                                    {isSectionsOpen && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors border border-transparent">
                                            <input 
                                                type="checkbox" 
                                                checked={showAbstract} 
                                                onChange={(e) => setShowAbstract(e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700 font-medium">Abstract / Setup</span>
                                        </label>
                                        
                                        <div className="h-px bg-slate-100 my-2" />
                                        
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

                                        <div className="h-px bg-slate-100 my-2" />

                                        <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors border border-transparent">
                                            <input 
                                                type="checkbox" 
                                                checked={showWorkPackages} 
                                                onChange={(e) => setShowWorkPackages(e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700 font-medium">Work Packages</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors border border-transparent">
                                            <input 
                                                type="checkbox" 
                                                checked={showEmptySections} 
                                                onChange={(e) => setShowEmptySections(e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700 font-medium italic">Mostra Sezioni Vuote</span>
                                        </label>
                                    </div>
                                    )}
                                </div>

                                {/* Display Toggles */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <Toggle label="Show Authors" checked={showAuthors} onChange={setShowAuthors} />
                                    <Toggle label="Show Comments" checked={showComments} onChange={setShowComments} />
                                    <Toggle label="Show Empty Modules" checked={showEmptyModules} onChange={setShowEmptyModules} />
                                    
                                    <div className="h-px bg-slate-100 my-4" />
                                    
                                    <div className="flex items-center justify-between">
                                        <span className={clsx("text-sm font-medium transition-colors", enableTranslation ? "text-indigo-600 font-bold" : "text-slate-600")}>
                                            Translate to {currentUser?.motherTongue || 'Mother Tongue'}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={enableTranslation}
                                                onChange={(e) => {
                                                    setEnableTranslation(e.target.checked);
                                                    if (e.target.checked) toast.info(`Translation enabled (Target: ${targetLanguage})`);
                                                }}
                                                aria-label={`Translate to ${currentUser?.motherTongue || 'Mother Tongue'}`}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
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
                                        {[
                                            { hex: '#ef4444', tw: 'bg-red-500' },
                                            { hex: '#22c55e', tw: 'bg-green-500' },
                                            { hex: '#3b82f6', tw: 'bg-blue-500' },
                                            { hex: '#eab308', tw: 'bg-yellow-500' },
                                            { hex: '#ec4899', tw: 'bg-pink-500' },
                                            { hex: '#000000', tw: 'bg-black' }
                                        ].map(color => (
                                            <button 
                                                key={color.hex}
                                                onClick={() => setActiveColor(color.hex)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-full border-2 transition-all",
                                                    activeColor === color.hex ? "border-slate-800 scale-125 shadow-sm" : "border-slate-100 hover:scale-110",
                                                    color.tw
                                                )}
                                                title={`Select color`}
                                            />
                                        ))}
                                     </div>
                                </div>

                                {/* Export */}
                                 <div className="space-y-4 pt-6 border-t border-slate-100">
                                     <Button onClick={handlePrint} variant="outline" className="w-full gap-2 border-slate-200">
                                        <FileText size={16} /> Print / Save as PDF
                                     </Button>
                                </div>
                            </>
                        ) : (
                            // Versions Tab
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-700">Annotated Snapshots</h3>
                                    <button 
                                        onClick={fetchVersions} 
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                        title="Refresh versions"
                                    >
                                        <RefreshCw size={14} className={isLoadingVersions ? "animate-spin" : ""} />
                                    </button>
                                </div>
                                
                                {selectedVersionId && (
                                     <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4 flex items-center justify-between">
                                        <span>Previewing historical version</span>
                                        <button onClick={() => setSelectedVersionId(null)} className="font-bold underline">Exit</button>
                                     </div>
                                )}

                                <div className="space-y-3">
                                    {versions.length === 0 && !isLoadingVersions && (
                                        <p className="text-xs text-slate-400 italic text-center py-8">No annotated versions found.</p>
                                    )}
                                    {versions.map((v) => (
                                        <button 
                                            key={v.id}
                                            onClick={() => setSelectedVersionId(prev => prev === v.id ? null : v.id)}
                                            className={clsx(
                                                "w-full text-left p-3 rounded-lg border transition-all hover:bg-slate-50 relative group",
                                                selectedVersionId === v.id ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : "bg-white border-slate-100"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(v.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-slate-300">{new Date(v.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="font-medium text-slate-800 text-sm truncate pr-2">
                                                {v.module?.title || "Unknown Module"}
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye size={10} /> {selectedVersionId === v.id ? "Stop Preview" : "Preview Content"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                             </div>
                        )}
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
            <div className="flex-1 overflow-y-auto relative bg-white print-content print:overflow-visible print:h-auto print:block">
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-6 left-6 z-30 p-2 bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all text-indigo-600 no-print"
                        title="Open Config"
                    >
                        <Settings size={20} />
                    </button>
                )}

                <div className={clsx(
                    "max-w-4xl mx-auto py-20 px-8 transition-all duration-500 print-content",
                    mode === 'READER' ? "max-w-3xl" : "max-w-5xl"
                )}>
                    {/* Header Info */}
                    <div className="mb-16 pb-8 border-b border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase block">Project Submission Review</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">v{project.version || 1}</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 mb-6">{project.title}</h1>
                        <div className="flex gap-6 text-slate-400 text-sm">
                            <div className="flex items-center gap-1.5"><Clock size={16} /> Created {new Date(project.createdAt).toLocaleDateString('en-GB')}</div>
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
                        showEmptySections={showEmptySections}
                        enableTranslation={enableTranslation}
                        targetLanguage={targetLanguage}
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
