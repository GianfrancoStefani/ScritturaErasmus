import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, ExternalLink, Briefcase } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
    const allPartners = await prisma.partner.findMany({
        include: {
            project: {
                select: { title: true, acronym: true }
            },
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-indigo-600" /> Partners Directory
                    </h1>
                    <p className="text-slate-500">Global list of all partners across all projects.</p>
                </div>
                {/* 
                  Global Create is tricky because Partner needs a ProjectId. 
                  So we just list them here. To create, go to a Project.
                */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPartners.map(partner => (
                    <div key={partner.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-600">
                                {partner.logo ? (
                                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    partner.name[0]
                                )}
                             </div>
                             <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                                {partner.type}
                             </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.name}</h3>
                        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                            {partner.city}, {partner.nation}
                        </p>

                        <div className="border-t pt-4 space-y-3">
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Briefcase size={14} /> Project
                                </span>
                                <Link href={`/dashboard/projects/${partner.projectId}/partners`} className="text-indigo-600 hover:underline flex items-center gap-1 font-medium truncate max-w-[150px]">
                                    {partner.project.acronym} <ExternalLink size={12} />
                                </Link>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Users size={14} /> Team
                                </span>
                                <span className="font-medium text-slate-900">{partner._count.users} Users</span>
                             </div>
                        </div>
                    </div>
                ))}

                {allPartners.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No partners found. Go to a Project to add partners.
                    </div>
                )}
            </div>
        </div>
    );
}
