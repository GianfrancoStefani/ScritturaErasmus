"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file uploaded" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique name
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = uniquePrefix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  
  // NOTE: In production, upload to S3/Blob. This is local only.
  const path = join(process.cwd(), "public/uploads", filename);

  try {
    await writeFile(path, buffer);
    const url = `/uploads/${filename}`;
    return { 
        success: true, 
        url,
        name: file.name,
        size: file.size,
        type: file.type
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Upload failed" };
  }
}
