"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrganization, deleteOrganization, createDepartment, getOrganizations, searchOrganizations } from "@/app/actions/organizations";
import { Building, Trash2, Plus, ChevronDown, ChevronRight, School, Filter, Globe, MapPin, Mail,  } from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

export function OrganizationManager({ initialOrgs, isAdmin }: { initialOrgs: any[], isAdmin: boolean }) {
    const [orgs, setOrgs] = useState<any[]>(initialOrgs || []);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterNation, setFilterNation] = useState("ALL");
    
    // Create Org State
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchFiltered = async () => {
             try {
                 let results;
                 if (search.length >= 2) {
                     results = await searchOrganizations(search);
                 } else {
                     results = await getOrganizations({ 
                         type: filterType, 
                         nation: filterNation 
                     });
                 }
                 if (Array.isArray(results)) {
                     setOrgs(results);
                 } else {
                     console.error("Invalid results from server:", results);
                     setOrgs([]);
                     toast.error("Failed to load organizations");
                 }
             } catch (e) {
                 console.error("Fetch error:", e);
                 setOrgs([]);
                 toast.error("Error loading organizations");
             }
        };
        fetchFiltered();
    }, [search, filterType, filterNation]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex-1 w-full md:w-auto relative">
                    <Input 
                        placeholder="Search organizations..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="pl-10"
                    />
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto">
                     <select 
                        value={filterType} 
                        onChange={e => setFilterType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-700"
                        aria-label="Filter by Type"
                     >
                         <option value="ALL">All Types</option>
                         <option value="University">University</option>
                         <option value="NGO">NGO</option>
                         <option value="Company">Company</option>
                         <option value="Research">Research</option>
                         <option value="Public">Public Body</option>
                         <option value="School">School</option>
                     </select>
                     
                     <select 
                        value={filterNation} 
                        onChange={e => setFilterNation(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-700"
                        aria-label="Filter by Nation"
                     >
                         <option value="ALL">All Nations</option>
                         <option value="IT">Italy</option>
                         <option value="ES">Spain</option>
                         <option value="FR">France</option>
                         <option value="DE">Germany</option>
                         <option value="PT">Portugal</option>
                         <option value="OTHER">Other</option>
                     </select>
                 </div>

                 <Button onClick={() => setIsCreating(true)} variant="primary">
                     <Plus size={16} className="mr-2" /> New Organization
                 </Button>
            </div>

            {isCreating && (
                <CreateOrgForm onClose={() => setIsCreating(false)} />
            )}

            <div className="grid grid-cols-1 gap-4">
                {Array.isArray(orgs) && orgs.map(org => (
                    <OrganizationCard key={org.id} org={org} isAdmin={isAdmin} />
                ))}
                {(!orgs || orgs.length === 0) && (
                    <div className="text-center py-10 text-slate-500 italic">No organizations found.</div>
                )}
            </div>
        </div>
    );
}

function CreateOrgForm({ onClose }: { onClose: () => void }) {
    return (
        <form action={async (formData) => {
            try {
                const res = await createOrganization(formData);
                if(!res) {
                    toast.error("No response from server");
                    return;
                }
                if(res.error) toast.error(res.error);
                else { toast.success("Organization Created"); onClose(); }
            } catch (e) {
                console.error(e);
                toast.error("Unexpected error creating organization");
            }
        }} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg">Register New Organization</h3>
                <Button type="button" variant="ghost" onClick={onClose} size="sm">Cancel</Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="col-span-2">
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name *</label>
                     <Input name="name" placeholder="e.g. University of Bologna" required />
                 </div>
                 
                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">Short Name / Acronym</label>
                     <Input name="shortName" placeholder="e.g. UNIBO" />
                 </div>
                 
                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                     <select name="type" className="w-full border border-slate-200 rounded-md p-2 text-sm h-10 bg-white" aria-label="Organization Type">
                        <option value="University">University</option>
                        <option value="NGO">NGO / Association</option>
                        <option value="Company">Company (SME)</option>
                        <option value="Research">Research Institute</option>
                        <option value="Public">Public Body</option>
                        <option value="School">School</option>
                    </select>
                 </div>

                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">Nation</label>
                     <select name="nation" className="w-full border border-slate-200 rounded-md p-2 text-sm h-10 bg-white" aria-label="Nation">
                         <option value="">Select Nation...</option>
                         <option value="IT">Italy</option>
                         <option value="ES">Spain</option>
                         <option value="FR">France</option>
                         <option value="DE">Germany</option>
                         <option value="PT">Portugal</option>
                         <option value="OTHER">Other</option>
                     </select>
                 </div>
                 
                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">City / Address</label>
                     <Input name="address" placeholder="e.g. Via Zamboni, 33" />
                 </div>

                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">Website</label>
                     <Input name="website" placeholder="https://..." />
                 </div>

                 <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1 block">General Email</label>
                     <Input name="email" placeholder="info@..." />
                 </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                 <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                 <SubmitButton />
             </div>
        </form>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : "Create Organization"}</Button>
}

function OrganizationCard({ org, isAdmin }: { org: any, isAdmin: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [deptName, setDeptName] = useState("");
    
    const  handleAddDept = async () => {
        if(!deptName.trim()) return;
        await createDepartment(org.id, deptName);
        setDeptName("");
        toast.success("Department Added");
    }

    const handleDelete = async () => {
        if(confirm("Are you sure? This action cannot be undone.")) {
             await deleteOrganization(org.id);
             toast.success("Organization Deleted");
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group">
             <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200">
                          {org.logoUrl ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" /> : <Building size={24} />}
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-lg">{org.name}</h4>
                              {org.shortName && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono border border-slate-200">{org.shortName}</span>}
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><School size={14}/> {org.type}</span>
                              {org.nation && <span className="flex items-center gap-1"><Globe size={14}/> {org.nation}</span>}
                              <span className="text-slate-300">|</span>
                              <span>{org.departments?.length || 0} Departments</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                       {isAdmin && (
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete Organization">
                               <Trash2 size={18} />
                           </button>
                       )}
                       <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" aria-label="Toggle Details">
                           {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                       </button>
                  </div>
             </div>
             
             {isOpen && (
                 <div className="bg-slate-50 border-t border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                     
                     {/* Info Column */}
                     <div className="md:col-span-1 space-y-3 text-sm">
                         <h5 className="font-semibold text-slate-700 flex items-center gap-2"><MapPin size={16}/> Details</h5>
                         {org.address && <p className="text-slate-600 pl-6">{org.address}</p>}
                         {org.website && (
                             <div className="pl-6">
                                 <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                    <Globe size={14}/> Website
                                 </a>
                             </div>
                         )}
                         {org.email && (
                             <div className="pl-6">
                                 <a href={`mailto:${org.email}`} className="text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                                    <Mail size={14}/> {org.email}
                                 </a>
                             </div>
                         )}
                     </div>

                     {/* Departments Column */}
                     <div className="md:col-span-2">
                         <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><School size={16}/> Departments / Faculties</h5>
                         <div className="flex flex-wrap gap-2 mb-4">
                             {org.departments?.map((d: any) => (
                                 <div key={d.id} className="text-sm text-slate-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                     {d.name}
                                 </div>
                             ))}
                             {(!org.departments || org.departments.length === 0) && <p className="text-sm text-slate-400 italic">No departments registered.</p>}
                         </div>
                         
                         <div className="flex gap-2 max-w-sm mt-4 pt-4 border-t border-slate-200">
                             <Input 
                                value={deptName} 
                                onChange={e => setDeptName(e.target.value)} 
                                placeholder="Add Department..." 
                                className="bg-white h-9 text-sm"
                             />
                             <Button size="sm" onClick={handleAddDept} disabled={!deptName} variant="outline">
                                 Add
                             </Button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    )
}
