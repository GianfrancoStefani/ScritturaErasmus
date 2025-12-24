"use client"

import { useState, useEffect } from "react"
import { Users, AlertCircle, Check } from "lucide-react"
import { assignLeadPartner } from "@/app/actions/lead-partner"
import { toast } from "sonner"
import { SelectionPopup } from "@/components/ui/SelectionPopup" // Reusing this if suitable, or building a small custom one?
// Actually SelectionPopup is designed for multiple options. Let's use a simpler popover or just a dropdown.
// To keep it consistent, I'll build a small popover or trigger similar to ModuleStatusSelector.

interface Partner {
    id: string
    name: string
}

interface LeadPartnerSelectorProps {
    containerId: string
    containerType: "WORK" | "TASK" | "SECTION"
    currentLeadPartnerId: string | null
    partners: Partner[] // Pass available partners
    className?: string
}

export function LeadPartnerSelector({ containerId, containerType, currentLeadPartnerId, partners, className }: LeadPartnerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSelect = async (partnerId: string | null) => {
        setLoading(true)
        try {
            const res = await assignLeadPartner({
                containerId,
                containerType,
                partnerId
            })
            if (res.success) {
                toast.success("Lead partner updated")
                setIsOpen(false)
            } else {
                toast.error("Failed to update lead partner")
            }
        } catch (e) {
             toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const currentPartner = partners.find(p => p.id === currentLeadPartnerId)

    return (
        <div className={`relative ${className || ''}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100 rounded px-1.5 py-0.5"
                title="Assign Lead Partner"
            >
                <Users size={12} />
                <span className="max-w-[100px] truncate">
                    {currentPartner ? currentPartner.name : "No Lead"}
                </span>
            </button>

            {isOpen && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                        Select Lead Partner
                    </div>
                    
                    <button
                         onClick={() => handleSelect(null)}
                         disabled={loading}
                         className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between ${!currentLeadPartnerId ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}
                    >
                         <span>None</span>
                         {!currentLeadPartnerId && <Check size={12} />}
                    </button>

                    {partners.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleSelect(p.id)}
                            disabled={loading}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between ${currentLeadPartnerId === p.id ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}
                        >
                            <span className="truncate">{p.name}</span>
                            {currentLeadPartnerId === p.id && <Check size={12} />}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>
    )
}
