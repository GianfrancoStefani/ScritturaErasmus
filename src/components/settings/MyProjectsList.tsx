"use client";

import { useState } from "react";
import { Edit2, Save, X, ExternalLink, Building2 } from "lucide-react";
import { updateProjectMembership } from "@/app/actions/settings";
import Link from "next/link";
import { toast } from "sonner";
import { SelectionPopup } from "@/components/ui/SelectionPopup";
import { PROFESSIONAL_ROLES } from "@/constants/roles";

export function MyProjectsList({ memberships, userId, affiliations = [] }: { memberships: any[], userId: string, affiliations?: any[] }) {
    return (
        <div className="space-y-4">
             {memberships.length === 0 ? (
                 <p className="text-slate-500 italic">You are not part of any projects yet.</p>
             ) : (
                 <div className="grid gap-4">
                     {memberships.map(m => (
                         <ProjectMembershipItem key={m.projectId} membership={m} userId={userId} affiliations={affiliations} />
                     ))}
                 </div>
             )}
        </div>
    );
}

function ProjectMembershipItem({ membership, userId, affiliations }: { membership: any, userId: string, affiliations: any[] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState({
        participationMode: membership.participationMode || "",
        projectRole: membership.projectRole || "",
        // Initialize Monthly Rate for UI (Daily * 20)
        customMonthlyRate: (membership.customDailyRate || 0) * 20,
        // Legacy or Linked
        organizationId: membership.organizationId || "",
        userAffiliationId: membership.userAffiliationId || "",
        organizationName: membership.organization?.name || "",
    });

    const [isRolePopupOpen, setIsRolePopupOpen] = useState(false);
    const roleOptions = Object.entries(PROFESSIONAL_ROLES).flatMap(([cat, roles]) => 
        roles.map(r => ({ label: r, value: r }))
    );

    const project = membership.project;
    
    if (!project) return null;

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("participationMode", data.participationMode);
        formData.append("projectRole", data.projectRole);
        // Save back as Daily Rate (Monthly / 20)
        const dailyRate = data.customMonthlyRate / 20;
        formData.append("customDailyRate", dailyRate.toString());
        formData.append("organizationId", data.organizationId);
        formData.append("userAffiliationId", data.userAffiliationId);

        const res = await updateProjectMembership(userId, formData);
        setIsSaving(false);
        if (res.error) {
            toast.error(typeof res.error === 'string' ? res.error : "Failed to update");
        } else {
            toast.success("Updated successfully");
            setIsEditing(false);
        }
    };

    const isOrgRelevant = ["ENTITY", "NGO"].includes(data.participationMode);

    // Helper: Find selected affiliation to display name
    const selectedAffiliation = affiliations.find(a => a.id === data.userAffiliationId);
    
    // Display Name Logic
    let orgDisplayName = data.organizationName;
    if (selectedAffiliation) {
        orgDisplayName = selectedAffiliation.organization.name + (selectedAffiliation.departmentName ? ` - ${selectedAffiliation.departmentName}` : "");
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{project.acronym}</span>
                        <h3 className="font-bold text-slate-800">{project.title}</h3>
                        <Link href={`/dashboard/projects/${project.id}`} className="text-slate-400 hover:text-indigo-600">
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                    <p className="text-xs text-slate-500">{project.role} • {project.status || 'Active'}</p>
                </div>
                <div>
                     {!isEditing ? (
                         <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1" aria-label="Edit Membership">
                             <Edit2 size={16} />
                         </button>
                     ) : (
                         <div className="flex gap-1">
                             <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500 p-1" aria-label="Cancel Edit"><X size={16} /></button>
                             <button onClick={handleSave} disabled={isSaving} className="text-indigo-600 hover:text-indigo-800 p-1" aria-label="Save Changes">
                                 {isSaving ? "..." : <Save size={16} />}
                             </button>
                         </div>
                     )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-2 pt-2 border-t border-slate-100">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Your Role (Multiple)</label>
                    {isEditing ? (
                        <>
                            <div 
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white min-h-[30px] flex flex-wrap gap-1 cursor-pointer items-center hover:border-indigo-300 transition-all"
                                onClick={() => setIsRolePopupOpen(true)}
                            >
                                {((data.projectRole || '').split(',').filter(Boolean).length === 0) && <span className="text-slate-400 italic text-xs">Select roles (+)</span>}
                                {(data.projectRole || '').split(',').filter(Boolean).map(r => (
                                    <span key={r} className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded text-[10px] border border-indigo-100">
                                        {r.trim()}
                                    </span>
                                ))}
                            </div>
                            <SelectionPopup 
                                isOpen={isRolePopupOpen}
                                onClose={() => setIsRolePopupOpen(false)}
                                title="Select Project Roles"
                                options={roleOptions}
                                selectedValues={(data.projectRole || '').split(',').map(r => r.trim()).filter(Boolean)}
                                onConfirm={(newRoles) => setData({...data, projectRole: newRoles.join(', ')})}
                                multiSelect={true}
                            />
                        </>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                             {(data.projectRole || '').split(',').filter(Boolean).length > 0 ? (
                                 (data.projectRole || '').split(',').filter(Boolean).map(r => (
                                     <span key={r} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                         {r.trim()}
                                     </span>
                                 ))
                             ) : (
                                 <span className="text-slate-400 italic">Member</span>
                             )}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Participation</label>
                    {isEditing ? (
                        <select 
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white focus:border-indigo-500 outline-none"
                            value={data.participationMode}
                            onChange={(e) => setData({ ...data, participationMode: e.target.value })}
                            aria-label="Participation Mode"
                        >
                            <option value="">Select...</option>
                            <option value="ENTITY">Partner Staff</option>
                            <option value="NGO">NGO Rep.</option>
                            <option value="INDEPENDENT">Freelancer</option>
                        </select>
                    ) : (
                        <p className="text-slate-700 font-medium capitalize">{data.participationMode?.toLowerCase() || "-"}</p>
                    )}
                </div>
                
                {/* Organization Selector (Using Cards) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Affiliation / Organization</label>
                    {isEditing ? (
                         isOrgRelevant ? (
                             affiliations.length > 0 ? (
                                <select 
                                    className="w-full border border-slate-200 rounded px-2 py-1 text-sm bg-white focus:border-indigo-500 outline-none"
                                    value={data.userAffiliationId}
                                    onChange={(e) => {
                                        const affId = e.target.value;
                                        const aff = affiliations.find(a => a.id === affId);
                                        setData({
                                            ...data, 
                                            userAffiliationId: affId, 
                                            organizationId: aff ? aff.organizationId : "",
                                            organizationName: aff ? aff.organization.name : ""
                                        }); 
                                    }}
                                    aria-label="Select Affiliation Card"
                                >
                                    <option value="">Select Card...</option>
                                    {affiliations.map(aff => (
                                        <option key={aff.id} value={aff.id}>
                                            {aff.organization.name} {aff.departmentName ? `(${aff.departmentName})` : ""}
                                        </option>
                                    ))}
                                </select>
                             ) : (
                                 <p className="text-red-500 text-xs italic">
                                     No cards found. <a href="#" onClick={(e) => {e.preventDefault(); document.getElementById('affiliation-manager')?.scrollIntoView({behavior: 'smooth'})}} className="underline">Create one below.</a>
                                 </p>
                             )
                         ) : (
                             <span className="text-slate-400 text-xs italic">N/A</span>
                         )
                    ) : (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            {orgDisplayName ? (
                                <>
                                    <Building2 size={12} className="text-indigo-400 flex-shrink-0" />
                                    <p className="text-slate-700 font-medium truncate" title={orgDisplayName}>{orgDisplayName}</p>
                                </>
                            ) : (
                                <p className="text-slate-400 italic">-</p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Rate (€)</label>
                    {isEditing ? (
                        <div className="relative">
                            <input 
                                type="number"
                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
                                value={data.customMonthlyRate}
                                onChange={(e) => setData({ ...data, customMonthlyRate: parseFloat(e.target.value) })}
                                aria-label="Monthly Rate"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">Based on 20 days/mo</div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-slate-700 font-medium">€{data.customMonthlyRate?.toFixed(2) || "0.00"}</p>
                             <p className="text-[10px] text-slate-400">Daily: €{(data.customMonthlyRate / 20).toFixed(2)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
