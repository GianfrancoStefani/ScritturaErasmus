"use client";

import { useState, useOptimistic, useTransition, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { updateModuleStatus } from '@/app/actions/kanban';
import { Layers, Box, LayoutGrid, Filter, X, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal"; 
import { Button } from "@/components/ui/Button";
import Link from 'next/link';
import clsx from 'clsx';

export type ModuleStatus = "TO_DONE" | "UNDER_REVIEW" | "DONE" | "AUTHORIZED";

export interface ModuleTask {
  id: string;
  title: string;
  subtitle: string;
  status: ModuleStatus;
  user?: string;
  sectionId?: string | null;
  sectionTitle?: string | null;
  workId?: string | null;
  workTitle?: string | null;
  projectId?: string;
  officialText?: string;
}

interface FilterItem {
    id: string;
    title: string;
}

interface ProjectItem {
    id: string;
    title: string;
    acronym: string;
}

interface KanbanBoardProps {
    initialModules: ModuleTask[];
    sections: FilterItem[];
    works: FilterItem[];
    projects: ProjectItem[];
}

const columns: { id: ModuleStatus; title: string }[] = [
  { id: 'TO_DONE', title: 'To Do' },
  { id: 'UNDER_REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'AUTHORIZED', title: 'Authorized' },
];

export function KanbanBoard({ initialModules, sections, works, projects }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter State
  const [viewMode, setViewMode] = useState<'ALL' | 'SECTION' | 'WORK'>('ALL');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Preview State
  const [previewModule, setPreviewModule] = useState<ModuleTask | null>(null);

  const [optimisticModules, setOptimisticModules] = useOptimistic(
      initialModules,
      (state, { id, status }: { id: string; status: ModuleStatus }) => {
          return state.map(m => m.id === id ? { ...m, status } : m);
      }
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter Logic
  const filteredModules = useMemo(() => {
      let modules = optimisticModules;

      // Project Filter
      if (selectedProjectId) {
          modules = modules.filter(m => m.projectId === selectedProjectId);
      }

      // Mode Filter
      if (viewMode === 'SECTION' && activeFilterId) {
          modules = modules.filter(m => m.sectionId === activeFilterId);
      } else if (viewMode === 'WORK' && activeFilterId) {
          modules = modules.filter(m => m.workId === activeFilterId);
      }
      
      return modules;
  }, [optimisticModules, viewMode, activeFilterId, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Mode Switch Helper
  const handleModeChange = (mode: 'ALL' | 'SECTION' | 'WORK') => {
      setViewMode(mode);
      setActiveFilterId(null);
      // Auto-select first item
      if (mode === 'SECTION' && sections.length > 0) setActiveFilterId(sections[0].id);
      if (mode === 'WORK' && works.length > 0) setActiveFilterId(works[0].id);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string; 

    let newStatus: ModuleStatus | null = null;
    if (columns.some(col => col.id === overId)) {
        newStatus = overId as ModuleStatus;
    } else {
        const overCard = optimisticModules.find(m => m.id === overId);
        if (overCard) {
            newStatus = overCard.status;
        }
    }

    if (newStatus) {
        const currentModule = optimisticModules.find(m => m.id === activeId);
        if (currentModule && currentModule.status !== newStatus) {
             startTransition(async () => {
                 setOptimisticModules({ id: activeId, status: newStatus! });
                 await updateModuleStatus(activeId, newStatus!);
             });
        }
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
        {/* Navigation & Filters */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
            
            {/* Top Bar: Project Filter + Acronym */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select 
                            aria-label="Filter by Project"
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-[200px] outline-none focus:ring-2 focus:ring-indigo-100"
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(e.target.value || null)}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {selectedProject && (
                        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold text-lg shadow-sm animate-in fade-in flex items-center gap-2">
                            {selectedProject.acronym}
                            <span className="text-indigo-200 text-xs font-normal">Active Project</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button onClick={() => handleModeChange('ALL')} className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all gap-2 flex", viewMode === 'ALL' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>
                        <LayoutGrid size={14} /> All
                    </button>
                    <button onClick={() => handleModeChange('SECTION')} className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all gap-2 flex", viewMode === 'SECTION' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>
                        <Layers size={14} /> Section
                    </button>
                    <button onClick={() => handleModeChange('WORK')} className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all gap-2 flex", viewMode === 'WORK' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>
                        <Box size={14} /> WP
                    </button>
                </div>
            </div>

            {/* Sub-Filters (Chips) */}
            {viewMode !== 'ALL' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {viewMode === 'SECTION' && sections.map(s => (
                        <button key={s.id} onClick={() => setActiveFilterId(s.id)} className={clsx("px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap", activeFilterId === s.id ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200")}>
                            {s.title}
                        </button>
                    ))}
                    {viewMode === 'WORK' && works.map(w => (
                        <button key={w.id} onClick={() => setActiveFilterId(w.id)} className={clsx("px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap", activeFilterId === w.id ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200")}>
                            {w.title}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
        <div className="flex gap-6 h-full overflow-x-auto pb-4 px-2 min-h-0">
            {columns.map((col) => {
                const colTasks = filteredModules.filter(m => m.status === col.id);
                return (
                <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-100/50 border border-slate-200/60">
                    <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{col.title}</h3>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {colTasks.length}
                        </span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto">
                        <KanbanColumn 
                            id={col.id} 
                            title={col.title} 
                            tasks={colTasks}
                            groupBySection={viewMode === 'ALL' && !!selectedProjectId} // Group if Project selected
                            onPreview={(task) => setPreviewModule(task)}
                        />
                    </div>
                </div>
            )})}
        </div>

        <DragOverlay>
            {activeId ? (
            <div className="transform rotate-2 opacity-90 cursor-grabbing">
                <KanbanCard task={optimisticModules.find(m => m.id === activeId)!} />
            </div>
            ) : null}
        </DragOverlay>
        </DndContext>

        {/* Preview Modal */}
        {previewModule && (
            <Modal isOpen={!!previewModule} onClose={() => setPreviewModule(null)} title={previewModule.title}>
                <div className="space-y-4">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                         <span className={clsx("font-bold px-2 py-0.5 rounded text-xs", 
                             previewModule.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                             previewModule.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                         )}>
                             {previewModule.status.replace('_', ' ')}
                         </span>
                         <span>•</span>
                         <span>{previewModule.sectionTitle || "No Section"}</span>
                     </div>
                     
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto prose prose-sm max-w-none">
                         {previewModule.officialText ? (
                             <div dangerouslySetInnerHTML={{ __html: previewModule.officialText }} />
                         ) : (
                             <p className="text-slate-400 italic">No content available.</p>
                         )}
                     </div>

                     <div className="flex justify-end pt-4 border-t border-slate-100">
                         <Link href={`/dashboard/projects/${previewModule.projectId}/modules/${previewModule.id}`}>
                            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <ExternalLink size={16} /> Open Module Page
                            </Button>
                         </Link>
                     </div>
                </div>
            </Modal>
        )}
    </div>
  );
}
