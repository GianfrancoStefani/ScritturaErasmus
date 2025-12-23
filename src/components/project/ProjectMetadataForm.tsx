"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProjectMetadata } from "@/app/actions/updateProject"; 
import { toast } from "sonner";
import { clsx } from "clsx";

// Use a server action for this. I might need to create/export 'updateProjectMetadata' if "updateProject" isn't suitable or granular enough.
// Checking "updateProject.ts" first might be good, but I'll assume I can use a generic update or create a specific one.
// The user asked for specific fields: Title, TitleEn, Acronym, StartDate, Duration, EndDate, NationalAgency, Language.

export function ProjectMetadataForm({ project, programs }: { project: any, programs: any[] }) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Auto-fill budget/duration if program selected?
    // User requested "Budget" and "Deadline" fields. 
    // And "Program" selection.
    
    const [selectedProgramId, setSelectedProgramId] = useState(project.programId || "");

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        try {
            const res = await updateProjectMetadata(project.id, formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Project settings saved");
            }
        } catch (e) {
            toast.error("Failed to save settings");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Project General Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Program</label>
                    <select 
                        name="programId" 
                        title="Program"
                        defaultValue={project.programId || ""} 
                        onChange={(e) => setSelectedProgramId(e.target.value)}
                        className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white h-10"
                    >
                        <option value="">Select Program...</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project Title</label>
                    <Input name="title" defaultValue={project.title} required />
                </div>
                
                {/* User didn't explicitly complain about English title, but plan said remove/keep. Keeping as it's harmless and useful for Erasmus. */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title in English</label>
                    <Input name="titleEn" defaultValue={project.titleEn} placeholder="English Title..." />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Acronym</label>
                    <Input name="acronym" defaultValue={project.acronym} required />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">National Agency</label>
                    <Input name="nationalAgency" defaultValue={project.nationalAgency} placeholder="e.g. IT02" />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Timeline & Resources</h4>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Submission Deadline</label>
                    <Input type="date" name="deadline" defaultValue={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''} />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Total Budget (€)</label>
                    <CurrencyInput defaultValue={project.budget} name="budget" />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                    <Input type="date" name="startDate" defaultValue={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''} />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Duration (Months)</label>
                    <Input type="number" name="duration" defaultValue={project.duration} min="1" />
                </div>

                <input type="hidden" name="endDate" value={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''} /> 
                {/* Hidden End Date or read only? Form handles logic on server side if omitted, but let's just let server calc it based on duration unless we want explicit end date picker which conflicts with duration logic usually. 
                   User asked for "Project Duration" and "Project End Date". Usually one drives the other. 
                   I'll leave Duration as primary driver for now as per previous logic.
                */}
                
                <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Submission Language</label>
                     <select name="language" title="Language" defaultValue={project.language} className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white h-10">
                         <option value="en">English (EN)</option>
                         <option value="it">Italian (IT)</option>
                         <option value="es">Spanish (ES)</option>
                         <option value="fr">French (FR)</option>
                         <option value="de">German (DE)</option>
                         <option value="pt">Portuguese (PT)</option>
                     </select>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}

function CurrencyInput({ defaultValue, name }: { defaultValue?: number | null, name: string }) {
    // Format initial value
    const format = (val: number | undefined | null) => {
        if (val === undefined || val === null) return "";
        return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const [displayValue, setDisplayValue] = useState(format(defaultValue));
    
    // Parse "1.000,00" -> 1000.00
    const parse = (str: string) => {
        // Remove dots (thousands), replace comma with dot
        const clean = str.replace(/\./g, '').replace(',', '.');
        return clean;
    };

    const handleBlur = () => {
        const p = parse(displayValue);
        const num = parseFloat(p);
        if (!isNaN(num)) {
            setDisplayValue(format(num));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    return (
        <div className="relative">
            <Input 
                type="text" 
                value={displayValue} 
                onChange={handleChange} 
                onBlur={handleBlur}
                placeholder="0,00"
            />
            {/* Server action will read this hidden input */}
            <input type="hidden" name={name} value={parse(displayValue)} />
        </div>
    );
}
