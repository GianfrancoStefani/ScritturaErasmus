import LoginForm from "@/components/auth/LoginForm";
import { Layers } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen bg-slate-50">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-indigo-600 p-3 md:h-36">
          <div className="w-32 text-white md:w-36 flex items-center gap-2">
            <Layers size={32} />
            <span className="font-bold text-xl">Erasmus+ Writer</span>
          </div>
        </div>
        
        <div className="flex-1 rounded-lg bg-white px-6 pb-4 pt-8 shadow-md">
            <h1 className="mb-3 text-2xl font-bold text-slate-900">
                Please log in to continue.
            </h1>
            <LoginForm />
            <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Sign up
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
