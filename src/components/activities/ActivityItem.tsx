"use client";

import { ActivityForm } from "./ActivityForm";
import { format } from "date-fns";
import { MapPin, Calendar, Building, Euro, Target } from "lucide-react";
import { CreateModuleButton } from "@/components/modules/ModuleForm";
import { ModuleItem } from "@/components/project/ModuleItem";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteActivity } from "@/app/actions/activities";

interface ActivityItemProps {
    activity: any;
    projectId: string;
    partners: any[]; // needed for Form
    onMoveModule?: (moduleId: string, direction: 'UP' | 'DOWN') => void;
}

export function ActivityItem({ activity, projectId, partners, onMoveModule }: ActivityItemProps) {
    
    // Find partner names
    const leadingOrg = partners.find(p => p.id === activity.leadingOrgId)?.name || "N/A";
    const participatingOrgs = activity.participatingOrgIds.map((id: string) => partners.find(p => p.id === id)?.name).filter(Boolean).join(", ");

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative group/activity">
            {/* Header / Actions */}
            <div className="flex justify-between items-start mb-3">
                <div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activity</span>
                     <h4 className="text-md font-bold text-slate-800">{activity.title}</h4>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/activity:opacity-100 transition-opacity">
                    <ActivityForm 
                        projectId={projectId} 
                        partners={partners} 
                        activity={activity} 
                        className="h-7 w-7 p-0"
                    />
                    <DeleteButton
                        id={activity.id}
                        onDelete={deleteActivity.bind(null, projectId)} 
                        className="text-red-500 h-7 w-7 p-0"
                        confirmMessage="Delete this activity?"
                    />
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 mb-4">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>
                        {format(new Date(activity.estimatedStartDate), 'MMM yyyy')} - {format(new Date(activity.estimatedEndDate), 'MMM yyyy')}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-400" />
                    <span>{activity.venue || "No venue"}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Building size={14} className="text-indigo-400" />
                    <span title="Leading Org">
                        <strong>Leading:</strong> {leadingOrg}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Building size={14} className="text-slate-400" />
                     <span title="Participating Orgs" className="truncate">
                        <strong>Partners:</strong> {participatingOrgs || "None"}
                    </span>
                 </div>
                  <div className="flex items-center gap-2">
                    <Euro size={14} className="text-green-500" />
                    <span>€{activity.allocatedAmount?.toLocaleString()}</span>
                 </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Target size={14} className="text-rose-500" />
                    <span className="italic">{activity.expectedResults || "No expected results defined"}</span>
                 </div>
            </div>

            {/* Modules Container (Activities can have modules too!) */}
            <div className="border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-semibold text-slate-400">Modules</span>
                     <CreateModuleButton parentId={activity.id} parentType="ACTIVITY" className="h-5 text-[10px] px-2 py-0" label="Add Module" />
                </div>
                
                 <SortableContext 
                    id={`activity-modules-${activity.id}`} 
                    items={activity.modules.map((m: any) => m.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {activity.modules.map((m: any, index: number) => (
                            <ModuleItem 
                                key={m.id} 
                                module={m} 
                                projectId={projectId} 
                                isFirst={index === 0}
                                isLast={index === activity.modules.length - 1}
                                onMove={onMoveModule}
                            />
                        ))}
                         {activity.modules.length === 0 && (
                            <div className="text-center py-2 text-[10px] text-slate-400 border border-dashed rounded bg-white">
                                No modules in this activity
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
