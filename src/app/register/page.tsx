"use client";

import { useTransition, useState } from "react";
import { registerUser } from "@/app/actions/register";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Building2, User, Globe, Lock, Mail, BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await registerUser(formData);
            if (result.error) {
                setError(result.error);
            } else {
                router.push('/login?registered=true');
            }
        });
    }

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="h-20 bg-indigo-600 p-6 flex items-center justify-between">
                     <div className="text-white font-bold text-xl flex items-center gap-2">
                        <BadgeCheck /> Registration
                     </div>
                     <div className="text-indigo-100 text-sm">Create your Account</div>
                </div>

                <form action={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Organization Section */}
                    <div className="md:col-span-2">
                        <h3 className="flex items-center gap-2 text-indigo-600 font-bold border-b border-indigo-100 pb-2 mb-4">
                            <Building2 size={18} /> Organization Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Entity Type</label>
                                <select name="orgType" title="Organization Type" required className="w-full p-2.5 rounded border border-slate-300 text-sm bg-white">
                                    <option value="">Select Type...</option>
                                    <option value="University">University / Higher Education</option>
                                    <option value="SME">Small/Medium Enterprise (SME)</option>
                                    <option value="NPO">Non-Profit / NGO</option>
                                    <option value="School">School / Institute</option>
                                    <option value="PublicBody">Public Body</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Entity Name</label>
                                <input type="text" name="orgName" required placeholder="Full Legal Name" className="w-full p-2.5 rounded border border-slate-300 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="md:col-span-2">
                         <h3 className="flex items-center gap-2 text-indigo-600 font-bold border-b border-indigo-100 pb-2 mb-4 mt-2">
                            <User size={18} /> Personal Details
                        </h3>
                         <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4 md:col-span-3">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
                                <select name="title" title="Title" className="w-full p-2.5 rounded border border-slate-300 text-sm bg-white">
                                    <option value="Mr">Mr.</option>
                                    <option value="Mrs">Mrs.</option>
                                    <option value="Dr">Dr.</option>
                                    <option value="Prof">Prof.</option>
                                    <option value="PhD">PhD</option>
                                </select>
                            </div>
                            <div className="col-span-8 md:col-span-4">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                                <input type="text" name="name" required placeholder="First Name" className="w-full p-2.5 rounded border border-slate-300 text-sm" />
                            </div>
                            <div className="col-span-12 md:col-span-5">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Surname</label>
                                <input type="text" name="surname" required placeholder="Last Name" className="w-full p-2.5 rounded border border-slate-300 text-sm" />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nation</label>
                                <select name="nation" title="Nation" required className="w-full p-2.5 rounded border border-slate-300 text-sm bg-white">
                                    <option value="">Select Country...</option>
                                    <option value="IT">Italy</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                    <option value="ES">Spain</option>
                                    <option value="BE">Belgium</option>
                                    <option value="NL">Netherlands</option>
                                    <option value="PL">Poland</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                                <input type="text" name="city" required placeholder="City" className="w-full p-2.5 rounded border border-slate-300 text-sm" />
                            </div>
                         </div>
                    </div>

                    {/* Account Section */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Email (Login)</label>
                                <div className="relative">
                                     <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                     <input type="email" name="email" required placeholder="name@example.com" className="w-full pl-9 p-2.5 rounded border border-slate-300 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input type="password" name="password" required placeholder="••••••" className="w-full pl-9 p-2.5 rounded border border-slate-300 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="md:col-span-2 text-center text-red-600 bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-slate-100">
                        <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600">
                            Already registered? Sign In
                        </Link>
                        <Button type="submit" disabled={isPending} className="px-8 bg-indigo-600 hover:bg-indigo-700">
                            {isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                    </div>

                </form>
            </div>
        </main>
    );
}
