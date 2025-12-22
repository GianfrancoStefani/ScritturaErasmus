"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronDown, ChevronRight, User, Building2, Briefcase } from 'lucide-react';
import clsx from 'clsx';

// Mock Data Types
interface UserMock {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface PartnerMock {
  id: string;
  name: string;
  nation: string;
  role: string; // Coordinator vs Partner
  users: UserMock[];
}

const mockPartners: PartnerMock[] = [
  {
    id: 'p1',
    name: 'University of Bologna',
    nation: 'Italy',
    role: 'Coordinator',
    users: [
        { id: 'u1', name: 'Gianfranco Stefani', role: 'Project Manager' },
        { id: 'u2', name: 'Maria Rossi', role: 'Researcher' },
    ]
  },
  {
    id: 'p2',
    name: 'Tech Solutions GmbH',
    nation: 'Germany',
    role: 'Partner',
    users: [
        { id: 'u3', name: 'Hans Mueller', role: 'Developer' },
    ]
  }
];

export function PartnerTree() {
    return (
        <div className="space-y-4">
            {mockPartners.map(partner => (
                <PartnerItem key={partner.id} partner={partner} />
            ))}
        </div>
    );
}

function PartnerItem({ partner }: { partner: PartnerMock }) {
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
                <button className="text-slate-400">
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            {expanded && (
                <div className="mt-4 pl-4 border-l-2 border-slate-100 ml-5 space-y-3">
                    {partner.users.map(user => (
                        <div key={user.id} className="flex items-center gap-3 py-1">
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {user.name.charAt(0)}
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-slate-700">{user.name}</p>
                                 <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Briefcase size={12} />
                                    {user.role}
                                 </div>
                             </div>
                        </div>
                    ))}
                    <div className="pt-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
                        {partner.users.length} Team Members
                    </div>
                </div>
            )}
        </Card>
    );
}
