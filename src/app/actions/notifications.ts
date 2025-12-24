"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to recent 20
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error: "Failed to mark notification read" };
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    revalidatePath("/dashboard"); // Revalidate broadly
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false, error: "Failed to mark all read" };
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string,
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO"
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        type,
      },
    });
    return { success: true, data: notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}
