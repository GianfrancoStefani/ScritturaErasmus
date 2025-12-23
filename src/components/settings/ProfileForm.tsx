"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/app/actions/settings";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { User, Calendar, MapPin, Hash, ChevronDown, ChevronRight, Mail, Phone, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProfileForm({ user }: { user: any }) {
    const router = useRouter();
    const [data, setData] = useState({
        prefix: user.prefix || "",
        gender: user.gender || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        birthPlace: user.birthPlace || "",
        photo: user.photo || "",
        // Existing fields
        name: user.name || "",
        surname: user.surname || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || ""
    });
    
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        const res = await updateProfile(user.id, formData);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Profile updated");
            router.refresh();
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <User size={24} className="text-indigo-600" /> My Profile
                </h2>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Personal Information */}
            <Section title="Personal Information" icon={<User size={18} />} defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* Photo */}
                    <div className="md:col-span-1 flex flex-col items-center border-r border-slate-100 pr-4">
                        {/* Debug: {data.photo} */}
                        <ImageUpload 
                            value={data.photo} 
                            onChange={(url) => setData({...data, photo: url})} 
                            label="Profile Photo"
                            className="mb-4"
                        />
                         <p className="text-xs text-slate-400 text-center px-4">
                            Allowed: JPG, PNG. Max 5MB.<br/>Recommended: Square format.
                        </p>
                    </div>
                    
                    {/* Fields */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                                 <select 
                                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm bg-white"
                                    value={data.prefix}
                                    onChange={(e) => setData({...data, prefix: e.target.value})}
                                    aria-label="Title"
                                 >
                                     <option value="">-</option>
                                     <option value="Mr.">Mr.</option>
                                     <option value="Mrs.">Mrs.</option>
                                     <option value="Dr.">Dr.</option>
                                     <option value="Prof.">Prof.</option>
                                     <option value="PhD">PhD</option>
                                 </select>
                             </div>
                             <div className="col-span-2">
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Gender</label>
                                 <div className="flex gap-4 pt-2">
                                     {['Male', 'Female', 'Other'].map(g => (
                                         <label key={g} className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 hover:text-indigo-600">
                                             <input 
                                                type="radio" 
                                                name="gender" 
                                                value={g}
                                                checked={data.gender === g}
                                                onChange={(e) => setData({...data, gender: e.target.value})}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                             />
                                             {g}
                                         </label>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label>
                                 <Input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Surname</label>
                                 <Input value={data.surname} onChange={(e) => setData({...data, surname: e.target.value})} />
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Date of Birth</label>
                                 <div className="relative">
                                     <Input 
                                        type="date" 
                                        value={data.birthDate} 
                                        onChange={(e) => setData({...data, birthDate: e.target.value})} 
                                     />
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-slate-500 mb-1 block">Place of Birth</label>
                                 <div className="relative">
                                     <Input 
                                        value={data.birthPlace} 
                                        onChange={(e) => setData({...data, birthPlace: e.target.value})} 
                                        placeholder="City, Country"
                                     />
                                     <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </Section>

            {/* Contact Information */}
            <Section title="Contact Information" icon={<Mail size={18} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Email Address</label>
                         <div className="relative">
                             <Input value={data.email} disabled className="bg-slate-50 text-slate-500 pl-9" />
                             <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-500 font-medium">Verified</span>
                         </div>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number</label>
                         <div className="relative">
                            <Input value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} placeholder="+39..." className="pl-9" />
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                    </div>
                </div>
            </Section>
            
             {/* Security & Login (Placeholder for now, usually handled separately but good to show structure) */}
             {/* <Section title="Security" icon={<Shield size={18} />}>
                <p className="text-sm text-slate-500">To change your password, please use the separate Security tab.</p>
             </Section> */}
        </div>
    );
}

function Section({ title, icon, children, defaultOpen = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-transparent data-[open=true]:border-slate-100"
                data-open={isOpen}
            >
                <div className="flex items-center gap-3">
                    <span className="text-slate-500">{icon}</span>
                    <span className="font-semibold text-slate-700">{title}</span>
                </div>
                <span className="text-slate-400">
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
            </button>
            
            {isOpen && (
                <div className="p-6 animate-in slide-in-from-top-2">
                    {children}
                </div>
            )}
        </div>
    )
}

