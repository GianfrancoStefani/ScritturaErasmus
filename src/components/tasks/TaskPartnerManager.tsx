"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Plus, X, Check, Shield, ShieldCheck, User } from "lucide-react";
import { addTaskPartner, removeTaskPartner, updateTaskPartnerRole } from "@/app/actions/task-partners";
import { toast } from "sonner";
// import { cn } from "@/lib/utils"; // Removed if not found
import clsx from "clsx"; // Assuming clsx is installed as per summary

function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

interface Partner {
  id: string;
  name: string;
}

interface TaskPartner {
  id: string;
  partnerId: string;
  role: string;
  partner: Partner;
}

interface TaskPartnerManagerProps {
  taskId: string;
  initialPartners?: TaskPartner[]; // Pre-loaded partners from DB
  availablePartners: Partner[]; // All project partners
  className?: string;
}

export function TaskPartnerManager({ taskId, initialPartners = [], availablePartners, className }: TaskPartnerManagerProps) {
  const [partners, setPartners] = useState<TaskPartner[]>(initialPartners);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddPartner = async (partnerId: string) => {
    if (loading) return;
    setLoading(true);
    // Optimistic Update
    const partner = availablePartners.find(p => p.id === partnerId);
    if (!partner) return;
    
    // Default role: If no partners, first is LEAD, else BENEFICIARY
    const newRole = partners.length === 0 ? "LEAD" : "BENEFICIARY";

    const optimId = "temp-" + Date.now();
    const newEntry: TaskPartner = { id: optimId, partnerId, role: newRole, partner };
    setPartners([...partners, newEntry]);

    const res = await addTaskPartner({ taskId, partnerId, role: newRole });
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

    const res = await removeTaskPartner(taskId, partnerId);
    if (!res.success) {
      toast.error("Failed to remove partner");
      setPartners(oldPartners);
    }
    setLoading(false);
  };

  const handleChangeRole = async (partnerId: string, newRole: string) => {
     // Optimistic
     const oldPartners = [...partners];
     setPartners(partners.map(p => p.partnerId === partnerId ? { ...p, role: newRole } : p));
     
     const res = await updateTaskPartnerRole(taskId, partnerId, newRole);
     if (!res.success) {
         setPartners(oldPartners);
         toast.error("Failed to update role");
     }
  };

  const availableToAdd = availablePartners.filter(ap => !partners.some(p => p.partnerId === ap.id));

  return (
    <div className={cn("relative", className)} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors border border-dashed border-slate-300 hover:border-indigo-300 rounded-full px-2 py-0.5 bg-white"
        title="Manage Task Partners"
      >
        <Users size={12} />
        {partners.length === 0 ? (
          <span className="italic">No Partners</span>
        ) : (
          <span className="font-medium text-indigo-600">{partners.length} Assigned</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 animate-in zoom-in-95 duration-200">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 mb-1">
                <span>Task Partners</span>
                <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full">{partners.length}</span>
            </div>

            {/* Current List */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {partners.length === 0 && <div className="text-center py-4 text-xs text-slate-400">No partners assigned yet.</div>}
                {partners.map(tp => (
                    <div key={tp.partnerId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded group">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700">{tp.partner.name}</span>
                            <div className="flex gap-1 mt-1">
                                <button 
                                    onClick={() => handleChangeRole(tp.partnerId, "LEAD")}
                                    className={cn("text-[9px] px-1 rounded border", tp.role === "LEAD" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-400 opacity-50 hover:opacity-100")}
                                >
                                    LEAD
                                </button>
                                <button 
                                     onClick={() => handleChangeRole(tp.partnerId, "CO_LEAD")}
                                     className={cn("text-[9px] px-1 rounded border", tp.role === "CO_LEAD" ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-slate-200 text-slate-400 opacity-50 hover:opacity-100")}
                                >
                                    CO-LEAD
                                </button>
                                <button 
                                     onClick={() => handleChangeRole(tp.partnerId, "BENEFICIARY")}
                                     className={cn("text-[9px] px-1 rounded border", tp.role === "BENEFICIARY" ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white border-slate-200 text-slate-400 opacity-50 hover:opacity-100")}
                                >
                                    PARTNER
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleRemovePartner(tp.partnerId)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                            title="Remove Partner"
                            aria-label="Remove Partner"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
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
