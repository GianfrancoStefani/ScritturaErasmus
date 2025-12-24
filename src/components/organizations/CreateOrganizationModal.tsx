"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateOrganizationModalProps {
    onClose: () => void;
    onCreated: (org: any) => void;
}

export function CreateOrganizationModal({ onClose, onCreated }: CreateOrganizationModalProps) {
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const res = await createOrganization(formData);
            if (res.success && res.organization) {
                toast.success("Organization created!");
                onCreated(res.organization);
                onClose();
            } else {
                toast.error(res.error || "Failed to create organization");
            }
        } catch(e) {
            toast.error("Error creating organization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Organization</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="name" label="Name" required placeholder="Organization Name" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="shortName" label="Acronym (Short Name)" placeholder="e.g. UNIBO" />
                        <Input name="nation" label="Nation" required placeholder="e.g. IT" maxLength={2} />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select name="type" className="w-full text-sm p-2 border rounded-md" required aria-label="Organization Type">
                             <option value="NGO">NGO / Association</option>
                             <option value="SME">SME (Small/Medium Enterprise)</option>
                             <option value="School">School</option>
                             <option value="University">University</option>
                             <option value="Public Body">Public Body</option>
                             <option value="Other">Other</option>
                        </select>
                    </div>

                    <Input name="city" label="City" placeholder="City" />
                    
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
