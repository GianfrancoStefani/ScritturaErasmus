import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users } from "lucide-react";
import { PartnerDirectory } from "@/components/partners/PartnerDirectory";

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
    const allPartners = await prisma.partner.findMany({
        include: {
            project: {
                select: { id: true, title: true, acronym: true }
            },
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Fetch projects for the "Add Partner" modal
    const allProjects = await prisma.project.findMany({
        where: { isTemplate: false },
        select: { id: true, title: true, acronym: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-indigo-600" /> Partners Directory
                    </h1>
                    <p className="text-slate-500 mt-1 max-w-2xl">
                        Manage all partners across projects. Use the "Add Partner" button to register a new partner for a specific project.
                    </p>
                </div>
            </div>

            <PartnerDirectory partners={allPartners} projects={allProjects} />
        </div>
    );
}
