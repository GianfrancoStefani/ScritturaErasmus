"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronDown, ChevronRight, User, Building2, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { CreateUserButton } from './UserForm';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { deletePartner, deleteUser } from '@/app/actions/partners';

// Adapting to real Prisma types
interface UserData {
  id: string;
  name: string;
  surname: string;
  role: string;
}

interface PartnerData {
  id: string;
  projectId: string; // needed for delete revalidation
  name: string;
  nation: string;
  role: string; 
  users: UserData[];
}

export function PartnerTree({ partners }: { partners: PartnerData[] }) {
    if (partners.length === 0) {
        return <div className="text-slate-500 italic text-center py-8">No partners added yet.</div>;
    }

    return (
        <div className="space-y-4">
            {partners.map(partner => (
                <PartnerItem key={partner.id} partner={partner} />
            ))}
        </div>
    );
}

function PartnerItem({ partner }: { partner: PartnerData }) {
    const [expanded, setExpanded] = useState(true);
    const isCoordinator = partner.role === 'Coordinator';

    return (
        <Card className={clsx(
            "transition-all border-l-4",
            isCoordinator ? "border-indigo-500" : "border-slate-300"
        )}>
            <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-2 rounded-lg",
                        isCoordinator ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                    )}>
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{partner.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{partner.nation}</span>
                            <span>•</span>
                            <span className={clsx(
                                "font-medium",
                                isCoordinator ? "text-indigo-600" : "text-slate-500"
                            )}>{partner.role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <CreateUserButton partnerId={partner.id} />
                     <DeleteButton 
                        id={partner.id} 
                        onDelete={deletePartner.bind(null, partner.id, partner.projectId)} 
                        className="text-slate-400 hover:text-red-500"
                        confirmMessage="Delete this partner and all its users?"
                     />
                     <button className="text-slate-400 ml-2">
                        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 pl-4 border-l-2 border-slate-100 ml-5 space-y-3">
                    {partner.users.length === 0 && (
                        <div className="text-xs text-slate-400 italic py-2">No users added to this partner.</div>
                    )}
                    {partner.users.map(user => (
                        <div key={user.id} className="flex items-center justify-between group py-1">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {user.name.charAt(0)}{user.surname.charAt(0)}
                                 </div>
                                 <div>
                                     <p className="text-sm font-medium text-slate-700">{user.name} {user.surname}</p>
                                     <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Briefcase size={12} />
                                        {user.role}
                                     </div>
                                 </div>
                             </div>
                             <DeleteButton 
                                id={user.id} 
                                onDelete={deleteUser.bind(null, user.id, partner.projectId)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                                confirmMessage="Delete this user?"
                             />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
