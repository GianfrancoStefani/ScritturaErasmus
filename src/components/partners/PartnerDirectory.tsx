"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ExternalLink, Briefcase, Plus, Trash2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PartnerLogo } from "@/components/partners/PartnerLogo";
import { createPartner, deletePartner } from "@/app/actions/partners";
import { toast } from "sonner";

export function PartnerDirectory({ partners, projects }: { partners: any[], projects: any[] }) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    
    // Filtered
    const filteredPartners = partners.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.project.acronym.toLowerCase().includes(search.toLowerCase()) || 
        p.project.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full md:w-auto relative">
                    <Input 
                        placeholder="Search partners (Name, Project)..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                
                <Button onClick={() => setIsAdding(true)} variant="primary">
                    <Plus size={16} className="mr-2" /> Add Partner
                </Button>
            </div>

            {isAdding && (
                <AddPartnerModal 
                    projects={projects} 
                    onClose={() => setIsAdding(false)} 
                    onSuccess={() => {
                        setIsAdding(false);
                        router.refresh();
                        toast.success("Partner created successfully");
                    }}
                />
            )}

            <div className="space-y-4">
                {filteredPartners.map(partner => (
                    <PartnerRow key={partner.id} partner={partner} />
                ))}
                
                {filteredPartners.length === 0 && (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        {search ? "No partners found matching your search." : "No partners found. Add one to get started."}
                    </div>
                )}
            </div>
        </div>
    );
}

function PartnerRow({ partner }: { partner: any }) {
    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
            const res = await deletePartner(partner.id, partner.projectId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Partner deleted");
                // window.location.reload(); // Hard reload to ensure state sync if needed, or router.refresh in parent
            }
        }
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
             <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <PartnerLogo 
                    logo={partner.logo} 
                    name={partner.name}
                    className="w-full h-full object-cover"
                />
             </div>
             
             <div className="flex-1 w-full text-center md:text-left">
                <Link href={`/dashboard/partners/${partner.id}`} className="hover:text-indigo-600 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900">{partner.name}</h3>
                </Link>
                <div className="text-sm text-slate-500 flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {partner.city}, {partner.nation}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold uppercase text-slate-600">{partner.type}</span>
                    <span className="bg-indigo-50 px-2 py-0.5 rounded text-xs font-semibold uppercase text-indigo-700">{partner.role}</span>
                </div>
             </div>

             <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-center md:text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Project</div>
                    <Link href={`/dashboard/projects/${partner.projectId}/partners`} className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                         {partner.project.acronym} <ExternalLink size={12} />
                    </Link>
                </div>
                
                <div className="flex items-center gap-2">
                     <Link href={`/dashboard/partners/${partner.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View Details">
                        <Users size={18} />
                     </Link>
                     <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Partner">
                        <Trash2 size={18} />
                     </button>
                </div>
             </div>
        </div>
    )
}

// ... imports
import { searchOrganizations } from "@/app/actions/organizations";
import { Check, X, Search as SearchIcon, Mail as MailIcon } from "lucide-react";

// ... PartnerDirectory component ...

function AddPartnerModal({ projects, onClose, onSuccess }: { projects: any[], onClose: () => void, onSuccess: () => void }) {
    const [step, setStep] = useState<'SEARCH' | 'FORM'>('SEARCH');
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [invitations, setInvitations] = useState<{email: string, role: string}[]>([]);
    const [invitationInput, setInvitationInput] = useState({ email: "", role: "MEMBER" });

    // Search Organization
    const handleSearch = async () => {
        if (searchQuery.length < 2) return;
        const res = await searchOrganizations(searchQuery);
        // Handle both format {data: []} or just [] depending on version, safely
        const data = Array.isArray(res) ? res : (res.data || []);
        setSearchResults(data);
    };

    const handleSelectOrg = (org: any) => {
        setSelectedOrg(org);
        setStep('FORM');
    };

    const handleSkipSearch = () => {
        setSelectedOrg(null);
        setStep('FORM');
    };

    const addInvitation = () => {
        if (!invitationInput.email) return;
        setInvitations([...invitations, { ...invitationInput }]);
        setInvitationInput({ email: "", role: "MEMBER" });
    };

    const removeInvitation = (idx: number) => {
        setInvitations(invitations.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {step === 'SEARCH' ? 'Find Organization' : 'Partner Details'}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>&times;</Button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'SEARCH' ? (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Search by name, city, or PIC..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    // eslint-disable-next-line
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} variant="secondary">
                                    <SearchIcon size={18} />
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {searchResults.map((org: any) => (
                                    <div key={org.id} className="p-3 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group" onClick={() => handleSelectOrg(org)}>
                                        <div className="flex items-center gap-3">
                                            {org.logoUrl ? (
                                                <img src={org.logoUrl} alt="" className="w-10 h-10 object-contain rounded bg-white border border-slate-100" />
                                            ) : (
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold">
                                                    {org.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{org.name}</div>
                                                <div className="text-xs text-slate-500">{org.city}, {org.nation}</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-indigo-600 opacity-0 group-hover:opacity-100">Select</Button>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && (
                                    <div className="text-center text-slate-400 py-8 text-sm">No organizations found.</div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500 mb-2">Can't find the organization?</p>
                                <Button variant="outline" onClick={handleSkipSearch} className="w-full">
                                    Create Manually (Local Partner)
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form action={async (formData) => {
                            // Append invitations JSON
                            formData.set('invitations', JSON.stringify(invitations));
                            if (selectedOrg) {
                                formData.set('organizationId', selectedOrg.id);
                                // If using organization, some fields might be pre-filled but user can override, 
                                // or we trust form values which are defaulted to org values below.
                            }

                            const res = await createPartner(formData);
                            if (res.error) {
                                toast.error(res.error);
                                if (res.fieldErrors) {
                                    Object.entries(res.fieldErrors).forEach(([k, v]) => toast.error(`${k}: ${v}`));
                                }
                            } else {
                                onSuccess();
                            }
                        }} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project</label>
                                    <select name="projectId" title="Project" required className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white" defaultValue="">
                                        <option value="" disabled>Select Project...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.acronym} - {p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Legal Name</label>
                                    <Input name="name" defaultValue={selectedOrg?.name} placeholder="Full Organization Name" required />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nation</label>
                                    {/* Simplified for demo, ideally a full country list */}
                                    <Input name="nation" defaultValue={selectedOrg?.nation} placeholder="e.g. Italy" required /> 
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">City</label>
                                    <Input name="city" defaultValue={selectedOrg?.city} placeholder="City" required />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                                    <select name="type" title="Type" className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white" defaultValue={selectedOrg?.type || "University"} required>
                                        <option value="University">University</option>
                                        <option value="NGO">NGO</option>
                                        <option value="Company">Company</option>
                                        <option value="Public">Public Body</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Partner Role</label>
                                    <select name="role" title="Partner Role" className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white" required>
                                        <option value="PARTNER">Partner</option>
                                        <option value="COORDINATOR">Coordinator</option>
                                        <option value="ASSOCIATED">Associated</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Budget Share (€)</label>
                                     <Input name="budget" type="number" step="0.01" defaultValue="0" required />
                                </div>
                                
                                {/* Hidden fields for potential extra org data */}
                                <input type="hidden" name="website" value={selectedOrg?.website || ""} />
                                <input type="hidden" name="logo" value={selectedOrg?.logoUrl || ""} />
                            </div>

                            {/* Invitations Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <MailIcon size={14} /> Invite Users
                                </label>
                                
                                <div className="space-y-3 mb-3">
                                    {invitations.map((inv, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 px-3 rounded border border-slate-200 text-sm">
                                            <div>
                                                <span className="font-semibold text-slate-700">{inv.email}</span>
                                                <span className="text-slate-400 mx-2">•</span>
                                                <span className="text-slate-500 uppercase text-xs">{inv.role}</span>
                                            </div>
                                            <button type="button" title="Remove Invitation" onClick={() => removeInvitation(idx)} className="text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {invitations.length === 0 && (
                                        <div className="text-xs text-slate-400 text-center py-2">No invitations added yet.</div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Email address" 
                                        value={invitationInput.email} 
                                        onChange={e => setInvitationInput({...invitationInput, email: e.target.value})}
                                        className="h-9 text-sm"
                                    />
                                    <select 
                                        value={invitationInput.role}
                                        title="Invitation Role"
                                        onChange={e => setInvitationInput({...invitationInput, role: e.target.value})}
                                        className="h-9 text-sm border border-slate-200 rounded px-2 bg-white"
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                    <Button type="button" size="sm" onClick={addInvitation} variant="secondary">
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                 <Button type="button" variant="ghost" onClick={() => setStep('SEARCH')}> Back to Search</Button>
                                 <div className="flex gap-2">
                                     <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                                     <Button type="submit">Create Partner</Button>
                                 </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
