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
                    <p className="text-slate-500 mt-1 max-w-2xl">
                        This is the global registry of all partners associated with any project. 
                        To manage partners (add/edit) for a specific project, please navigate to that project's dashboard or use the "Project" link on a partner card.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPartners.map(partner => (
                    <div key={partner.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-600">
                                {partner.logo && (partner.logo.startsWith('http') || partner.logo.startsWith('/')) ? (
                                    <img 
                                        src={partner.logo} 
                                        alt={partner.name} 
                                        className="w-full h-full object-cover rounded-lg" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerText = partner.name[0];
                                        }}
                                    />
                                ) : (
                                    partner.name[0]
                                )}
                             </div>
                             <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">
                                {partner.type}
                             </span>
                        </div>
                        
                        <Link href={`/dashboard/partners/${partner.id}`} className="hover:text-indigo-600 transition-colors">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.name}</h3>
                        </Link>
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
                             <div className="pt-2">
                                <Link href={`/dashboard/partners/${partner.id}`} className="block w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium py-2 rounded-lg transition-colors">
                                    View Organization Structure
                                </Link>
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
