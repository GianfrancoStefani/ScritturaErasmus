"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Layers, ChevronDown, ChevronRight, Plus, Type, MessageSquare } from "lucide-react";
import { ModuleItem } from "./ModuleItem";
import { WorkPackageItem } from "./WorkPackageItem";
import { CreateModuleButton } from "@/components/modules/ModuleForm";
import { PartnerManager } from "@/components/common/PartnerManager";
import { addSectionPartner, removeSectionPartner, updateSectionPartnerRole } from "@/app/actions/section-partners";

export function SectionItem({ section, projectId, partners = [], members = [], onMoveModule }: { section: any, projectId: string, partners?: any[], members?: any[], onMoveModule?: (moduleId: string, direction: 'UP' | 'DOWN') => void }) {
    const [isOpen, setIsOpen] = useState(false);

    // If we want the SECTION itself to be sortable, we hook useSortable here.
    // Assuming sections are just static containers for now or also sortable?
    // Request 4 says "allow every element SECTION... to be moved".
    // So YES, Section should be sortable too.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id, data: { type: "SECTION", section } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddPartner = async (sectionId: string, partnerId: string) => {
        return await addSectionPartner({ sectionId, partnerId, role: "BENEFICIARY" });
    };

    const handleRemovePartner = async (sectionId: string, partnerId: string) => {
        return await removeSectionPartner(sectionId, partnerId);
    };

    const handleUpdatePartnerRole = async (sectionId: string, partnerId: string, role: string, responsibleUserId?: string) => {
        return await updateSectionPartnerRole(sectionId, partnerId, role, responsibleUserId);
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                     {/* Drag Handle for Section? Using the title/icon area for now, or add specific handle */}
                     <div 
                        className="p-1 bg-white rounded border border-slate-200 text-indigo-600 cursor-grab active:cursor-grabbing"
                        {...attributes} {...listeners}
                    >
                        <Layers size={16} />
                     </div>
                     <div className="flex items-center gap-2">
                        <span 
                            onClick={() => setIsOpen(!isOpen)} 
                            className="font-bold text-lg text-slate-800 hover:text-indigo-700 cursor-pointer select-none"
                        >
                            {section.title}
                        </span>
                        <PartnerManager 
                                entityId={section.id}
                                initialPartners={section.partners || []}
                                availablePartners={partners}
                                availableUsers={members}
                                onAdd={handleAddPartner}
                                onRemove={handleRemovePartner}
                                onUpdateRole={handleUpdatePartnerRole}
                        />
                     </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <CreateModuleButton 
                        parentId={section.id} 
                        parentType="SECTION" 
                        initialType="TEXT" 
                        label="Add Text" 
                        icon={Type}
                        minimal 
                        className="text-slate-500 hover:text-indigo-600 border border-transparent hover:border-indigo-100 hover:bg-indigo-50" 
                    />
                    <CreateModuleButton 
                        parentId={section.id} 
                        parentType="SECTION" 
                        initialType="POPUP" 
                        label="Add Popup" 
                        icon={MessageSquare}
                        minimal 
                        className="text-slate-500 hover:text-indigo-600 border border-transparent hover:border-indigo-100 hover:bg-indigo-50" 
                    />
                    <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-600 p-1">
                        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>

            {/* Content (Modules & Works) */}
            {isOpen && (
                <div className="p-4 bg-slate-50/30 min-h-[50px]">
                    {/* Render Works within Section */}
                    {section.works && section.works.length > 0 && (
                        <div className="mb-4 space-y-4 border-b border-slate-200 pb-4">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Packages</div>
                             <SortableContext 
                                items={section.works.map((w: any) => w.id)} 
                                strategy={verticalListSortingStrategy}
                             >
                                {section.works.map((work: any) => (
                                    <WorkPackageItem 
                                        key={work.id} 
                                        work={work} 
                                        projectId={projectId} 
                                        partners={partners} // Global partners for lookup
                                        inheritedPartners={section.partners || []} // Cascading from Section
                                        onMoveModule={onMoveModule}
                                    />
                                ))}
                             </SortableContext>
                        </div>
                    )}

                    <div className="h-4"></div>
                    <SortableContext 
                        id={section.id} // Important for cross-container
                        items={section.modules.map((m: any) => m.id)} 
                        strategy={verticalListSortingStrategy}
                    >
                        {section.modules.length === 0 && (!section.works || section.works.length === 0) ? (
                            <div className="text-center py-4 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                Empty (Drop items here)
                            </div>
                        ) : (
                            section.modules.map((m: any, index: number) => (
                                <ModuleItem 
                                    key={m.id} 
                                    module={m} 
                                    projectId={projectId} 
                                    isFirst={index === 0}
                                    isLast={index === section.modules.length - 1}
                                    onMove={onMoveModule}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}
