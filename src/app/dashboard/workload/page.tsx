import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, BarChart3, PieChart, Users } from "lucide-react";

export default async function WorkloadDashboard() {
    const projects = await prisma.project.findMany({
        where: { isTemplate: false },
        include: {
            partners: true,
            works: {
                include: {
                    tasks: {
                        include: {
                            assignments: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold text-slate-900">Workload Dashboard</h1>
                     <p className="text-slate-500">Overview of resource allocation across projects.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {projects.map(project => {
                    const totalBudget = project.partners.reduce((sum, p) => sum + p.budget, 0);
                    let allocatedCost = 0;
                    let allocatedDays = 0;

                    const partnerStats = new Map<string, { name: string, days: number, cost: number, users: Map<string, {name:string, days: number, cost: number}> }>();

                    // Initialize partners
                    project.partners.forEach(p => {
                        partnerStats.set(p.id, { name: p.name, days: 0, cost: 0, users: new Map() });
                    });

                    // Aggregate Assignments
                    project.works.forEach(work => {
                        work.tasks.forEach(task => {
                            task.assignments.forEach(assignment => {
                                allocatedDays += assignment.days;
                                const cost = assignment.days * (assignment.dailyRate || 0); // Need to fetch dailyRate if null from StandardCost or User override
                                allocatedCost += cost;

                                const partnerId = assignment.user.partnerId; // Legacy link (User -> Partner)
                                
                                if (partnerId && partnerStats.has(partnerId)) {
                                    const pStat = partnerStats.get(partnerId)!;
                                    pStat.days += assignment.days;
                                    pStat.cost += cost;
                                    
                                    const userId = assignment.userId;
                                    if (!pStat.users.has(userId)) {
                                        pStat.users.set(userId, { name: `${assignment.user.name} ${assignment.user.surname}`, days: 0, cost: 0 });
                                    }
                                    const uStat = pStat.users.get(userId)!;
                                    uStat.days += assignment.days;
                                    uStat.cost += cost;
                                }
                            });
                        });
                    });

                    const progress = totalBudget > 0 ? (allocatedCost / totalBudget) * 100 : 0;

                    return (
                        <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{project.acronym} - {project.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {project.partners.length} Partners</div>
                                        <div className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> {allocatedDays.toFixed(1)} Days Allocated</div>
                                        <div className="flex items-center gap-1"><PieChart className="w-4 h-4" /> {progress.toFixed(1)}% Budget Used</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-800">€ {allocatedCost.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">of € {totalBudget.toLocaleString()} Budget</div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Partner Breakdown</h3>
                                <div className="space-y-4">
                                    {Array.from(partnerStats.values()).map((p, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                                           <div className="flex justify-between items-center mb-2">
                                               <div className="font-semibold text-slate-800">{p.name}</div>
                                               <div className="text-sm">
                                                   <span className="font-medium text-slate-700">{p.days.toFixed(1)} days</span>
                                                   <span className="text-slate-400 mx-2">|</span>
                                                   <span className="text-slate-600">€ {p.cost.toLocaleString()}</span>
                                               </div>
                                           </div>
                                           
                                           {/* User Breakdown Bar */}
                                           <div className="space-y-1">
                                                {Array.from(p.users.values()).map((u, uIdx) => (
                                                    <div key={uIdx} className="flex items-center justify-between text-xs text-slate-500 pl-4 py-1 border-l-2 border-slate-100 hover:border-blue-500 transition-colors">
                                                        <span>{u.name}</span>
                                                        <span>{u.days.toFixed(1)} d - € {u.cost.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                {p.users.size === 0 && <div className="text-xs text-slate-400 pl-4 italic">No assignments</div>}
                                           </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
