"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUser } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Plus, X } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : "Save User"}</Button>;
}

export function UserForm({ partnerId, onClose }: { partnerId: string; onClose: () => void }) {
    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
         const result = await createUser(formData);
         if (result?.success) {
             onClose();
             return { message: "Success" };
         }
         return result;
    }, null);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-4">Add New User</h2>

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="partnerId" value={partnerId} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Name</label>
                            <input name="name" className="w-full border rounded p-2" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Surname</label>
                            <input name="surname" className="w-full border rounded p-2" required />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Email</label>
                        <input name="email" type="email" className="w-full border rounded p-2" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-sm font-medium">Role</label>
                            <select name="role" className="w-full border rounded p-2">
                                <option value="Project Manager">Project Manager</option>
                                <option value="Researcher">Researcher</option>
                                <option value="Financial Officer">Financial Officer</option>
                                <option value="Technician">Technician</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Username</label>
                            <input name="username" className="w-full border rounded p-2" required />
                        </div>
                    </div>
                     <div className="space-y-1">
                        <label className="text-sm font-medium">Password</label>
                        <input name="password" type="password" className="w-full border rounded p-2" required minLength={6} />
                    </div>

                    <div className="text-red-500 text-sm">
                        {state?.error && (typeof state.error === 'string' ? state.error : "Validation error")}
                    </div>

                    <div className="flex justify-end pt-2">
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

export function CreateUserButton({ partnerId }: { partnerId: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="text-xs">
                <Plus size={14} className="mr-1" /> Add User
            </Button>
            {open && (
                <div onClick={(e) => e.stopPropagation()}>
                    <UserForm partnerId={partnerId} onClose={() => setOpen(false)} />
                </div>
            )}
        </>
    );
}
