"use client";

import { useState, useEffect } from "react";
import { getProjectMemberDetails, updateMemberProfile, saveUserAvailability } from "@/app/actions/user-management"; 
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserDetailPage() {
    const params = useParams(); // { id: projectId, memberId: memberId }
    const projectId = params.id as string;
    const memberId = params.memberId as string;

    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [customRate, setCustomRate] = useState<number>(0);
    const [availability, setAvailability] = useState<number[]>(Array(12).fill(0));

    useEffect(() => {
        const load = async () => {
             const data = await getProjectMemberDetails(memberId);
             if (data) {
                 setMember(data);
                 setCustomRate(data.customDailyRate || 0);
                 // Load Availability for 2025 (Hardcoded for prototype simplicity as per previous component)
                 const avail = data.user.availabilities.find((a: any) => a.year === 2025);
                 if (avail) {
                     setAvailability([
                         avail.daysJan, avail.daysFeb, avail.daysMar, avail.daysApr,
                         avail.daysMay, avail.daysJun, avail.daysJul, avail.daysAug,
                         avail.daysSep, avail.daysOct, avail.daysNov, avail.daysDec
                     ]);
                 }
             }
             setLoading(false);
        };
        load();
    }, [memberId]);

    const handleSaveProfile = async () => {
        await updateMemberProfile(memberId, projectId, { customDailyRate: customRate });
        // Save Availability
        // We need userId, but member has it.
        if (member?.userId) {
            await saveUserAvailability(member.userId, 2025, availability);
        }
        toast.success("Profile updated");
    };

    if (loading) return <div>Loading...</div>;
    if (!member) return <div>Member not found</div>;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Link href={`/dashboard/projects/${projectId}/team`} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-6">
                <ArrowLeft size={16} /> Back to Team
            </Link>

            <header className="mb-10 flex justify-between items-start">
                <div>
                     <h1 className="text-3xl font-black text-slate-900 mb-2">{member.user.surname} {member.user.name}</h1>
                     <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-bold">{member.partner.name}</span>
                        <span>•</span>
                        <span>{member.user.email}</span>
                     </div>
                </div>
                <Button onClick={handleSaveProfile} className="gap-2">
                    <Save size={16} /> Save Changes
                </Button>
            </header>

            <div className="grid gap-8">
                {/* Financial Settings */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-lg mb-4 text-slate-800">Financial Settings</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custom Daily Rate (€)</label>
                            <input 
                                type="number" 
                                className="w-full border p-2 rounded" 
                                value={customRate} 
                                title="Custom Daily Rate"
                                placeholder="0.00"
                                onChange={e => setCustomRate(parseFloat(e.target.value))}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Overrides default national/role rate.</p>
                        </div>
                    </div>
                </section>

                {/* Availability Calendar */}
                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-lg mb-4 text-slate-800">Availability (Days / Month) - 2025</h2>
                    <div className="grid grid-cols-6 gap-4">
                        {months.map((m, i) => (
                            <div key={m}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-center">{m}</label>
                                <input 
                                    type="number" 
                                    className="w-full border p-2 rounded text-center font-mono" 
                                    value={availability[i]} 
                                    min={0}
                                    max={31}
                                    title={`Availability for ${m}`}
                                    placeholder="0"
                                    onChange={e => {
                                        const newAvail = [...availability];
                                        newAvail[i] = parseFloat(e.target.value) || 0;
                                        setAvailability(newAvail);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
