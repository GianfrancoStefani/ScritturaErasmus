import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Mail, Globe, MapPin, Building, ArrowLeft } from "lucide-react";
import { clsx } from "clsx";

export const dynamic = 'force-dynamic';

async function getPartnerWithMembers(id: string) {
    const partner = await prisma.partner.findUnique({
        where: { id },
        include: {
            project: { select: { id: true, title: true, acronym: true } },
            // Fetch Project Members associated with this partner
            projectMembers: {
                include: {
                    user: true
                },
                orderBy: { role: 'asc' }
            },
            // Fetch Users directly attached (if any)
            users: true 
        }
    });
    return partner;
}

export default async function PartnerDetailsPage({ params }: { params: { id: string } }) {
    const partner = await getPartnerWithMembers(params.id);

    if (!partner) notFound();

    // Merge members (prioritize projectMembers, but also include direct users if not in projectMembers?)
    // Actually, ProjectMembers are the active participants.
    const members = partner.projectMembers;

    return (
        <div className="space-y-8 pb-20">
             {/* Header */}
             <div className="flex flex-col gap-4">
                <Link href="/dashboard/partners" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 w-fit">
                    <ArrowLeft size={16} /> Back to Partners
                </Link>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 bg-indigo-50 rounded-xl flex items-center justify-center text-4xl font-bold text-indigo-600 flex-shrink-0">
                        {partner.logo ? (
                            <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            partner.name[0]
                        )}
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-slate-900">{partner.name}</h1>
                                <span className={clsx("px-2 py-1 rounded text-xs font-bold uppercase", partner.role === 'COORDINATOR' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600")}>
                                    {partner.role}
                                </span>
                            </div>
                            <p className="text-slate-500 text-lg flex items-center gap-2">
                                <Building size={16} /> {partner.type}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-600">
                             {partner.website && (
                                <a href={partner.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-indigo-600">
                                    <Globe size={16} /> {partner.website}
                                </a>
                             )}
                             <div className="flex items-center gap-2">
                                <MapPin size={16} /> {partner.city}, {partner.nation}
                             </div>
                             {partner.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={16} /> {partner.email}
                                </div>
                             )}
                        </div>
                    </div>
                    <div className="min-w-[200px] border-l pl-6 border-slate-100 hidden md:block">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Associated Project</p>
                        <Link href={`/dashboard/projects/${partner.projectId}`} className="font-semibold text-indigo-600 hover:underline">
                            {partner.project.title}
                        </Link>
                        <p className="text-sm text-slate-500 mt-1">({partner.project.acronym})</p>
                    </div>
                </div>
             </div>

             {/* Organization / Members */}
             <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-indigo-600" /> Organization Structure ({members.length})
                </h2>
                
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Project Role</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold text-right">Cost Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {member.user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{member.user.name} {member.user.surname}</p>
                                                <p className="text-xs text-slate-500 capitalize">{member.user.role?.toLowerCase() || 'Member'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {member.user.email}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                                        €{(member.customDailyRate || 0).toFixed(2)} / day
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        No members found for this partner organization.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );
}
