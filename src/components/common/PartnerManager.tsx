"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Plus, X, Check, User } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

interface Partner {
  id: string;
  name: string;
}

interface ProjectUser {
    id: string; // ProjectMember ID? Or User ID? Usually ProjectMember has userId. Let's assume passed list comprises objects with user: {id, name...} and partnerId.
    userId: string;
    partnerId: string;
    user: {
        id: string;
        name: string;
        surname: string;
    }
}

export interface EntityPartner {
  id: string;
  partnerId: string;
  role: string;
  partner: Partner;
  responsibleUsers?: {
      id: string;
      name: string;
      surname: string;
  }[]
}

interface PartnerManagerProps {
  entityId: string;
  initialPartners?: EntityPartner[]; 
  availablePartners: Partner[]; 
  availableUsers?: ProjectUser[]; // ProjectMembers
  className?: string;
  
  // Actions passed as props to allow generic usage
  onAdd: (id: string, partnerId: string) => Promise<{ success?: boolean; error?: string }>;
  onRemove: (id: string, partnerId: string) => Promise<{ success?: boolean; error?: string }>;
  onUpdateRole: (id: string, partnerId: string, role: string, responsibleUserIds?: string[]) => Promise<{ success?: boolean; error?: string }>;
}

// Helper to get initials
function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
}

export function PartnerManager({ entityId, initialPartners = [], availablePartners, availableUsers = [], className, onAdd, onRemove, onUpdateRole }: PartnerManagerProps) {
  const [partners, setPartners] = useState<EntityPartner[]>(initialPartners);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update local state if initialPartners changes (e.g. parent revalidated)
  useEffect(() => {
      setPartners(initialPartners);
  }, [initialPartners]);

  const handleAddPartner = async (partnerId: string) => {
    if (loading) return;
    setLoading(true);
    
    // Optimistic Update
    const partner = availablePartners.find(p => p.id === partnerId);
    if (!partner) return;
    
    const newRole = partners.length === 0 ? "LEAD" : "BENEFICIARY";
    const optimId = "temp-" + Date.now();
    const newEntry: EntityPartner = { id: optimId, partnerId, role: newRole, partner, responsibleUsers: [] };
    setPartners([...partners, newEntry]);

    const res = await onAdd(entityId, partnerId);
    if (!res.success) {
      toast.error("Failed to add partner");
      setPartners(partners); // Revert
    } else {
        toast.success("Partner added");
    }
    setLoading(false);
  };

  const handleRemovePartner = async (partnerId: string) => {
    if (loading) return;
    setLoading(true);
    const oldPartners = [...partners];
    setPartners(partners.filter(p => p.partnerId !== partnerId));

    const res = await onRemove(entityId, partnerId);
    if (!res.success) {
      toast.error("Failed to remove partner");
      setPartners(oldPartners);
    }
    setLoading(false);
  };

  const handleChangeRole = async (partnerId: string, newRole: string) => {
     // When changing role, we generally keep existing responsibleUsers
     const current = partners.find(p => p.partnerId === partnerId);
     const currentResponsibleIds = current?.responsibleUsers?.map(u => u.id); // Assuming responsibleUsers is populated

     const oldPartners = [...partners];
     setPartners(partners.map(p => p.partnerId === partnerId ? { ...p, role: newRole } : p));
     
     const res = await onUpdateRole(entityId, partnerId, newRole, currentResponsibleIds);
     if (!res.success) {
         setPartners(oldPartners);
         toast.error("Failed to update role");
     }
  };

  const toggleResponsibleUser = async (partnerId: string, userId: string) => {
    const currentPartner = partners.find(p => p.partnerId === partnerId);
    if (!currentPartner) return;

    const currentIds = currentPartner.responsibleUsers?.map(u => u.id) || [];
    const isSelected = currentIds.includes(userId);
    
    let newIds: string[];
    let newUsers: any[];

    if (isSelected) {
        newIds = currentIds.filter(id => id !== userId);
        newUsers = currentPartner.responsibleUsers?.filter(u => u.id !== userId) || [];
    } else {
        newIds = [...currentIds, userId];
        const userObj = availableUsers.find(u => u.user.id === userId)?.user;
        if (userObj) {
            newUsers = [...(currentPartner.responsibleUsers || []), userObj];
        } else {
            newUsers = currentPartner.responsibleUsers || [];
        }
    }

    const oldPartners = [...partners];
    
    // Optimistic
    setPartners(partners.map(p => {
        if (p.partnerId === partnerId) {
            return { 
                ...p, 
                responsibleUsers: newUsers
            };
        }
        return p;
    }));

    const res = await onUpdateRole(entityId, partnerId, currentPartner.role, newIds);
    if (!res.success) {
        setPartners(oldPartners);
        toast.error("Failed to update responsible persons");
    }
  };


  const availableToAdd = availablePartners.filter(ap => !partners.some(p => p.partnerId === ap.id));

  return (
    <div className={cn("relative inline-block", className)} ref={popoverRef}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors border border-dashed border-slate-300 hover:border-indigo-300 rounded-full px-2 py-0.5 bg-white"
        title="Manage Partners"
      >
        <Users size={12} />
        {partners.length === 0 ? (
          <span className="italic">No Partners</span>
        ) : (
          <span className="font-medium text-indigo-600">{partners.length} Assigned</span>
        )}
      </button>

      {isOpen && (
        <div 
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 mb-1">
                <span>Partners</span>
                <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full">{partners.length}</span>
            </div>

            {/* Current List */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {partners.length === 0 && <div className="text-center py-4 text-xs text-slate-400">No partners assigned yet.</div>}
                {partners.map(tp => {
                    const isLead = tp.role === "LEAD" || tp.role === "CO_LEAD";
                    // Filter users belonging to this partner
                    const partnerUsers = availableUsers.filter(u => u.partnerId === tp.partnerId);

                    return (
                        <div key={tp.partnerId} className="flex flex-col p-2 hover:bg-slate-50 rounded group border-b border-slate-50 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-700 truncate pr-2">{tp.partner.name}</span>
                                <button 
                                    onClick={() => handleRemovePartner(tp.partnerId)}
                                    className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                                    title="Remove Partner"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            
                            <div className="flex gap-1 mb-2">
                                <RoleButton active={tp.role === "LEAD"} onClick={() => handleChangeRole(tp.partnerId, "LEAD")} label="LEAD" color="indigo" />
                                <RoleButton active={tp.role === "CO_LEAD"} onClick={() => handleChangeRole(tp.partnerId, "CO_LEAD")} label="CO-LEAD" color="violet" />
                                <RoleButton active={tp.role === "BENEFICIARY"} onClick={() => handleChangeRole(tp.partnerId, "BENEFICIARY")} label="PARTNER" color="slate" />
                            </div>

                            {/* Responsible Users (Multi-select) */}
                            {isLead && (
                                <div className="mt-1 pl-1 border-l-2 border-slate-100 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                                        <User size={10} />
                                        <span>Writing Leaders</span>
                                    </div>
                                    
                                    {/* Selected Tags */}
                                    {tp.responsibleUsers && tp.responsibleUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {tp.responsibleUsers.map(u => (
                                                <span key={u.id} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {u.name} {u.surname && u.surname[0]}.
                                                    <button onClick={() => toggleResponsibleUser(tp.partnerId, u.id)} className="hover:text-red-500" aria-label="Remove User"><X size={10}/></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* User List with Checkboxes */}
                                    <div className="max-h-24 overflow-y-auto border border-slate-100 rounded bg-slate-50/50 p-1">
                                        {partnerUsers.length === 0 ? (
                                            <div className="text-[10px] text-slate-400 italic p-1">No users found for this partner.</div>
                                        ) : (
                                            partnerUsers.map(u => {
                                                const isSelected = tp.responsibleUsers?.some(ru => ru.id === u.user.id);
                                                return (
                                                    <div 
                                                        key={u.user.id} 
                                                        onClick={() => toggleResponsibleUser(tp.partnerId, u.user.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 p-1 rounded cursor-pointer transition-colors text-xs",
                                                            isSelected ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-100 text-slate-600"
                                                        )}
                                                    >
                                                        <div className={cn("w-3 h-3 rounded border flex items-center justify-center", isSelected ? "bg-indigo-500 border-indigo-500" : "bg-white border-slate-300")}>
                                                           {isSelected && <Check size={8} className="text-white" />}
                                                        </div>
                                                        <span className="truncate">{u.user.name} {u.user.surname}</span>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add New */}
            <div className="border-t border-slate-100 pt-1 mt-1">
                 <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase">Add Partner</div>
                 <div className="max-h-32 overflow-y-auto">
                    {availableToAdd.length === 0 && <div className="px-3 py-2 text-xs text-slate-400 italic">All partners added</div>}
                    {availableToAdd.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleAddPartner(p.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-2"
                        >
                            <Plus size={12} />
                            {p.name}
                        </button>
                    ))}
                 </div>
            </div>
        </div>
      )}
    </div>
  );
}

function RoleButton({ active, onClick, label, color }: { active: boolean, onClick: () => void, label: string, color: string }) {
    const colors: Record<string, string> = {
        indigo: active ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-400",
        violet: active ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-slate-200 text-slate-400",
        slate: active ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white border-slate-200 text-slate-400"
    };

    return (
        <button 
            onClick={onClick}
            className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border transition-all flex-1 text-center font-medium", 
                colors[color],
                !active && "hover:border-slate-300 hover:text-slate-500"
            )}
        >
            {label}
        </button>
    )
}
