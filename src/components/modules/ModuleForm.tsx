"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createModule, updateModuleMetadata, type ModuleActionState } from "@/app/actions/modules";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";
import { Plus, Edit, List, Type } from "lucide-react";

function TypeDependentFields({ initialType, initialOptions, fieldErrors }: { initialType: string, initialOptions?: string, fieldErrors?: any }) {
    const [type, setType] = useState(initialType);
    
    // Manage simple CSV input for options for now
    const [optionsStr, setOptionsStr] = useState("");

    // Initialize optionsStr from JSON if possible
    useEffect(() => {
        if (initialOptions) {
            try {
                const parsed = JSON.parse(initialOptions);
                if (Array.isArray(parsed)) {
                    setOptionsStr(parsed.map(o => o.value || o).join(", "));
                }
            } catch (e) {
                setOptionsStr(initialOptions);
            }
        }
    }, [initialOptions]);

    return (
        <>
             {/* Hidden input to sync state with form submission if we wanted controlled inputs, 
                 but we are using native selects mostly. 
                 Actually, the select above is uncontrolled. We need to sync.
                 Let's intercept the select above? Or simpler: Just render the toggle here.
             */}
             <div className="hidden">
                 {/* Re-render select here controlled? No, let's keep it simple. */}
             </div>

             {/* We need to hook into the parent select. 
                 Refactoring parent slightly to be controlled would be better.
                 But let's just stick a script or use a controlled component in parent.
             */}
        </>
    )
}
// Wait, better to inline the logic in ModuleForm


const initialState: ModuleActionState = { error: null, fieldErrors: null, success: false };

export function CreateModuleButton({ 
    parentId, 
    parentType, 
    className, 
    initialType = "TEXT",
    label
}: { 
    parentId: string, 
    parentType: 'PROJECT' | 'WORK' | 'TASK' | 'ACTIVITY' | 'SECTION', 
    className?: string, 
    initialType?: 'TEXT' | 'POPUP',
    label?: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <>
            <Button size="sm" onClick={() => setIsOpen(true)} className={className}>
                <Plus size={16} className="mr-1" aria-hidden="true" /> {label || "Add Module"}
            </Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Create New ${initialType === 'POPUP' ? 'Popup' : 'Text'} Module`}>
                <ModuleForm parentId={parentId} parentType={parentType} onClose={() => setIsOpen(false)} initialType={initialType} />
            </Modal>
        </>
    );
}

export function EditModuleButton({ module, className }: { module: any, className?: string }) {
     const [isOpen, setIsOpen] = useState(false);

     return (
        <>
            <button onClick={() => setIsOpen(true)} className={`text-slate-400 hover:text-indigo-600 transition-colors ${className}`} title="Edit Module">
                 <Edit size={16} />
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Module Metadata">
                <ModuleForm module={module} onClose={() => setIsOpen(false)} isEdit />
            </Modal>
        </>
     )
}

function ModuleForm({ parentId, parentType, module, onClose, isEdit = false, initialType = "TEXT" }: { 
    parentId?: string, 
    parentType?: string, 
    module?: any, 
    onClose: () => void,
    isEdit?: boolean,
    initialType?: string
}) {
    const action = isEdit ? updateModuleMetadata : createModule;
    const [state, formAction] = useFormState(action, initialState);
    
    // Controlled state for Type
    const [type, setType] = useState(module?.type || initialType);
    const [optionsJson, setOptionsJson] = useState(module?.options || "[]");

    useEffect(() => {
        if (state?.success) {
            onClose();
        }
    }, [state, onClose]);

    // Handle Options CSV -> JSON
    const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v !== "");
        const optionsObj = values.map(v => ({ label: v, value: v }));
        setOptionsJson(JSON.stringify(optionsObj));
    };

    const initialOptionsCsv = module?.options ? (() => {
        try {
            const parsed = JSON.parse(module.options);
            if (Array.isArray(parsed)) {
                return parsed.map((o: any) => o.value || o).join(", ");
            }
            return "";
        } catch {
            return "";
        }
    })() : "";

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>
            )}

            {isEdit && <input type="hidden" name="id" value={module.id} />}
            {!isEdit && (
                <>
                    <input type="hidden" name="parentId" value={parentId} />
                    <input type="hidden" name="parentType" value={parentType} />
                </>
            )}

            <Input 
                name="title" 
                label="Module Title" 
                required 
                defaultValue={module?.title}
                error={state?.fieldErrors?.title?.[0]}
            />

            <Input 
                name="subtitle" 
                label="Subtitle" 
                defaultValue={module?.subtitle}
                error={state?.fieldErrors?.subtitle?.[0]}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Module Type</label>
                    <select 
                        name="type" 
                        aria-label="Module Type"
                        className="w-full border rounded p-2" 
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="TEXT">Regular Text</option>
                        <option value="POPUP">Selection Popup</option>
                    </select>
                </div>
                 <Input 
                    name="maxChars" 
                    label="Max Characters (Optional)" 
                    type="number"
                    defaultValue={module?.maxChars}
                    error={state?.fieldErrors?.maxChars?.[0]}
                    placeholder="e.g. 5000"
                />
            </div>

            {type === 'POPUP' && (
                <div className="space-y-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-yellow-900">Popup Options (Comma separated)</label>
                        <textarea 
                            className="w-full border rounded p-2 text-sm"
                            defaultValue={initialOptionsCsv}
                            onChange={handleOptionsChange}
                            placeholder="Option A, Option B, Option C..."
                            rows={3}
                        />
                        <input type="hidden" name="options" value={optionsJson} />
                        <p className="text-xs text-yellow-700">Enter values separated by commas.</p>
                    </div>
                    
                    <div className="space-y-1">
                        <Input 
                            name="maxSelections" 
                            label="Setup (Max selections to choice)" 
                            type="number"
                            min={1}
                            defaultValue={module?.maxSelections || 1}
                            placeholder="1"
                            className="bg-white"
                        />
                         <p className="text-xs text-yellow-700">How many options can the user select?</p>
                    </div>
                </div>
            )}
            
            <div className="space-y-1">
                 <Input 
                    name="completion" 
                    label="Start completion % (Setup)" 
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={module?.completion || 0}
                    placeholder="0"
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">Guidelines (Funding body Instructions)</label>
                <textarea 
                    name="guidelines"
                    className="w-full border rounded p-2 h-24 text-sm"
                    defaultValue={module?.guidelines}
                    placeholder="Enter instructions for successful completion..."
                />
                 {state?.fieldErrors?.guidelines?.[0] && <div className="text-red-500 text-xs">{state.fieldErrors.guidelines[0]}</div>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <SubmitButton label={isEdit ? "Save Changes" : "Create Module"} />
            </div>
        </form>
    );
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? "Saving..." : label}</Button>;
}
