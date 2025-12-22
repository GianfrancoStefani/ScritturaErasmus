"use server";

import prisma from "@/lib/prisma";
import { format, addDays } from "date-fns";

export async function generateProjectReport(projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            partners: true,
            works: {
                include: {
                    tasks: {
                        include: {
                            assignments: true,
                            modules: true
                        }
                    }
                }
            }
        }
    });

    if (!project) return { error: "Project not found" };

    // 1. Progress Stats
    let totalModules = 0;
    let completedModules = 0;
    let totalProgress = 0;

    // 2. Budget Stats
    let totalBudget = 0; // Total Project Budget (Sum of partners or works?)
    // Works have budget field. Partners have budget field. Usually Project Budget = Sum(Partners).
    // Let's use Sum(Partners) as Total and Sum(Assigned) as consumed.

    const partnerBudget = project.partners.reduce((sum, p) => sum + p.budget, 0);
    let assignedCost = 0;

    // 3. Upcoming Tasks
    const upcomingTasks: any[] = [];
    const now = new Date();
    const nextWeek = addDays(now, 7);

    project.works.forEach(work => {
        work.tasks.forEach(task => {
            // Check modules for progress
            task.modules.forEach(mod => {
                totalModules++;
                if (mod.status === 'AUTHORIZED' || mod.status === 'DONE') completedModules++;
                totalProgress += (mod.completion || 0);
            });

            // Check assignments for cost
            task.assignments.forEach(ass => {
                assignedCost += (ass.days * (ass.dailyRate || 0));
            });

            // Check dates
            if (task.startDate >= now && task.startDate <= nextWeek) {
                upcomingTasks.push({ title: task.title, date: task.startDate });
            }
        });
    });

    const globalProgress = totalModules > 0 ? Math.round(totalProgress / totalModules) : 0;

    // Generate HTML Report
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #4f46e5;">Weekly Report: ${project.acronym}</h1>
            <p><strong>Date:</strong> ${format(now, "PPP")}</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 10px; background: #f8fafc; border-radius: 8px;">
                        <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Progress</div>
                        <div style="font-size: 24px; font-weight: bold; color: #0f172a;">${globalProgress}%</div>
                        <div style="font-size: 14px; color: #64748b;">${completedModules}/${totalModules} Modules Done</div>
                    </td>
                    <td style="width: 20px;"></td>
                    <td style="padding: 10px; background: #f8fafc; border-radius: 8px;">
                        <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Budget Assigned</div>
                        <div style="font-size: 24px; font-weight: bold; color: #0f172a;">€${assignedCost.toLocaleString()}</div>
                        <div style="font-size: 14px; color: #64748b;">of €${partnerBudget.toLocaleString()} Total</div>
                    </td>
                </tr>
            </table>

            <h3>📅 Upcoming Tasks (Next 7 Days)</h3>
            ${upcomingTasks.length > 0 ? `
                <ul style="padding-left: 20px;">
                    ${upcomingTasks.map(t => `<li><strong>${t.title}</strong> - ${format(new Date(t.date), 'MMM d')}</li>`).join('')}
                </ul>
            ` : `<p style="font-style: italic; color: #999;">No tasks starting this week.</p>`}

            <h3>✅ Modules Status</h3>
            <p style="font-size: 14px;">Total modules in pipeline: ${totalModules}. Verify "Export" section for full document.</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; font-size: 12px; color: #1e40af;">
                Generated automatically by ErasmUS+ Manager.
            </div>
        </div>
    `;

    return { success: true, reportHtml: html };
}
