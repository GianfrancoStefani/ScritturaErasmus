"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changePassword } from "@/app/actions/settings";

export function PasswordForm({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = (formData: FormData) => {
    setErrors({});
    startTransition(async () => {
      const result = await changePassword(userId, formData);
      if (result.error) {
         if (typeof result.error === 'object') {
             setErrors(result.error);
         } else {
             alert(result.error);
         }
      } else {
        alert("Password changed successfully!");
        // Reset form
        const form = document.getElementById("password-form") as HTMLFormElement;
        form?.reset();
      }
    });
  };

  return (
    <form id="password-form" action={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
        <Input name="currentPassword" type="password" required />
        {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
        <Input name="newPassword" type="password" required />
        {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
        <Input name="confirmPassword" type="password" required />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>

      <div className="pt-2">
        <Button variant="outline" type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
