"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Layers, ChevronDown, ChevronRight, Briefcase } from "lucide-react";
import { ModuleItem } from "./ModuleItem";
import { CreateModuleButton } from "@/components/modules/ModuleForm";
import { Button } from "@/components/ui/Button";
import { CreateTaskButton } from "@/components/tasks/CreateTaskButton";
import { EditWorkPackageButton } from "@/components/works/WorkPackageForm";
import { CloneWorkPackageButton } from "@/components/works/CloneWorkPackageButton";

import { ActivityItem } from "@/components/activities/ActivityItem";
import { ActivityForm } from "@/components/activities/ActivityForm";

export function WorkPackageItem({ work, projectId, partners = [], onMoveModule }: { work: any, projectId: string, partners?: any[], onMoveModule?: (moduleId: string, direction: 'UP' | 'DOWN') => void }) {
    console.log(`[WorkPackageItem] Render ${work.title}. Modules:`, work.modules?.map((m: any) => m.title).join(', '));
    const [isOpen, setIsOpen] = useState(true); // Main WP Expand
    const [showModules, setShowModules] = useState(true); // Level 1 Modules
    const [showTasks, setShowTasks] = useState(true); // Tasks Section

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: work.id, data: { type: "WORK", work } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-xl border border-l-4 border-slate-200 border-l-indigo-500 shadow-sm overflow-hidden mb-6"
        >
             {/* WP Header */}
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
                 <div className="flex items-center gap-3">
                     <div 
                        className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                        {...attributes} {...listeners}
                     >
                        <Layers size={16} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800">{work.title}</h3>
                        <div className="text-xs text-slate-500 flex gap-2">
                             <span>Budget: €{work.budget}</span>
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <EditWorkPackageButton projectId={projectId} work={work} />
                    <CloneWorkPackageButton workId={work.id} projectId={projectId} />
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>
                    <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-600">
                        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                 </div>
             </div>

             {/* Content */}
            {isOpen && (
                <div className="p-4 space-y-4">
                    
                    {/* Level 1 Modules Section */}
                    <div className="border rounded bg-slate-50/50">
                        <button 
                            onClick={() => setShowModules(!showModules)}
                            className="w-full flex items-center justify-between p-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100"
                        >
                            <span>General Modules ({work.modules.length})</span>
                            {showModules ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        
                        {showModules && (
                            <div className="p-2 space-y-2">
                                <SortableContext 
                                    id={`wp-modules-${work.id}`} 
                                    items={work.modules.map((m: any) => m.id)} 
                                    strategy={verticalListSortingStrategy}
                                >
                                    {work.modules.map((m: any, index: number) => (
                                        <ModuleItem 
                                            key={m.id} 
                                            module={m} 
                                            projectId={projectId} 
                                            isFirst={index === 0}
                                            isLast={index === work.modules.length - 1}
                                            onMove={onMoveModule}
                                        />
                                    ))}
                                    {work.modules.length === 0 && (
                                        <div className="text-center py-2 text-xs text-slate-400 border border-dashed rounded">No modules</div>
                                    )}
                                </SortableContext>
                                <div className="pt-2 flex justify-center">
                                    <CreateModuleButton parentId={work.id} parentType="WORK" className="text-xs" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tasks Section */}
                    <div className="border rounded bg-slate-50/50">
                         <button 
                            onClick={() => setShowTasks(!showTasks)}
                            className="w-full flex items-center justify-between p-2 text-xs font-bold text-indigo-500 uppercase tracking-wider hover:bg-slate-100"
                        >
                            <span>Tasks ({work.tasks.length})</span>
                            {showTasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {showTasks && (
                            <div className="p-2 space-y-4">
                                {work.tasks.map((task: any) => (
                                    <div key={task.id} className="bg-white border border-slate-200 rounded shadow-sm p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-semibold text-sm text-slate-700">{task.title}</div>
                                            <div className="flex gap-2">
                                                 <ActivityForm 
                                                    parentId={task.id} 
                                                    projectId={projectId} 
                                                    partners={partners}
                                                    className="h-6 text-[10px] px-2 py-0"
                                                />
                                            </div>
                                        </div>

                                        {/* Task Modules */}
                                        <div className="mb-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modules</div>
                                            <SortableContext 
                                                id={`task-modules-${task.id}`} 
                                                items={task.modules.map((m: any) => m.id)} 
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {task.modules.map((m: any, index: number) => (
                                                    <ModuleItem 
                                                        key={m.id} 
                                                        module={m} 
                                                        projectId={projectId} 
                                                        isFirst={index === 0}
                                                        isLast={index === task.modules.length - 1}
                                                        onMove={onMoveModule}
                                                    />
                                                ))}
                                            </SortableContext>
                                            <div className="mt-2 text-center">
                                                <CreateModuleButton parentId={task.id} parentType="TASK" className="text-[10px] py-0 h-6" label="Add Module" />
                                            </div>
                                        </div>

                                        {/* Activities List */}
                                        {task.activities && (
                                           <div className="border-t border-slate-100 pt-2 mt-2">
                                                <div className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Activities ({task.activities.length})</div>
                                                <div className="space-y-3">
                                                    {task.activities.map((act: any) => (
                                                        <ActivityItem 
                                                            key={act.id} 
                                                            activity={act} 
                                                            projectId={projectId} 
                                                            partners={partners}
                                                            onMoveModule={onMoveModule}
                                                        />
                                                    ))}
                                                    {task.activities.length === 0 && (
                                                        <div className="text-center py-2 text-[10px] text-slate-400 italic">No activities</div>
                                                    )}
                                                </div>
                                           </div>
                                        )}
                                    </div>
                                ))}
                                <CreateTaskButton workId={work.id} className="w-full text-xs dashed border-slate-300 text-slate-400" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
