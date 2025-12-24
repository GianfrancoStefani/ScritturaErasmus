import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, BarChart3, PieChart, Users } from "lucide-react";

export default async function WorkloadDashboard() {
    const projects = await prisma.project.findMany({
        where: { isTemplate: false },
        include: {
            partners: true,
            timesheets: true, // Fetch Actuals
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
                     <h1 className="text-3xl font-bold text-slate-900">Workload Analytics</h1>
                     <p className="text-slate-500">Plan vs Actual resource allocation and budget variance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {projects.map(project => {
                    const totalBudget = project.partners.reduce((sum, p) => sum + p.budget, 0);
                    let allocatedCost = 0;
                    let allocatedDays = 0;
                    let actualHoursTotal = 0;

                    // Data Structure: Partner -> User -> Stats
                    const partnerStats = new Map<string, { 
                        name: string, 
                        days: number, 
                        cost: number, 
                        actualHours: number,
                        users: Map<string, {name:string, days: number, cost: number, actualHours: number}> 
                    }>();

                    // Initialize partners
                    project.partners.forEach(p => {
                        partnerStats.set(p.id, { name: p.name, days: 0, cost: 0, actualHours: 0, users: new Map() });
                    });

                    // 1. Aggregate Planned (Assignments)
                    project.works.forEach((work: any) => {
                        work.tasks.forEach((task: any) => {
                            task.assignments.forEach((assignment: any) => {
                                allocatedDays += assignment.days;
                                const cost = assignment.days * (assignment.dailyRate || 0); 
                                allocatedCost += cost;

                                const partnerId = assignment.user.partnerId;
                                
                                if (partnerId && partnerStats.has(partnerId)) {
                                    const pStat = partnerStats.get(partnerId)!;
                                    pStat.days += assignment.days;
                                    pStat.cost += cost;
                                    
                                    const userId = assignment.userId;
                                    if (!pStat.users.has(userId)) {
                                        pStat.users.set(userId, { name: `${assignment.user.name} ${assignment.user.surname}`, days: 0, cost: 0, actualHours: 0 });
                                    }
                                    const uStat = pStat.users.get(userId)!;
                                    uStat.days += assignment.days;
                                    uStat.cost += cost;
                                }
                            });
                        });
                    });

                    // 2. Aggregate Actuals (Timesheets)
                    project.timesheets.forEach((entry: any) => {
                        actualHoursTotal += entry.hours;
                        
                        // We need to find which Partner this user belongs to in this project context.
                        // Since we don't have user->partner link in TimesheetEntry directly, we infer from Project Partners list 
                        // or existing assignments. for now, let's try to match via the initialized partnerStats which has users from assignments.
                        // If a user has NO assignment but logs time, we might miss them if we define scope strictly by assignments.
                        // Better approach: Find user in project.partners.users? But `project.partners` query didn't include users.
                        
                        // Heuristic: iterate partners to find if user is there? Too slow.
                        // For now, attach to existing user bucket if found.
                        
                        let found = false;
                        for (const [pId, pStat] of partnerStats.entries()) {
                             if (pStat.users.has(entry.userId)) {
                                 pStat.users.get(entry.userId)!.actualHours += entry.hours;
                                 pStat.actualHours += entry.hours;
                                 found = true;
                                 break;
                             }
                        }
                        
                        // If not found (User has no assignment but logged time), we skip for now or need a "Unassigned" bucket.
                        // Simplification for MVP: Only track Actuals for Assigned Users.
                    });

                    const progress = totalBudget > 0 ? (allocatedCost / totalBudget) * 100 : 0;
                    const hoursProgress = (allocatedDays * 8) > 0 ? (actualHoursTotal / (allocatedDays * 8)) * 100 : 0;

                    return (
                        <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                        {project.acronym} 
                                        {actualHoursTotal > (allocatedDays * 8) && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Over Budget</span>}
                                    </h2>
                                    <div className="flex items-center gap-6 mt-3 text-sm text-slate-500">
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase font-semibold">Planned</span>
                                            <span className="font-mono text-slate-700">{allocatedDays.toFixed(1)} Days</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase font-semibold">Actual</span>
                                            <span className="font-mono text-emerald-600">{actualHoursTotal.toFixed(1)} Hours ({ (actualHoursTotal/8).toFixed(1) } days)</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase font-semibold">Variance</span>
                                            <span className={`font-mono ${(allocatedDays * 8 - actualHoursTotal) < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                                {(allocatedDays * 8 - actualHoursTotal).toFixed(1)} h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-800">€ {allocatedCost.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">Allocated of € {totalBudget.toLocaleString()}</div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase mb-2 px-4">
                                    <div className="col-span-4">Partner / User</div>
                                    <div className="col-span-2 text-right">Planned (Days)</div>
                                    <div className="col-span-2 text-right">Actual (Hours)</div>
                                    <div className="col-span-2 text-right">Utilization</div>
                                    <div className="col-span-2 text-right">Cost</div>
                                </div>

                                <div className="space-y-4">
                                    {Array.from(partnerStats.values()).map((p, idx) => {
                                        const pPlannedHours = p.days * 8;
                                        const pUtil = pPlannedHours > 0 ? (p.actualHours / pPlannedHours) * 100 : 0;
                                        
                                        return (
                                        <div key={idx} className="border rounded-lg overflow-hidden">
                                           <div className="flex items-center p-4 bg-slate-50/50">
                                               <div className="grid grid-cols-12 gap-4 w-full items-center">
                                                   <div className="col-span-4 font-semibold text-slate-800">{p.name}</div>
                                                   <div className="col-span-2 text-right font-mono text-sm">{p.days.toFixed(1)} d</div>
                                                   <div className="col-span-2 text-right font-mono text-sm text-emerald-600">{p.actualHours.toFixed(1)} h</div>
                                                   <div className="col-span-2 text-right">
                                                       <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${pUtil > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pUtil, 100)}%` }}></div>
                                                       </div>
                                                       <div className="text-[10px] text-slate-400 mt-1">{pUtil.toFixed(0)}%</div>
                                                   </div>
                                                   <div className="col-span-2 text-right text-sm text-slate-600">€ {p.cost.toLocaleString()}</div>
                                               </div>
                                           </div>
                                           
                                           {/* User Breakdown */}
                                           <div className="border-t border-slate-100 divide-y divide-slate-100">
                                                {Array.from(p.users.values()).map((u, uIdx) => {
                                                    const uPlannedHours = u.days * 8;
                                                    const uUtil = uPlannedHours > 0 ? (u.actualHours / uPlannedHours) * 100 : 0;
                                                    
                                                    return (
                                                    <div key={uIdx} className="grid grid-cols-12 gap-4 px-4 py-2 hover:bg-slate-50 transition-colors text-sm">
                                                        <div className="col-span-4 flex items-center gap-2 pl-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                            <span className="text-slate-600">{u.name}</span>
                                                        </div>
                                                        <div className="col-span-2 text-right text-slate-500">{u.days.toFixed(1)}</div>
                                                        <div className="col-span-2 text-right font-mono text-emerald-600">{u.actualHours.toFixed(1)}</div>
                                                        <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                                            <span className={`text-xs ${uUtil > 100 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{uUtil.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="col-span-2 text-right text-slate-400">€ {u.cost.toLocaleString()}</div>
                                                    </div>
                                                )})}
                                                {p.users.size === 0 && <div className="text-xs text-slate-400 p-4 italic text-center">No assignments</div>}
                                           </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
