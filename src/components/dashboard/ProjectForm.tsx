"use client";

import { createProjectAction } from "@/app/actions/createProject";
import { updateProjectMetadata } from "@/app/actions/updateProject";
import { getTemplatePartners } from "@/app/actions/templates";
import { searchOrganizations } from "@/app/actions/organizations"; 
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFormState, useFormStatus } from "react-dom";
import { format } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Plus, Trash2, Filter, Building2 } from "lucide-react";
import { CreateOrganizationModal } from "@/components/organizations/CreateOrganizationModal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// Form State Type
export type ProjectFormState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

interface ProjectFormProps {
    project?: any; // For Edit Mode
    templateId?: string; // For Create from Template
    onClose?: () => void; // For Modal usage
    isEdit?: boolean;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? "Saving..." : (isEdit ? "Save Changes" : "Create Project")}</Button>;
}

export function ProjectForm({ project, templateId, onClose, isEdit = false }: ProjectFormProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [templatePartners, setTemplatePartners] = useState<any[]>([]);
    
    const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
    const [partnerMapping, setPartnerMapping] = useState<Record<string, string>>({}); // TemplatePartnerID -> RealOrgID
    
    // Extra Partners State
    const [extraPartners, setExtraPartners] = useState<string[]>([]); // Array of RealOrgIDs
    
    const [loadingData, setLoadingData] = useState(false);
    
    // Filter State
    const [orgTypeFilter, setOrgTypeFilter] = useState<string>("ALL");
    
    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch Data on Init if Template
    useEffect(() => {
        if (templateId && !isEdit) {
            setLoadingData(true);
            Promise.all([
                getTemplatePartners(templateId),
                searchOrganizations("", 1, 100) // Fetch top 100 orgs for now
            ]).then(([tpRes, orgRes]) => {
                if (tpRes.success) setTemplatePartners(tpRes.data || []);
                if (orgRes.data) setAvailableOrgs(orgRes.data);
                setLoadingData(false);
            });
        }
    }, [templateId, isEdit]);

    const handleNext = () => {
        // Validate Step 1 (Simple check)
        const form = document.querySelector('form') as HTMLFormElement;
        if (form.reportValidity()) {
            setStep(2);
        }
    };

    const [state, formAction] = useFormState<ProjectFormState, FormData>(async (prevState, formData) => {
        if (isEdit && project) {
            return await updateProjectMetadata(project.id, formData);
        } else {
             // Append Mapping and Extras
             if (templateId) {
                formData.set("partnerMapping", JSON.stringify(partnerMapping));
                formData.set("extraPartners", JSON.stringify(extraPartners));
             }
             const result = await createProjectAction(formData);
             return result || { success: true };
        }
    }, null);

    useEffect(() => {
        if (state?.success && isEdit) {
            if (onClose) onClose();
            router.refresh();
        }
    }, [state, isEdit, onClose, router]);

    // Handle New Organization Creation
    const handleOrgCreated = (newOrg: any) => {
        setAvailableOrgs(prev => [...prev.filter(o => o.id !== newOrg.id), newOrg]);
        // Optionally auto-select or just leave it in the list
    };

    // Filter Logic
    const filteredOrgs = useMemo(() => {
        if (orgTypeFilter === "ALL") return availableOrgs;
        return availableOrgs.filter(o => o.type === orgTypeFilter);
    }, [availableOrgs, orgTypeFilter]);

    return (
        <>
            <form action={formAction} className="space-y-4 relative">
                {templateId && <input type="hidden" name="templateId" value={templateId} />}
                
                {state?.error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                        {state.error}
                    </div>
                )}

                <div className={step === 1 ? "space-y-4" : "hidden"}>
                        <Input 
                            name="title" 
                            label="Project Title" 
                            placeholder="e.g. Digital Education for All" 
                            required 
                            defaultValue={project?.title} 
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                name="acronym" 
                                label="Acronym" 
                                placeholder="DIGI-EDU" 
                                required 
                                defaultValue={project?.acronym} 
                            />
                            <Input 
                                name="nationalAgency" 
                                label="National Agency" 
                                placeholder="IT02" 
                                required 
                                defaultValue={project?.nationalAgency} 
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                name="startDate" 
                                type="date" 
                                label="Start Date" 
                                required 
                                defaultValue={project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : ''} 
                            />
                            <Input 
                                name="duration" 
                                type="number" 
                                label="Duration (Months)" 
                                placeholder="24" 
                                min="12" 
                                max="36" 
                                required 
                                defaultValue={project?.duration} 
                            />
                        </div>
                        
                        <Input 
                            name="language" 
                            label="Submission Language" 
                            placeholder="English" 
                            defaultValue={project?.language || "English"} 
                        />
                </div>

                {step === 2 && templateId && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                             <h3 className="font-semibold text-slate-800">Map Project Partners</h3>
                             <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-1" /> New Org
                             </Button>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                className="text-xs p-1 border rounded bg-white"
                                value={orgTypeFilter}
                                aria-label="Filter organizations by type"
                                onChange={(e) => setOrgTypeFilter(e.target.value)}
                            >
                                <option value="ALL">All Types</option>
                                <option value="University">Universities</option>
                                <option value="NGO">NGOs</option>
                                <option value="SME">SMEs</option>
                                <option value="School">Schools</option>
                                <option value="Public Body">Public Bodies</option>
                            </select>
                            <span className="text-xs text-slate-400 ml-auto">{filteredOrgs.length} available</span>
                        </div>

                        <div className="space-y-3 pr-1">
                            {/* Template Partners Mapping */}
                            {templatePartners.map((tp, idx) => {
                                const selectedOrgId = partnerMapping[tp.id];
                                return (
                                    <div key={tp.id} className="p-3 border rounded bg-slate-50 relative">
                                        <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                                            <span>{tp.role === 'COORDINATOR' ? "Coordinator (Applicant)" : tp.name} <span className="text-slate-400 font-normal">({tp.type})</span></span>
                                            {selectedOrgId && <span className="text-green-600">Mapped</span>}
                                        </label>
                                        <SearchableSelect
                                            placeholder="Search organization..."
                                            options={filteredOrgs.map((o: any) => ({ 
                                                value: o.id, 
                                                label: o.name, 
                                                subLabel: `${o.nation} - ${o.type}` 
                                            }))}
                                            value={selectedOrgId || ""}
                                            onChange={(val) => setPartnerMapping(prev => ({ ...prev, [tp.id]: val }))}
                                            onSearch={async (q) => {
// ... (lines 227-235 remain same) but I'm replacing the chunk
                                                // Simple search trigger
                                                const res = await searchOrganizations(q, 1, 50);
                                                if(res.data) {
                                                    setAvailableOrgs(prev => {
                                                        const existingIds = new Set(prev.map((o: any) => o.id));
                                                        const newOrgs = res.data.filter((o: any) => !existingIds.has(o.id));
                                                        return [...prev, ...newOrgs];
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                );
                            })}
                            
                            {/* Extra Partners Section */}
                            <div className="pt-2 border-t mt-4 relative z-10">
                                 <h4 className="text-sm font-semibold text-slate-700 mb-2">Additional Partners</h4>
                                 {extraPartners.map((epId, idx) => {
                                     const org = availableOrgs.find(o => o.id === epId);
                                     return (
                                         <div key={idx} className="flex gap-2 items-center mb-2">
                                             <div className="flex-1 p-2 bg-white border rounded text-sm flex items-center gap-2">
                                                 <Building2 className="w-4 h-4 text-slate-400"/>
                                                 {org?.name || "Unknown Org"}
                                             </div>
                                             <Button type="button" size="icon" variant="danger" onClick={() => setExtraPartners(prev => prev.filter((_, i) => i !== idx))}>
                                                 <Trash2 className="w-4 h-4" />
                                             </Button>
                                         </div>
                                     )
                                 })}
                                 
                                 <div className="flex gap-2">
                                     <div className="flex-1">
                                        <SearchableSelect
                                            placeholder="+ Add Extra Partner..."
                                            options={filteredOrgs
                                                .filter((o: any) => !extraPartners.includes(o.id) && !Object.values(partnerMapping).includes(o.id))
                                                .map((o: any) => ({ 
                                                    value: o.id, 
                                                    label: o.name, 
                                                    subLabel: `${o.nation} - ${o.type}` 
                                                }))}
                                            value=""
                                            onChange={(val) => {
                                                if(val) setExtraPartners(prev => [...prev, val]);
                                            }}
                                            onSearch={async (q) => {
                                                 const res = await searchOrganizations(q, 1, 50);
                                                 if(res.data) {
                                                     setAvailableOrgs(prev => {
                                                         const existingIds = new Set(prev.map((o: any) => o.id));
                                                         const newOrgs = res.data.filter((o: any) => !existingIds.has(o.id));
                                                         return [...prev, ...newOrgs];
                                                     });
                                                 }
                                            }}
                                        />
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`pt-4 border-t border-slate-100 flex ${onClose ? 'justify-between' : 'justify-end'} gap-3`}>
                   {step === 2 && (
                        <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={16} className="mr-1"/> Back</Button>
                   )}
                   
                   {onClose && step === 1 && (
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    )}

                    {templateId && !isEdit && step === 1 ? (
                        <Button type="button" onClick={handleNext}>Next <ArrowRight size={16} className="ml-1" /></Button>
                    ) : (
                        <SubmitButton isEdit={isEdit} />
                    )}
                </div>
            </form>

            {/* Create Org Modal */}
            {showCreateModal && (
                <CreateOrganizationModal 
                    onClose={() => setShowCreateModal(false)} 
                    onCreated={handleOrgCreated} 
                />
            )}
        </>
    );
}

