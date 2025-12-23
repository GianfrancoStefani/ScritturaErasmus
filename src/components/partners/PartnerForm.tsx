"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPartner, updatePartner, type PartnerActionState } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { Plus, X, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { OrganizationSelector } from "@/components/organizations/OrganizationSelector";
import { Input } from "@/components/ui/Input";

// Helper types
type PartnerData = {
  id?: string;
  name: string;
  nation: string;
  city: string;
  role: string;
  type: string;
  budget: number;
  website?: string | null;
  email?: string | null;
  logo?: string | null;
  organizationId?: string | null;
  acronym?: string; 
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : isEditing ? "Update Partner" : "Save Partner"}</Button>;
}

export function PartnerForm({ projectId, initialData, onClose }: { projectId: string; initialData?: PartnerData; onClose: () => void }) {
    const isEditing = !!initialData;
    const [role, setRole] = useState(initialData?.role || "Partner");
    const [type, setType] = useState(initialData?.type || "University");
    
    // If editing, we might have an org linked or just raw data.
    // For now, we populate fields with initialData.
    // If user changes Organization, we overwrite these.
    const [selectedOrg, setSelectedOrg] = useState<any>(initialData ? {
        name: initialData.name,
        nation: initialData.nation,
        city: initialData.city,
        website: initialData.website,
        logoUrl: initialData.logo,
        id: initialData.organizationId
    } : null);

    // If Type changes, and we are NOT in initial load (editing), we might want to reset org?
    // But simplified: user selects Type, then searches Org. If Org type mismatch, Selector shows warning or filter.
    // Selector takes `type` prop, so it filters automatically.
    // So if I change type, the current selectedOrg might be invalid?
    // I'll clear selectedOrg if type changes (unless it matches).
    useEffect(() => {
        if (selectedOrg && selectedOrg.type && selectedOrg.type !== type) {
            // Optional: clear selection if type mismatch. 
            // BUT: "University" global might have different string in DB?
            // Let's Keep it simple: Reset if type changes manually by user.
            // But we need to distinguish initial load.
            // Actually, if I change Type dropdown, I expect to search for THAT type.
            // So resetting is safer.
        }
    }, [type]); 

    const [state, formAction] = useFormState<PartnerActionState, FormData>(async (prevState, formData) => {
        let result: PartnerActionState;
        if (isEditing && initialData?.id) {
             result = await updatePartner(initialData.id, projectId, formData);
        } else {
             result = await createPartner(formData);
        }
        
        if (result?.success) {
            onClose();
            return { message: "Success", success: true, error: null };
        }
        return result; 
    }, { success: false, error: null });

    const handleOrgSelect = (org: any) => {
        setSelectedOrg(org);
        // Also ensure Type is synced if the org has a type (it should)
        if (org.type) {
             setType(org.type);
        }
    };

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            
            {/* Top Row: Role and Type */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <select 
                        name="role" 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full border rounded p-2"
                        aria-label="Role"
                    >
                        <option value="Partner">Partner</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Associated">Associated</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Type</label>
                     <select 
                        name="type" 
                        value={type} 
                        onChange={(e) => { setType(e.target.value); setSelectedOrg(null); }}
                        className="w-full border rounded p-2"
                        aria-label="Type"
                    >
                        <option value="University">University</option>
                        <option value="SME">SME</option>
                        <option value="NGO">NGO</option>
                        <option value="School">School</option>
                        <option value="Public Body">Public Body</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            {/* Organization Selector */}
            <div className="space-y-1">
                <label className="text-sm font-medium">Organization Name</label>
                {/* We render hidden input for name to ensure FormData picks it up if they type manually or select */}
                {/* Actually OrganizationSelector should handle searching. */}
                {/* If selectedOrg is present, we show it locked? Or allow searching logic? */}
                {/* User wants "trovare il nome... menu a tendina". */}
                <OrganizationSelector 
                    type={type} 
                    projectId={projectId} 
                    onSelect={handleOrgSelect} 
                    defaultValue={selectedOrg?.name} 
                />
                <input type="hidden" name="name" value={selectedOrg?.name || ""} />
                <input type="hidden" name="organizationId" value={selectedOrg?.id || ""} />
                {state?.fieldErrors?.name && (
                    <p className="text-red-500 text-xs mt-1">Please select create an organization to populate the name.</p>
                )}
                {state?.fieldErrors?.organizationId && (
                    <p className="text-red-500 text-xs mt-1">{state.fieldErrors.organizationId[0]}</p>
                )}
            </div>

            {/* Read-Only Details from Organization */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Nation (Read-only)</label>
                    <input 
                        name="nation" 
                        value={selectedOrg?.nation || ""} 
                        readOnly 
                        className="w-full border rounded p-2 bg-slate-100 text-slate-600" 
                        tabIndex={-1}
                        aria-label="Nation"
                    />
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">City (Read-only)</label>
                    <input 
                        name="city" 
                        value={selectedOrg?.city || ""} 
                        readOnly 
                        className="w-full border rounded p-2 bg-slate-100 text-slate-600" 
                        tabIndex={-1}
                        aria-label="City"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Website (Read-only)</label>
                    <input 
                        name="website" 
                        value={selectedOrg?.website || ""} 
                        readOnly 
                        className="w-full border rounded p-2 bg-slate-100 text-slate-600" 
                        tabIndex={-1}
                        aria-label="Website"
                    />
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Email (Editable)</label>
                    <input 
                        name="email" 
                        type="email" 
                        defaultValue={initialData?.email || ""} 
                        placeholder="contact@example.com" 
                        className="w-full border rounded p-2" 
                        aria-label="Contact Email"
                    />
                </div>
            </div>
             
            <div className="space-y-1">
                <label className="text-sm font-medium">Budget (€)</label>
                <input name="budget" type="number" step="0.01" className="w-full border rounded p-2" defaultValue={initialData?.budget || 0} placeholder="0.00" aria-label="Budget" />
                {state?.fieldErrors?.budget && <p className="text-red-500 text-xs">{state.fieldErrors.budget[0]}</p>}
            </div>

            <div className="space-y-1 hidden">
                 <input name="logo" type="url" value={selectedOrg?.logoUrl || ""} readOnly aria-label="Logo URL" />
            </div>

            <div className="text-red-500 text-sm">
                {state?.error && <div>{state.error}</div>}
            </div>

            <div className="flex justify-end pt-2">
                <SubmitButton isEditing={isEditing} />
            </div>
        </form>
    );
}

export function CreatePartnerButton({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus size={16} className="mr-2" /> Add Partner
            </Button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Add New Partner">
                 <PartnerForm projectId={projectId} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}

export function EditPartnerButton({ projectId, partner }: { projectId: string, partner: PartnerData }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                className="text-slate-400 hover:text-indigo-600 p-1"
                title="Edit Partner"
            >
                <Edit2 size={16} />
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit Partner">
                 <PartnerForm projectId={projectId} initialData={partner} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}
