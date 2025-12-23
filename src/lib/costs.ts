import prisma from "@/lib/prisma";

const DEFAULT_DAYS_PER_MONTH = 21.5;

/**
 * Calculates the effective costs for a project member.
 * Returns both Daily Rate and Estimated Monthly Cost.
 */
export async function getEffectiveCost(memberId: string) {
    const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: {
            partner: true
        }
    });

    if (!member) return null;

    let dailyRate = 0;
    let source = 'NONE';
    let details = 'No cost found.';

    // 1. Override
    if (member.customDailyRate !== null && member.customDailyRate !== undefined) {
        dailyRate = member.customDailyRate;
        source = 'CUSTOM';
        details = 'Custom Project Overrides';
    } 
    // 2. Standard Grid
    else {
        // Match on Nation and Job Title (projectRole) or Generic Role (role)
        const roleToMatch = member.projectRole || "Researcher"; // Default to Researcher if nothing specified?
        // Or strictly match 'role' if it was reliable. 'role' is currently 'Partner' or 'Coordinator'.
        // The seed uses "Researcher".
        
        const standard = await prisma.standardCost.findFirst({
            where: {
                nation: member.partner.nation,
                role: "Researcher" // For now, hardcode to Researcher as user only gave 1 rate set.
                // In future, use member.projectRole if it matches a standard role.
            }
        });

        if (standard) {
            dailyRate = standard.dailyRate;
            source = 'STANDARD';
            details = `${standard.nation} (Group ${standard.area})`;
        }
    }

    return {
        dailyRate,
        monthlyCost: dailyRate * DEFAULT_DAYS_PER_MONTH,
        source,
        details
    };
}
