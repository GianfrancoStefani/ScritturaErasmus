"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Plus, Edit } from "lucide-react";
import { createActivity, updateActivity } from "@/app/actions/activities";

interface ActivityFormProps {
    parentId?: string; // If creating, the Task ID
    projectId: string; // For revalidation
    activity?: any; // If editing, the existing activity
    partners: any[]; // For dropdowns
    className?: string;
}

export function ActivityForm({ parentId, projectId, activity, partners, className }: ActivityFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEditing = !!activity;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            if (isEditing) {
                await updateActivity(activity.id, projectId, formData);
            } else if (parentId) {
                await createActivity(parentId, projectId, formData);
            }
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Default dates
    const today = new Date().toISOString().split('T')[0];

    return (
        <>
            {isEditing ? (
                <Button variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
                    <Edit size={14} />
                </Button>
            ) : (
                <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
                    <Plus size={14} className="mr-1" /> Add Activity
                </Button>
            )}

            <Modal isOpen={open} onClose={() => setOpen(false)} title={isEditing ? "Edit Activity" : "Create Activity"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        id="title" 
                        name="title" 
                        label="Activity Title"
                        required 
                        defaultValue={activity?.title} 
                        placeholder="e.g. Workshop preparation" 
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            id="startDate" 
                            name="estimatedStartDate" 
                            label="Start Date (Est.)"
                            type="date" 
                            required 
                            defaultValue={activity?.estimatedStartDate ? new Date(activity.estimatedStartDate).toISOString().split('T')[0] : today} 
                        />
                        <Input 
                            id="endDate" 
                            name="estimatedEndDate" 
                            label="End Date (Est.)"
                            type="date" 
                            required 
                            defaultValue={activity?.estimatedEndDate ? new Date(activity.estimatedEndDate).toISOString().split('T')[0] : today} 
                        />
                    </div>

                     <Input 
                        id="venue" 
                        name="venue" 
                        label="Venue"
                        defaultValue={activity?.venue} 
                        placeholder="e.g. Rome, Italy" 
                    />

                    <div className="input-group">
                        <label htmlFor="leadingOrg" className="input-label">Leading Organisation</label>
                        <select 
                            id="leadingOrg" 
                            name="leadingOrgId" 
                            className="input-field"
                            defaultValue={activity?.leadingOrgId || ""}
                        >
                            <option value="">Select an organisation...</option>
                            {partners.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="participatingOrgs" className="input-label">Participating Organisations</label>
                        <select 
                            id="participatingOrgs" 
                            name="participatingOrgIds" 
                            multiple
                            className="input-field min-h-[100px]"
                            defaultValue={activity?.participatingOrgIds || []}
                        >
                            {partners.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">Hold command/ctrl to select multiple</p>
                    </div>

                    <Input 
                        id="amount" 
                        name="allocatedAmount" 
                        label="Allocated Amount (EUR)"
                        type="number" 
                        min="0" 
                        step="0.01" 
                        required 
                        defaultValue={activity?.allocatedAmount || 0} 
                    />

                    <Textarea 
                        id="results" 
                        name="expectedResults" 
                        label="Expected Results"
                        maxLength={250}
                        defaultValue={activity?.expectedResults || ""}
                        placeholder="Describe expected results (max 250 chars)" 
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (isEditing ? "Save Changes" : "Create Activity")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

export function CreateActivityButton(props: Omit<ActivityFormProps, 'activity'>) {
    return <ActivityForm {...props} />;
}
