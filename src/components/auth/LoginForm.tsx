"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/authActions";
import { Button } from "@/components/ui/Button";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full justify-center" aria-disabled={pending}>
            {pending ? "Logging in..." : "Log in"}
        </Button>
    )
}

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          id="email"
          type="email"
          name="email"
          placeholder="user@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          id="password"
          type="password"
          name="password"
          minLength={6}
          required
        />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm">
          {errorMessage}
        </div>
      )}
      
      <LoginButton />
    </form>
  );
}
