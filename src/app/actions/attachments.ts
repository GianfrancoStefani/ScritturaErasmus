"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadFile } from "./upload";

export async function createAttachment(moduleId: string, formData: FormData) {
    // 1. Upload the file
    // Note: uploadFile expects formData with "file". 
    // We pass the same formData.
    const uploadRes = await uploadFile(formData);

    if (uploadRes.error || !uploadRes.success) {
        return { error: uploadRes.error || "Upload failed" };
    }

    try {
        // 2. Create DB Record
        const attachment = await prisma.attachment.create({
            data: {
                moduleId,
                url: uploadRes.url!,
                name: uploadRes.name!,
                size: uploadRes.size || 0,
                mimeType: uploadRes.type || "application/octet-stream"
            }
        });

        revalidatePath(`/dashboard/projects`); // broad revalidation or specific
        return { success: true, attachment };
    } catch (error) {
        console.error("Attachment DB Error:", error);
        return { error: "Database error saving attachment" };
    }
}

export async function createLinkAttachment(moduleId: string, name: string, url: string) {
    try {
        const attachment = await prisma.attachment.create({
            data: {
                moduleId,
                url,
                name,
                size: 0,
                mimeType: "item/url" // Custom type for links
            }
        });
        revalidatePath(`/dashboard/projects`);
        return { success: true, attachment };
    } catch (error) {
        return { error: "Failed to save link" };
    }
}

export async function deleteAttachment(attachmentId: string) {
    try {
        await prisma.attachment.delete({
            where: { id: attachmentId }
        });
        revalidatePath(`/dashboard/projects`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete attachment" };
    }
}

export async function getAttachments(moduleId: string) {
    try {
        const attachments = await prisma.attachment.findMany({
            where: { moduleId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, attachments };
    } catch (error) {
        return { error: "Failed to fetch attachments", attachments: [] };
    }
}
