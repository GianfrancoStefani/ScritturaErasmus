"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Circle, User, Building, Euro } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding"; // We need this action
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function OnboardingWizard({ invite, currentUser, partners }: { invite: any, currentUser: any, partners: any[] }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    // ...
    const [formData, setFormData] = useState({
        mode: "", 
        partnerId: "", // Selected Partner
        dailyRate: 0,
        daysPerMonth: 0,
        name: "",
        surname: "",
        password: ""
    });

    // ... inside Step 2 ...
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700">2. How will you participate?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Cards ... */}
                        </div>

                        {/* Partner Selector */}
                        {formData.mode && (
                            <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {formData.mode === 'ENTITY' ? "Which Partner do you belong to?" : 
                                     formData.mode === 'NGO' ? "Which NGO are you representing?" : 
                                     "Administrative Reference (Who pays you?)"}
                                </label>
                                <select 
                                    className="input-field" 
                                    value={formData.partnerId} 
                                    onChange={e => setFormData({...formData, partnerId: e.target.value})}
                                    aria-label="Select Partner"
                                >
                                    <option value="">Select Partner...</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {formData.mode === 'INDEPENDENT' && <p className="text-xs text-slate-400 mt-2">Freelancers usually select the Project Coordinator.</p>}
                            </div>
                        )}

                        <div className="flex justify-between mt-6">
                            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!formData.mode || !formData.partnerId}>Next: Financials</Button>
                        </div>
                    </div>
                )}

    const isNewUser = !currentUser;

    async function handleComplete() {
        setLoading(true);
        const res = await completeOnboarding(invite.token, formData);
        setLoading(false);
        
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Welcome to the team!");
            router.push(`/dashboard/projects/${invite.projectId}`);
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-white text-center">
                <h1 className="text-2xl font-bold mb-2">Welcome to {invite.project.title}</h1>
                <p className="opacity-80">Please complete your setup to join the team.</p>
            </div>

            {/* Steps Indicator */}
            <div className="flex justify-center gap-4 py-6 border-b border-slate-100">
                <StepIndicator num={1} current={step} label="Profile" />
                <StepIndicator num={2} current={step} label="Role" />
                <StepIndicator num={3} current={step} label="Financials" />
            </div>

            {/* Step Content */}
            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">1. Your Profile</h2>
                        {isNewUser ? (
                             <div className="bg-slate-50 p-4 rounded border border-slate-200">
                                 <p className="mb-4 text-sm text-slate-600">You are invited as <strong>{invite.email}</strong>. Create your account:</p>
                                 <div className="grid grid-cols-2 gap-4 mb-4">
                                     <input className="input-field" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                     <input className="input-field" placeholder="Surname" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} />
                                 </div>
                                 <input className="input-field mb-4" type="password" placeholder="Choose Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                 <p className="text-xs text-slate-400">Your email {invite.email} will be your username.</p>
                             </div>
                        ) : (
                             <div className="bg-green-50 p-4 rounded border border-green-200 flex items-center gap-3 text-green-700">
                                 <User size={24} />
                                 <div>
                                     <p className="font-bold">Logged in as {currentUser.name}</p>
                                     <p className="text-sm opacity-80">{currentUser.email}</p>
                                 </div>
                             </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={() => setStep(2)}>Next: Role Selection</Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700">2. How will you participate?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SelectionCard 
                                icon={<Building />} title="Partner Entity" 
                                desc="I work for one of the project partners."
                                selected={formData.mode === 'ENTITY'}
                                onClick={() => setFormData({...formData, mode: 'ENTITY'})}
                            />
                            <SelectionCard 
                                icon={<Building className="text-amber-500"/>} title="NGO" 
                                desc="I represent an NGO/Association."
                                selected={formData.mode === 'NGO'}
                                onClick={() => setFormData({...formData, mode: 'NGO'})}
                            />
                            <SelectionCard 
                                icon={<User className="text-indigo-500"/>} title="Independent" 
                                desc="I am an external consultant/freelancer."
                                selected={formData.mode === 'INDEPENDENT'}
                                onClick={() => setFormData({...formData, mode: 'INDEPENDENT'})}
                            />
                        </div>
                        <div className="flex justify-between mt-6">
                            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!formData.mode}>Next: Financials</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700">3. Financial Setup</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Daily Rate (€)</label>
                                <div className="text-xs text-slate-400 mb-2">Your standard daily cost for the project.</div>
                                <input type="number" className="input-field text-lg" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value)})} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Monthly Availability (Days)</label>
                                <div className="text-xs text-slate-400 mb-2">Max days you can dedicate per month.</div>
                                <input type="number" className="input-field text-lg" value={formData.daysPerMonth} onChange={e => setFormData({...formData, daysPerMonth: parseFloat(e.target.value)})} placeholder="e.g. 15" />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 border border-slate-200 mt-4">
                            <p>By clicking "Complete Setup", you accept the invitation to join <strong>{invite.project.title}</strong> as a <strong>{formData.mode}</strong> member.</p>
                        </div>

                        <div className="flex justify-between mt-6">
                            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                            <Button onClick={handleComplete} disabled={loading}>{loading ? "Completing..." : "Complete Setup"}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepIndicator({ num, current, label }: any) {
    const active = current >= num;
    return (
        <div className={`flex items-center gap-2 ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'}`}>
                {num}
            </div>
            <span className="text-sm font-medium hidden md:block">{label}</span>
        </div>
    );
}

function SelectionCard({ icon, title, desc, selected, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${selected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
        >
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selected ? 'bg-indigo-200' : 'bg-slate-50'}`}>
                {icon}
            </div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
    );
}
