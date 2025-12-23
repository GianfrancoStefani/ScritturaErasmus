"use client";

import { useState } from "react";
import { User, Building2, FolderKanban, Shield, CreditCard } from "lucide-react";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { AffiliationManager } from "./AffiliationManager";
import { AvailabilityEditor } from "../availability/AvailabilityEditor";
import { MyProjectsList } from "./MyProjectsList";

export function SettingsTabs({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<"profile" | "affiliations" | "projects">("profile");

    const tabs = [
        { id: "profile", label: "Profile & Security", icon: <User size={18} /> },
        { id: "affiliations", label: "Professional Details", icon: <Building2 size={18} /> },
        { id: "projects", label: "My Projects", icon: <FolderKanban size={18} /> },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                {activeTab === "profile" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                             <ProfileForm user={user} />
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                             <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                                 <Shield size={20} className="text-indigo-600"/>
                                 <h2 className="text-lg font-bold text-slate-800">Security</h2>
                             </div>
                             <PasswordForm userId={user.id} />
                        </div>
                    </div>
                )}

                {activeTab === "affiliations" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Affiliations */}
                         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Affiliation Cards</h2>
                                <p className="text-sm text-slate-500">Manage the organizations you belong to. These cards define your role and details in projects.</p>
                            </div>
                            <AffiliationManager affiliations={user.affiliations} />
                        </div>

                        {/* Availability */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Availability Calendar</h2>
                                <p className="text-sm text-slate-500">Define your yearly availability in days per month.</p>
                            </div>
                            <AvailabilityEditor availabilities={user.availabilities} />
                        </div>
                    </div>
                )}

                {activeTab === "projects" && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">My Projects</h2>
                                <p className="text-sm text-slate-500">Configure your participation, costs, and affiliation for each project.</p>
                             </div>
                             <MyProjectsList memberships={user.memberships} userId={user.id} affiliations={user.affiliations} />
                         </div>
                     </div>
                )}
            </div>
        </div>
    )
}
