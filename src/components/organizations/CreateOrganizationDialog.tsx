"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateOrganizationDialogProps {
    projectId: string;
    prefilledType: string;
    onCreated: (org: any) => void;
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateOrganizationDialog({ projectId, prefilledType, onCreated, trigger, isOpen: controlledOpen, onOpenChange }: CreateOrganizationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val);
        if (!isControlled) setInternalOpen(val);
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        if (prefilledType !== "University") {
            formData.append("scopeProjectId", projectId);
        }
        formData.set("type", prefilledType);

        const res = await createOrganization(formData);
        
        if (res.error) {
            toast.error(res.error);
        } else if (res.organization) {
            toast.success("Organization created!");
            onCreated(res.organization);
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <>
            {!isControlled && (
                <div onClick={() => setOpen(true)} className="inline-block w-full">
                    {trigger || (
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                            <Plus size={14} className="mr-2" /> 
                            Create new "{prefilledType}"
                        </Button>
                    )}
                </div>
            )}
            
            <Modal isOpen={open} onClose={() => setOpen(false)} title={`Add New ${prefilledType}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Organization Name *</label>
                        <Input name="name" required placeholder="e.g. My Organization" />
                    </div>
                    
                    <div className="space-y-1">
                         <label className="text-sm font-medium">Type</label>
                         <Input value={prefilledType} disabled className="bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Nation</label>
                            <Input name="nation" placeholder="e.g. Italy" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">City</label>
                            <Input name="city" placeholder="e.g. Rome" />
                        </div>
                    </div>
                     <div className="space-y-1">
                        <label className="text-sm font-medium">Address</label>
                        <Input name="address" placeholder="Via Roma 1..." />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Website</label>
                            <Input name="website" placeholder="https://" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Email</label>
                            <Input name="email" type="email" placeholder="info@..." />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                         <label className="text-sm font-medium">VAT / OID</label>
                         <Input name="oid" placeholder="Optional" />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Organization"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
