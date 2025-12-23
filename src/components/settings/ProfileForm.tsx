"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/app/actions/settings";
import { User } from "@prisma/client";

export function ProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile(user.id, formData);
      if (result.error) {
        alert(result.error);
      } else {
        alert("Profile updated successfully!");
        // Ideally we'd refresh the session here but full page reload or reval works for now
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <Input name="name" defaultValue={user.name} required />
        </div>
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
            <Input name="surname" defaultValue={user.surname} required />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
        <Input name="username" defaultValue={user.username} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <Input name="email" type="email" defaultValue={user.email || ""} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Mother Tongue (Lingua madre)</label>
        <p className="text-xs text-slate-500 mb-1">Used as default language for translations.</p>
        <select 
            name="motherTongue" 
            defaultValue={user.motherTongue || "en"} 
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
        >
            <option value="en">English</option>
            <option value="it">Italian</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
        </select>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
