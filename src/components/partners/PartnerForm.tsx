"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPartner } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button"; // Check path
import { useState } from "react";
import { Plus, X } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : "Save Partner"}</Button>;
}

export function PartnerForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    // We'll wrap the server action to close modal on success
    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
        const result = await createPartner(formData);
        if (result?.success) {
            onClose();
            return { message: "Success" };
        }
        return result; // return error
    }, null);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-4">Add New Partner</h2>

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="projectId" value={projectId} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Name</label>
                            <input name="name" className="w-full border rounded p-2" required placeholder="University of X" />
                        </div>
                         <div className="space-y-1">
                            <label className="text-sm font-medium">Acronym (Optional)</label>
                            <input name="acronym" className="w-full border rounded p-2" placeholder="UNIX" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-sm font-medium">Nation</label>
                            <input name="nation" className="w-full border rounded p-2" required placeholder="Italy" />
                        </div>
                         <div className="space-y-1">
                            <label className="text-sm font-medium">City</label>
                            <input name="city" className="w-full border rounded p-2" required placeholder="Rome" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Role</label>
                            <select name="role" className="w-full border rounded p-2">
                                <option value="Partner">Partner</option>
                                <option value="Coordinator">Coordinator</option>
                                <option value="Associated">Associated</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Type</label>
                             <select name="type" className="w-full border rounded p-2">
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
                        <input name="budget" type="number" step="0.01" className="w-full border rounded p-2" defaultValue={0} />
                    </div>

                     <div className="space-y-1">
                            <label className="text-sm font-medium">Contact Email</label>
                            <input name="email" type="email" className="w-full border rounded p-2" />
                    </div>

                    <div className="text-red-500 text-sm">
                        {state?.error && typeof state.error === 'string' && state.error}
                    </div>

                    <div className="flex justify-end pt-2">
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

export function CreatePartnerButton({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus size={16} className="mr-2" /> Add Partner
            </Button>
            {open && <PartnerForm projectId={projectId} onClose={() => setOpen(false)} />}
        </>
    );
}
