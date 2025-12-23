"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchOrganizations, createOrganization } from "@/app/actions/organizations";
import { createUserAffiliation, deleteUserAffiliation, updateUserAffiliation } from "@/app/actions/affiliations";
import { Building2, Plus, Trash2, Edit2, Phone, Mail, User, Briefcase, Save, X } from "lucide-react";
import { toast } from "sonner";

export function AffiliationManager({ affiliations }: { affiliations: any[] }) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-4">
            {isCreating && (
                <AffiliationForm onClose={() => setIsCreating(false)} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {affiliations.map(aff => (
                    <AffiliationCard key={aff.id} affiliation={aff} />
                ))}
                
                {/* Dashed Add Button */}
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex flex-col items-center justify-center gap-2 min-h-[140px] p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                    aria-label="Add New Affiliation"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                        <Plus size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <span className="font-semibold text-slate-500 group-hover:text-indigo-600">Add Affiliation</span>
                </button>
            </div>
        </div>
    );
}

function AffiliationForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
    const [orgSearch, setOrgSearch] = useState("");
    const [orgResults, setOrgResults] = useState<any[]>([]);
    
    // Form State
    const [data, setData] = useState({
        organizationId: initialData?.organizationId || "",
        organizationName: initialData?.organization?.name || "",
        departmentName: initialData?.departmentName || "",
        role: initialData?.role || "",
        contactPerson: initialData?.contactPerson || "",
        phone: initialData?.phone || "",
        email: initialData?.email || ""
    });

    // Debounced Search
    useEffect(() => {
        if (data.organizationId) return; // Don't search if selected
        const timer = setTimeout(async () => {
            if (orgSearch.length >= 2) {
                const results = await searchOrganizations(orgSearch);
                setOrgResults(results);
            } else {
                setOrgResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [orgSearch, data.organizationId]);

    const handleSave = async () => {
        if (!data.organizationId) {
            toast.error("Please select an organization");
            return;
        }

        const formData = new FormData();
        formData.append("organizationId", data.organizationId);
        formData.append("departmentName", data.departmentName);
        formData.append("role", data.role);
        formData.append("contactPerson", data.contactPerson);
        formData.append("phone", data.phone);
        formData.append("email", data.email);

        let res;
        if (initialData?.id) {
            res = await updateUserAffiliation(initialData.id, formData);
        } else {
            res = await createUserAffiliation(formData);
        }

        if (res.error) {
            toast.error(typeof res.error === 'string' ? res.error : "Failed to save");
        } else {
            toast.success("Affiliation Card Saved");
            onClose();
        }
    };

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-slate-700 mb-3">{initialData ? "Edit Card" : "New Affiliation Card"}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Organization Selection */}
                <div className="col-span-2 relative">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Organization</label>
                    {data.organizationName ? (
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded">
                            <span className="font-medium text-slate-800 flex items-center gap-2">
                                <Building2 size={16} className="text-indigo-500" />
                                {data.organizationName}
                            </span>
                            {!initialData && (
                                <button 
                                    onClick={() => { setData({...data, organizationId: "", organizationName: ""}); setOrgSearch(""); }} 
                                    className="text-slate-400 hover:text-red-500"
                                    aria-label="Remove Organization"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <Input 
                                placeholder="Search University or NGO..." 
                                value={orgSearch}
                                onChange={e => setOrgSearch(e.target.value)}
                                className="bg-white"
                                aria-label="Search Organization"
                            />
                            {orgResults.length > 0 ? (
                                <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-lg rounded-md mt-1 max-h-40 overflow-y-auto">
                                    {orgResults.map(org => (
                                        <div 
                                            key={org.id} 
                                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                                            onClick={() => {
                                                setData({ ...data, organizationId: org.id, organizationName: org.name });
                                                setOrgResults([]);
                                            }}
                                        >
                                            <div className="font-bold">{org.name}</div>
                                            <div className="text-slate-400 text-xs">{org.type}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                orgSearch.length >= 2 && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-lg rounded-md mt-1 p-2">
                                        <p className="text-xs text-slate-500 mb-2">No organization found.</p>
                                        <button 
                                            className="w-full text-left text-sm text-indigo-600 hover:bg-indigo-50 p-2 rounded font-medium flex items-center gap-2"
                                            onClick={async () => {
                                                // Quick create organization
                                                const formData = new FormData();
                                                formData.append("name", orgSearch);
                                                formData.append("type", "Other"); // Default or ask?
                                                
                                                const res = await createOrganization(formData);
                                                if (res.error) {
                                                    toast.error("Failed to create organization");
                                                } else if (res.organization) {
                                                    setData({ ...data, organizationId: res.organization.id, organizationName: res.organization.name });
                                                    setOrgResults([]);
                                                    toast.success("Organization Created");
                                                }
                                            }}
                                        >
                                            <Plus size={14} /> Create "{orgSearch}"
                                        </button>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>

                {/* Details */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Department (Optional)</label>
                    <Input 
                        placeholder="e.g. Dept. of Physics" 
                        value={data.departmentName} 
                        onChange={e => setData({...data, departmentName: e.target.value})}
                        className="bg-white"
                        aria-label="Department Name"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">My Role</label>
                    <Input 
                        placeholder="e.g. Professor / Manager" 
                        value={data.role} 
                        onChange={e => setData({...data, role: e.target.value})}
                        className="bg-white"
                        aria-label="Role"
                    />
                </div>
                
                <div className="col-span-2 grid grid-cols-3 gap-4 border-t border-slate-200 pt-3 mt-1">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact Person</label>
                        <Input 
                            placeholder="Reviewer / Admin" 
                            value={data.contactPerson} 
                            onChange={e => setData({...data, contactPerson: e.target.value})}
                            className="bg-white text-xs"
                            aria-label="Contact Person"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone</label>
                        <Input 
                            placeholder="+39..." 
                            value={data.phone} 
                            onChange={e => setData({...data, phone: e.target.value})}
                            className="bg-white text-xs"
                            aria-label="Phone"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Specific Email</label>
                        <Input 
                            placeholder="me@uni.it" 
                            value={data.email} 
                            onChange={e => setData({...data, email: e.target.value})}
                            className="bg-white text-xs"
                            aria-label="Email"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} aria-label="Cancel">Cancel</Button>
                <Button onClick={handleSave} aria-label="Save Affiliation">Save Card</Button>
            </div>
        </div>
    );
}

function AffiliationCard({ affiliation }: { affiliation: any }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return <AffiliationForm onClose={() => setIsEditing(false)} initialData={affiliation} />;
    }

    const handleDelete = async () => {
        if(confirm("Delete this card?")) {
            await deleteUserAffiliation(affiliation.id);
            toast.success("Card Deleted");
        }
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 leading-tight">{affiliation.organization.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{affiliation.organization.type}</p>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50" aria-label="Edit Card">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" aria-label="Delete Card">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
                {affiliation.departmentName && (
                     <div className="flex items-center gap-2">
                         <Briefcase size={14} className="text-slate-400" />
                         <span className="font-medium text-slate-700">{affiliation.departmentName}</span>
                     </div>
                )}
                {affiliation.role && (
                     <div className="flex items-center gap-2">
                         <User size={14} className="text-slate-400" />
                         <span>{affiliation.role}</span>
                     </div>
                )}
                
                {(affiliation.phone || affiliation.email) && (
                    <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500">
                        {affiliation.phone && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                <Phone size={12} /> {affiliation.phone}
                            </div>
                        )}
                        {affiliation.email && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                <Mail size={12} /> {affiliation.email}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -z-10 opacity-50 pointer-events-none translate-x-10 -translate-y-10"></div>
        </div>
    )
}
