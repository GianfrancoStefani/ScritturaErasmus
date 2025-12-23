import prisma from "@/lib/prisma";

export async function calculateUserWorkload(userId: string, month: number, year: number) {
    // 1. Get Availability (Capacity)
    const availability = await prisma.userAvailability.findFirst({
        where: {
            userId,
            year
        }
    });

    if (!availability) {
        return {
            capacity: 0,
            load: 0,
            percentage: 0,
            status: 'UNKNOWN' as const
        };
    }

    // Map month (1-12) to field (daysJan, etc.)
    const months = [
        'daysJan', 'daysFeb', 'daysMar', 'daysApr', 'daysMay', 'daysJun',
        'daysJul', 'daysAug', 'daysSep', 'daysOct', 'daysNov', 'daysDec'
    ];
    // @ts-ignore - Dynamic access
    const monthlyCapacity = availability[months[month - 1]] || 0;

    if (monthlyCapacity === 0) {
        return {
            capacity: 0,
            load: 0,
            percentage: 100, // No capacity = overflow if any load, but 0 load = 0%? 
            // Better to say 0 capacity.
            status: 'NO_CAPACITY' as const
        };
    }

    // 2. Get Assignments (Load)
    const assignments = await prisma.assignment.findMany({
        where: { userId }
    });

    // Format target month key: "YYYY-MM"
    const monthStr = month.toString().padStart(2, '0');
    const targetKey = `${year}-${monthStr}`; // e.g. "2025-01"

    let currentLoad = 0;

    for (const assignment of assignments) {
        if (!assignment.months) continue;
        
        try {
            // Parse JSON months: ["2025-01", "2025-02"]
            const activeMonths: string[] = JSON.parse(assignment.months);
            
            if (activeMonths.includes(targetKey)) {
                // Distribute days evenly across active months
                // Assuming 'assignment.days' is TOTAL days for the task
                const monthlyLoad = assignment.days / activeMonths.length;
                currentLoad += monthlyLoad;
            }
        } catch (e) {
            console.error("Error parsing assignment months", e);
        }
    }

    const percentage = monthlyCapacity > 0 ? (currentLoad / monthlyCapacity) * 100 : (currentLoad > 0 ? 999 : 0);

    let status: 'OK' | 'WARNING' | 'OVERLOAD' | 'NO_CAPACITY' = 'OK';
    if (percentage > 100) status = 'OVERLOAD';
    else if (percentage > 85) status = 'WARNING';
    else if (monthlyCapacity === 0 && currentLoad > 0) status = 'NO_CAPACITY';

    return {
         capacity: monthlyCapacity,
         load: currentLoad,
         percentage,
         status
    };
}
