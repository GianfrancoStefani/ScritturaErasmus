"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight, ChevronDown, FileText, Layers, List, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import Link from "next/link";
import { EditModuleButton } from "@/components/modules/ModuleForm";
import { deleteModule } from "@/app/actions/deleteModule";
import { SelectionPopup } from "@/components/ui/SelectionPopup";
import { updateModuleStatus, updateOfficialText } from "@/app/actions/module-editor";
import { moveModule } from "@/app/actions/reorder"; // Import moveModule
import { useRouter } from "next/navigation";
import clsx from "clsx";

export function ModuleItem({ module, projectId, isFirst, isLast, onMove }: { module: any, projectId: string, isFirst?: boolean, isLast?: boolean, onMove?: (moduleId: string, direction: 'UP' | 'DOWN') => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
    const [isSelectionPopupOpen, setIsSelectionPopupOpen] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const router = useRouter();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id, data: { type: "MODULE", module } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const contributionsCount = module.components?.length || 0;

    const handleStatusChange = async (selected: string[]) => {
        if (selected.length > 0) {
            // Optimistic update could go here
            await updateModuleStatus(module.id, selected[0]);
            router.refresh();
        }
    };
    
    const handleMove = async (direction: 'UP' | 'DOWN') => {
        if (onMove) {
            // Optimistic move handled by parent
            onMove(module.id, direction);
        } else {
            // Fallback (legacy or standalone usage)
            setIsMoving(true);
            await moveModule(module.id, direction, projectId);
            router.refresh();
            setIsMoving(false);
        }
    };

    const statusOptions = [
        { label: "To Do", value: "TO_DONE" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Done", value: "DONE" },
        { label: "Authorized", value: "AUTHORIZED" }
    ];

    const currentStatusLabel = statusOptions.find(o => o.value === module.status)?.label || module.status;
    const statusColor = 
        module.status === 'DONE' ? 'bg-green-100 text-green-700' :
        module.status === 'AUTHORIZED' ? 'bg-blue-100 text-blue-700' :
        module.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-600';

    const isPopup = module.type === 'POPUP';
    const bgClass = isPopup ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200';

    return (
        <>
            <div 
                ref={setNodeRef} 
                style={style} 
                className={`${bgClass} border rounded-lg mb-2 overflow-hidden shadow-sm hover:border-indigo-300 transition-colors relative group`}
            >
                {/* Header Row */}
                <div className="flex items-center p-2 gap-3">
                    {/* Manual Move Controls (Visible on Hover or always?) Let's make them always visible but subtle */}
                    <div className="flex flex-col -gap-1 mr-1">
                         <button 
                            disabled={isFirst || isMoving}
                            onClick={() => handleMove('UP')}
                            className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                            title="Move Up"
                         >
                            <ChevronUp size={14} />
                         </button>
                         <button 
                            disabled={isLast || isMoving}
                            onClick={() => handleMove('DOWN')}
                            className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                            title="Move Down"
                         >
                            <ChevronDown size={14} />
                         </button>
                    </div>

                    {/* Left Grip (Drag Handle) */}
                    <button 
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none z-10"
                        {...attributes} 
                        {...listeners}
                    >
                        <GripVertical size={20} />
                    </button>

                    {/* Content Summary */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                        {isPopup ? <List size={16} className="text-yellow-600 flex-shrink-0" /> : <FileText size={16} className="text-slate-400 flex-shrink-0" />}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-800 truncate">{module.title}</span>
                                
                                <button 
                                    onClick={() => setIsStatusPopupOpen(true)}
                                    className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase hover:opacity-80 transition-opacity", statusColor)}
                                >
                                    {currentStatusLabel}
                                </button>

                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded flex-shrink-0">{module.completion}%</span>
                            </div>
                            
                            {/* POPUP: Render as Dropdown Trigger */}
                            {isPopup ? (
                                <div 
                                    onClick={() => setIsSelectionPopupOpen(true)}
                                    className="cursor-pointer border border-yellow-300 bg-white rounded px-2 py-1 flex items-center justify-between text-xs text-slate-700 hover:border-yellow-400 transition-colors w-full max-w-sm h-auto"
                                >
                                    <span className="whitespace-normal break-words pr-2">
                                        {module.officialText || "Select options..."}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                                </div>
                            ) : (
                                module.subtitle && <p className="text-xs text-slate-400 truncate">{module.subtitle}</p>
                            )}
                        </div>
                    </div>


                {/* Status & Actions */}
                <div className="flex items-center gap-3 ml-2">
                     {!isPopup && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 hidden sm:flex" title="Contributions">
                            <Layers size={14} /> {contributionsCount}
                        </div>
                     )}

                     {/* Right Collapse Toggle */}
                     <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                     >
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                     </button>
                </div>
            </div>

            {/* Expanded Detail */}
            {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-50 bg-slate-50/30">
                     <div className="mt-3 flex justify-between items-end">
                         <div className="space-y-2">
                             {/* Additional Details could go here */}
                             {!isPopup && (
                                 <div className="text-xs text-slate-500">
                                     <strong>Max Chars:</strong> {module.maxChars}
                                 </div>
                             )}
                             {isPopup && (
                                <div className="text-xs text-slate-500">
                                     <strong>Max Selections:</strong> {module.maxSelections || 1}
                                 </div>
                             )}
                             <div className="text-xs text-slate-500">
                                 <strong>Guidelines:</strong> <span className="italic">{module.guidelines ? "Yes" : "No"}</span>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <EditModuleButton module={module} />
                             
                             {!isPopup && (
                                 <Link href={`/dashboard/projects/${projectId}/modules/${module.id}`}>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs bg-white border border-slate-200">
                                        Open Editor
                                    </Button>
                                 </Link>
                             )}

                             {/* Delete Button with Double Confirm */}
                             <DeleteButton 
                                id={module.id}
                                onDelete={deleteModule.bind(null, projectId)}
                                className="h-8"
                                requireConfirmationString="DELETE"
                                confirmMessage="This will permanently delete this module and all contributions."
                             />
                         </div>
                     </div>
                </div>
            )}
        </div>

        <SelectionPopup 
            isOpen={isStatusPopupOpen}
            onClose={() => setIsStatusPopupOpen(false)}
            title="Change Module Status"
            options={statusOptions}
            selectedValues={[module.status]}
            onConfirm={handleStatusChange}
            multiSelect={false}
        />

        {module.type === 'POPUP' && module.options && (
            <SelectionPopup 
                isOpen={isSelectionPopupOpen}
                onClose={() => setIsSelectionPopupOpen(false)}
                title={module.title}
                options={(() => {
                    try { return JSON.parse(module.options); } catch { return []; }
                })()}
                // Mocking current selection from officialText for now
                selectedValues={module.officialText ? module.officialText.split(/[,;]\s*/) : []}
                onConfirm={async (selected) => {
                    const text = selected.join('; ');
                    await updateOfficialText(module.id, text);
                    router.refresh(); 
                    setIsSelectionPopupOpen(false);
                }}
                multiSelect={(module.maxSelections || 1) > 1}
                maxSelections={module.maxSelections || undefined}
            />
        )}
        </>
    );
}
