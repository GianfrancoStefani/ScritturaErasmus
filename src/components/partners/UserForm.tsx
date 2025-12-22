"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUser, updateUser, type PartnerActionState } from "@/app/actions/partners";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Plus, X, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type UserData = {
    id?: string;
    partnerId: string;
    name: string;
    surname: string;
    email: string;
    role: string;
    username: string;
    prefix?: string | null;
    phone?: string | null;
    landline?: string | null;
    photo?: string | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : isEditing ? "Update User" : "Save User"}</Button>;
}

export function UserForm({ partnerId, initialData, onClose }: { partnerId: string; initialData?: UserData; onClose: () => void }) {
    const isEditing = !!initialData;

    const [state, formAction] = useFormState<PartnerActionState, FormData>(async (prevState, formData) => {
         let result: PartnerActionState;
         if (isEditing && initialData?.id) {
             result = await updateUser(initialData.id, partnerId, formData);
         } else {
             result = await createUser(formData);
         }
         
         if (result?.success) {
             onClose();
             return { message: "Success", success: true, error: null };
         }
         return result;
    }, { success: false, error: null });

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="partnerId" value={partnerId} />
            
            <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1 col-span-1">
                    <label className="text-sm font-medium">Prefix</label>
                    <select name="prefix" className="w-full border rounded p-2" defaultValue={initialData?.prefix || "Mr."}>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                    </select>
                </div>
                <div className="space-y-1 col-span-1">
                    <label className="text-sm font-medium">Name</label>
                    <input name="name" className="w-full border rounded p-2" required defaultValue={initialData?.name} />
                    {state?.fieldErrors?.name && <p className="text-red-500 text-xs">{state.fieldErrors.name[0]}</p>}
                </div>
                <div className="space-y-1 col-span-1">
                    <label className="text-sm font-medium">Surname</label>
                    <input name="surname" className="w-full border rounded p-2" required defaultValue={initialData?.surname} />
                    {state?.fieldErrors?.surname && <p className="text-red-500 text-xs">{state.fieldErrors.surname[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <input name="email" type="email" className="w-full border rounded p-2" required defaultValue={initialData?.email} />
                    {state?.fieldErrors?.email && <p className="text-red-500 text-xs">{state.fieldErrors.email[0]}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <select name="role" className="w-full border rounded p-2" defaultValue={initialData?.role || "Researcher"}>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Financial Officer">Financial Officer</option>
                        <option value="Technician">Technician</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Phone (Mobile)</label>
                    <input name="phone" className="w-full border rounded p-2" defaultValue={initialData?.phone || ""} />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Landline</label>
                    <input name="landline" className="w-full border rounded p-2" defaultValue={initialData?.landline || ""} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Username</label>
                    <input name="username" className="w-full border rounded p-2" required defaultValue={initialData?.username} />
                    {state?.fieldErrors?.username && <p className="text-red-500 text-xs">{state.fieldErrors.username[0]}</p>}
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium">Photo URL</label>
                    <input name="photo" className="w-full border rounded p-2" defaultValue={initialData?.photo || ""} />
                </div>
            </div>

             <div className="space-y-1">
                <label className="text-sm font-medium">Password {isEditing && "(Leave blank to keep current)"}</label>
                <input name="password" type="password" className="w-full border rounded p-2" required={!isEditing} minLength={6} />
                {state?.fieldErrors?.password && <p className="text-red-500 text-xs">{state.fieldErrors.password[0]}</p>}
            </div>

            <div className="text-red-500 text-sm">
                {state?.error}
            </div>

            <div className="flex justify-end pt-2">
                <SubmitButton isEditing={isEditing} />
            </div>
        </form>
    );
}

export function CreateUserButton({ partnerId }: { partnerId: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="text-xs">
                <Plus size={14} className="mr-1" /> Add User
            </Button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Add New User">
                 <UserForm partnerId={partnerId} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}

export function EditUserButton({ partnerId, user }: { partnerId: string; user: UserData }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button 
                 onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                 className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 mr-1"
            >
                <Edit2 size={14} />
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit User">
                 <UserForm partnerId={partnerId} initialData={user} onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}
