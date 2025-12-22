"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPartner, updatePartner, type PartnerActionState } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Plus, X, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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
  acronym?: string; 
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : isEditing ? "Update Partner" : "Save Partner"}</Button>;
}

export function PartnerForm({ projectId, initialData, onClose }: { projectId: string; initialData?: PartnerData; onClose: () => void }) {
    const isEditing = !!initialData;
    
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

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Name</label>
                    <input name="name" className="w-full border rounded p-2" required placeholder="University of X" defaultValue={initialData?.name} />
                    {state?.fieldErrors?.name && <p className="text-red-500 text-xs">{state.fieldErrors.name[0]}</p>}
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Website</label>
                    <input name="website" className="w-full border rounded p-2" placeholder="https://..." defaultValue={initialData?.website || ""} />
                    {state?.fieldErrors?.website && <p className="text-red-500 text-xs">{state.fieldErrors.website[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Nation</label>
                    <input name="nation" className="w-full border rounded p-2" required placeholder="Italy" defaultValue={initialData?.nation} />
                    {state?.fieldErrors?.nation && <p className="text-red-500 text-xs">{state.fieldErrors.nation[0]}</p>}
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">City</label>
                    <input name="city" className="w-full border rounded p-2" required placeholder="Rome" defaultValue={initialData?.city} />
                    {state?.fieldErrors?.city && <p className="text-red-500 text-xs">{state.fieldErrors.city[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <select name="role" className="w-full border rounded p-2" defaultValue={initialData?.role || "Partner"}>
                        <option value="Partner">Partner</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Associated">Associated</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Type</label>
                     <select name="type" className="w-full border rounded p-2" defaultValue={initialData?.type || "University"}>
                        <option value="University">University</option>
                        <option value="SME">SME</option>
                        <option value="NGO">NGO</option>
                        <option value="School">School</option>
                        <option value="Public Body">Public Body</option>
                    </select>
                </div>
            </div>
             
            <div className="space-y-1">
                <label className="text-sm font-medium">Budget (€)</label>
                <input name="budget" type="number" step="0.01" className="w-full border rounded p-2" defaultValue={initialData?.budget || 0} />
                {state?.fieldErrors?.budget && <p className="text-red-500 text-xs">{state.fieldErrors.budget[0]}</p>}
            </div>

             <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Email</label>
                    <input name="email" type="email" className="w-full border rounded p-2" defaultValue={initialData?.email || ""} />
                    {state?.fieldErrors?.email && <p className="text-red-500 text-xs">{state.fieldErrors.email[0]}</p>}
            </div>
            
             <div className="space-y-1">
                    <label className="text-sm font-medium">Logo URL</label>
                    <input name="logo" type="url" className="w-full border rounded p-2" placeholder="https://..." defaultValue={initialData?.logo || ""} />
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
            >
                <Edit2 size={16} />
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit Partner">
                 <PartnerForm projectId={projectId} initialData={partner} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}
