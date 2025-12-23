"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrganization, updateOrganization, deleteOrganization, createDepartment, getOrganizations, searchOrganizations } from "@/app/actions/organizations";
import { Building, Trash2, Plus, ChevronDown, ChevronRight, School, Filter, Globe, MapPin, Mail, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function OrganizationManager({ initialOrgs, isAdmin }: { initialOrgs: any[], isAdmin: boolean }) {
    const [orgs, setOrgs] = useState<any[]>(initialOrgs || []);
    const [total, setTotal] = useState(0); // If initialOrgs is partial, we don't know total yet unless passed. But client loads first page. 
    // Ideally initialOrgs should also come with total, but for now we fetch client side often.
    
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [filterNation, setFilterNation] = useState("ALL");
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    // Create Org State
    const [isCreating, setIsCreating] = useState(false);

    // "Immediate" Search: Debounce heavily reduced (e.g. 50ms) to feel instant but batch slight bursts
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page on search change
        }, 50); 
        return () => clearTimeout(timer);
    }, [search]);
    
    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [filterType, filterNation]);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchFiltered = async () => {
             setIsLoading(true);
             try {
                 let res;
                 if (debouncedSearch.length >= 1) { // Search even with 1 char if immediate
                     res = await searchOrganizations(debouncedSearch, page, LIMIT);
                 } else {
                     res = await getOrganizations({ 
                         type: filterType, 
                         nation: filterNation 
                     }, page, LIMIT);
                 }
                 
                 if (res && res.data) {
                     setOrgs(res.data);
                     setTotal(res.total);
                 } else {
                     setOrgs([]);
                     setTotal(0);
                 }
             } catch (e) {
                 console.error("Fetch error:", e);
                 setOrgs([]);
             } finally {
                 setIsLoading(false);
             }
        };
        fetchFiltered();
    }, [debouncedSearch, filterType, filterNation, page]); // Re-run on page change
    
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex-1 w-full md:w-auto relative">
                    <Input 
                        placeholder="Search organizations (Name)..." 
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
                <OrgForm onClose={(newOrg) => {
                    setIsCreating(false);
                    if (newOrg) {
                        setOrgs((prev) => [newOrg, ...prev]);
                         // Just prepend to visualize immediately, though pagination might hide it if refreshed. 
                         // Ideally re-fetch or rely on user knowing it's there.
                        toast.success("Organization added");
                    }
                }} />
            )}

            {/* Pagination Controls (Top) */}
            <PaginationControls page={page} totalPages={totalPages} setPage={setPage} totalItems={total} isLoading={isLoading} />

            <div className="grid grid-cols-1 gap-4">
                {isLoading && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}
                
                {!isLoading && Array.isArray(orgs) && orgs.map(org => (
                    <OrganizationCard key={org.id} org={org} isAdmin={isAdmin} />
                ))}
                
                {!isLoading && (!orgs || orgs.length === 0) && (
                    <div className="text-center py-10 text-slate-500 italic">No organizations found.</div>
                )}
            </div>
            
            {/* Pagination Controls (Bottom) */}
             <PaginationControls page={page} totalPages={totalPages} setPage={setPage} totalItems={total} isLoading={isLoading} />
        </div>
    );
}

function PaginationControls({ page, totalPages, setPage, totalItems, isLoading }: any) {
    if (totalItems === 0) return null;
    return (
        <div className="flex items-center justify-between bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
            <span className="text-xs text-slate-500">
                Page <span className="font-bold text-slate-700">{page}</span> of {totalPages} ({totalItems} total)
            </span>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                >
                    Previous
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

function OrgForm({ initialData, onClose }: { initialData?: any, onClose: (newOrg?: any) => void }) {
     const isEdit = !!initialData;
     return (
        <form action={async (formData) => {
            
            try {
                let res;
                if (isEdit) {
                    res = await updateOrganization(initialData.id, formData);
                } else {
                    res = await createOrganization(formData);
                }

                if(!res) {
                    toast.error("No response from server");
                    return;
                }
                if(res.error) toast.error(res.error);
                else { 
                    toast.success(isEdit ? "Organization Updated" : "Organization Created"); 
                    onClose(res.organization); 
                }
            } catch (e) {
                console.error(e);
                toast.error("Unexpected error saving organization");
            }
        }} className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg">{isEdit ? "Edit Organization" : "Register New Organization"}</h3>
                <Button type="button" variant="ghost" onClick={() => onClose()} size="sm">Cancel</Button>
             </div>
             
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="col-span-2">
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name *</label>
                         <Input name="name" defaultValue={initialData?.name} placeholder="e.g. University of Bologna" required />
                     </div>
                     
                     <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Short Name / Acronym</label>
                         <Input name="shortName" defaultValue={initialData?.shortName} placeholder="e.g. UNIBO" />
                     </div>
                     
                     <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                         <select name="type" defaultValue={initialData?.type} className="w-full border border-slate-200 rounded-md p-2 text-sm h-10 bg-white" aria-label="Organization Type">
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
                         <select name="nation" defaultValue={initialData?.nation} className="w-full border border-slate-200 rounded-md p-2 text-sm h-10 bg-white" aria-label="Nation">
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
                         <Input name="address" defaultValue={initialData?.address} placeholder="e.g. Via Zamboni, 33" />
                     </div>

                     <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Official Website</label>
                         <Input name="website" defaultValue={initialData?.website} placeholder="e.g. unibo.it" />
                     </div>

                     <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">UniRank URL</label>
                         <Input name="unirankUrl" defaultValue={initialData?.unirankUrl} placeholder="https://www.unirank.org/..." />
                     </div>

                     <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">General Email</label>
                         <Input name="email" defaultValue={initialData?.email} placeholder="info@..." />
                     </div>
                 </div>

             
             <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                 <Button type="button" variant="ghost" onClick={() => onClose()}>Cancel</Button>
                 <SubmitButton label={isEdit ? "Update Organization" : "Create Organization"} />
             </div>
        </form>
    )
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return <Button disabled={pending}>{pending ? "Saving..." : label}</Button>
}

function OrganizationCard({ org, isAdmin }: { org: any, isAdmin: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deptName, setDeptName] = useState("");
    
    // Logo Strategy:
    // User Request: "image linked to link contained in 'favicon' field and if not present, the default one"
    const getLogo = () => {
        if (org.favicon) return org.favicon;
        // if (org.logoUrl) return org.logoUrl; // Commented out to strictly follow "favicon logic" or default.
        return null; 
    }
    const [logoSrc, setLogoSrc] = useState(getLogo());
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setLogoSrc(getLogo());
        setImgError(false);
    }, [org]);

    const handleImgError = () => {
        setImgError(true);
    }
    
    if (!org) return null;

    // Address Formatter (Title Case)
    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return addr.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // If editing, show form instead of card
    if (isEditing) {
        return (
            <OrgForm 
                initialData={org} 
                onClose={(updatedOrg) => {
                    setIsEditing(false);
                    if(updatedOrg) {
                        window.location.reload(); 
                    }
                }} 
            />
        )
    }

    const  handleAddDept = async () => {
        if(!deptName.trim()) return;
        await createDepartment(org.id, deptName);
        setDeptName("");
        toast.success("Department Added");
    }

    const handleDelete = async () => {
        if(confirm("Are you sure? This action cannot be undone.")) {
             const res = await deleteOrganization(org.id);
             if (res.error) {
                 toast.error(res.error);
             } else {
                 toast.success("Organization Deleted");
             }
        }
    }

    const isUniversity = org.type === 'University';

    // UniRank Link Strategy: Use explicit field if available
    const unirankLink = org.unirankUrl;

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group">
             <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                          {logoSrc && !imgError ? (
                              <img 
                                src={logoSrc}
                                alt="Logo" 
                                className="w-full h-full object-cover" 
                                onError={handleImgError}
                              />
                          ) : (
                              <Building size={24} className="text-slate-400" />
                          )}
                          
                          {/* Only show UniRank search icon here if it's a University AND link exists */}
                          {isUniversity && unirankLink && (
                              <div className="pl-6">
                                  <a href={unirankLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-600 hover:underline flex items-center gap-1 text-xs mt-1 whitespace-nowrap">
                                     <Search size={12}/> UniRank Profile
                                  </a>
                              </div>
                          )}
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
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" aria-label="Edit Organization">
                            <Pencil size={18} />
                        </button>

                       <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete Organization">
                           <Trash2 size={18} />
                       </button>

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
                         {org.address && <p className="text-slate-600 pl-6">{formatAddress(org.address)}</p>}
                         {org.website && (
                             <div className="pl-6">
                                 <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                    <Globe size={14}/> {org.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
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
                         
                         {isUniversity && (
                             <div className="pl-6 pt-2 mt-2 border-t border-slate-100 space-y-2">
                                 <div className="flex items-center gap-2 text-xs">
                                     <span className="font-semibold text-slate-500 w-24">Erasmus Code:</span>
                                     <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded min-w-[30px] inline-block text-center">{org.erasmusCode || "--"}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs">
                                     <span className="font-semibold text-slate-500 w-24">OID:</span>
                                     <span className="font-mono text-slate-700">{org.oid || "--"}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs">
                                     <span className="font-semibold text-slate-500 w-24">PIC:</span>
                                     <span className="font-mono text-slate-700">{org.pic || "--"}</span>
                                 </div>
                                 {unirankLink && (
                                     <div className="pt-2">
                                         <a href={unirankLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-600 hover:underline flex items-center gap-1 text-xs">
                                             <Search size={12}/> UniRank Profile
                                         </a>
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>

                     {/* Departments Column */}
                     <div className="md:col-span-2">
                         <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><School size={16}/> Departments / Faculties</h5>
                         <div className="flex flex-wrap gap-2 mb-4">
                             {Array.isArray(org.departments) && org.departments.map((d: any) => (
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
