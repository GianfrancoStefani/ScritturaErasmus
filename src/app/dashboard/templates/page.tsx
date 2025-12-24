import prisma from "@/lib/prisma";
import { TemplateGallery } from "@/components/dashboard/TemplateGallery";

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
    const templates = await prisma.project.findMany({
        where: { isTemplate: true },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { modules: true, works: true } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Template Gallery</h1>
                    <p className="text-slate-500">Start new projects from pre-defined structures</p>
                </div>
            </div>

            <TemplateGallery templates={templates} />
        </div>
    );
}
