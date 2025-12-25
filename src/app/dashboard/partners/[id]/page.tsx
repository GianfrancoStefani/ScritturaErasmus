import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Mail, Globe, MapPin, Building, ArrowLeft } from "lucide-react";
import { clsx } from "clsx";
import { PartnerLogo } from "@/components/partners/PartnerLogo";

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
                orderBy: { createdAt: 'asc' }
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

    // Fetch sibling partners (same Organization, different Projects)
    const organizationId = partner.organizationId;
    let siblingPartners: any[] = [];
    
    if (organizationId) {
        siblingPartners = await prisma.partner.findMany({
            where: { 
                organizationId: organizationId,
                id: { not: partner.id } // Exclude current (we'll merge or display current distinct)
            },
            include: {
                project: { select: { id: true, title: true, acronym: true } }
            },
            orderBy: {
                project: { startDate: 'desc' } // Most recent projects first
            }
        });
    }
    
    // Combine for tabs (Current + Siblings)
    const allContexts = [
        { ...partner, isCurrent: true },
        ...siblingPartners.map((p: any) => ({ ...p, isCurrent: false }))
    ].sort((a, b) => a.project.title.localeCompare(b.project.title));

    // Merge members for display...
    const members = partner.projectMembers;

    // Fetch full project data to show ALL partners and members
    const project = await prisma.project.findUnique({
        where: { id: partner.projectId },
        include: {
            partners: {
                include: {
                    projectMembers: {
                        include: { user: true },
                        orderBy: { createdAt: 'asc' }
                    },
                    users: true // Legacy users
                },
                orderBy: { name: 'asc' }
            }
        }
    });

    const projectPartners = project?.partners.map((p: any) => {
        // Merge Logic (Reuse from Project Logic or simplify)
        const projectUsers = p.projectMembers.map((pm: any) => ({ ...pm.user, role: pm.role, projectRole: pm.projectRole, customDailyRate: pm.customDailyRate, projectMemberId: pm.id }));
        const legacyUsers = p.users.map((u: any) => ({ ...u, role: u.role || 'Member', partnerId: p.id }));
        
        // Simple dedupe by ID
        const allUsers = [...projectUsers];
        legacyUsers.forEach((lu: any) => {
            if (!allUsers.find(au => au.id === lu.id)) {
                allUsers.push(lu);
            }
        });
        
        return { ...p, users: allUsers };
    }) || [];

    return (
        <div className="space-y-8 pb-20">
             {/* Header */}
             <div className="flex flex-col gap-4">
                <Link href="/dashboard/partners" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 w-fit">
                    <ArrowLeft size={16} /> Back to Partners
                </Link>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 bg-indigo-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        <PartnerLogo logo={partner.logo} name={partner.name} className="w-full h-full object-cover" />
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
                             {partner.website && <a href={partner.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-indigo-600"><Globe size={16} /> {partner.website}</a>}
                             <div className="flex items-center gap-2"><MapPin size={16} /> {partner.city}, {partner.nation}</div>
                             {partner.email && <div className="flex items-center gap-2"><Mail size={16} /> {partner.email}</div>}
                        </div>
                    </div>
                </div>
             </div>

             {/* PROJECT TABS */}
             {allContexts.length > 1 && (
                 <div className="border-b border-slate-200">
                     <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                         {allContexts.map((context) => (
                             <Link
                                 key={context.id}
                                 href={`/dashboard/partners/${context.id}`}
                                 title={context.project.title}
                                 className={clsx(
                                     context.isCurrent ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                                     'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2'
                                 )}
                             >
                                 <span className={clsx("w-2 h-2 rounded-full", context.isCurrent ? "bg-indigo-600" : "bg-slate-300")} />
                                 {context.project.acronym || context.project.title}
                             </Link>
                         ))}
                     </nav>
                 </div>
             )}

             {/* TEAM MANAGEMENT: Accordions grouped by Partner */}
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-indigo-600" /> Project Team Assignment
                    </h2>
                    {/* Add button to invite new member global? */}
                </div>
                
                {projectPartners.map((p: any) => (
                    <div key={p.id} className={clsx("bg-white rounded-xl border overflow-hidden shadow-sm transition-all", p.id === partner.id ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200")}>
                        <details className="group" open={p.id === partner.id}>
                            <summary className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <PartnerLogo logo={p.logo} name={p.name} className="w-8 h-8 rounded bg-white object-cover shadow-sm" />
                                    <div>
                                        <h3 className="font-bold text-slate-800">{p.name}</h3>
                                        <p className="text-xs text-slate-500">{p.city}, {p.nation}</p>
                                    </div>
                                    <span className="ml-2 text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{p.users.length} Users</span>
                                </div>
                                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">User</th>
                                            <th className="px-6 py-3 font-semibold">Role</th>
                                            <th className="px-6 py-3 font-semibold">Project Role</th>
                                            <th className="px-6 py-3 font-semibold text-right">Daily Rate</th>
                                            <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {p.users.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {u.photo && (u.photo.startsWith('http') || u.photo.startsWith('/')) && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(u.photo) ? (
                                                            <img src={u.photo} alt={`${u.name} ${u.surname}`} className="w-full h-full rounded-full object-cover"/>
                                                        ) : (
                                                            u.name[0]
                                                        )}
                                                    </div>
                                                        <div>
                                                            <div className="font-bold text-slate-700">{u.name} {u.surname}</div>
                                                            <div className="text-xs text-slate-400">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 text-xs">
                                                    {u.role}
                                                </td>
                                                <td className="px-6 py-3">
                                                     <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100">
                                                        {u.projectRole || 'Member'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-600">
                                                    €{(u.customDailyRate || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3 text-right opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <Link href={`/dashboard/projects/${partner.projectId}/team/${u.projectMemberId || u.id}`}>
                                                        <button className="text-xs bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 px-3 py-1 rounded shadow-sm">
                                                            Edit
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {p.users.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No users assigned yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    </div>
                ))}
             </div>
        </div>
    );
}
