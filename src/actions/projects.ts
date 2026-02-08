"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getProjects() {
  const userId = await getUserId();
  return db.project.findMany({
    where: { userId },
    include: { _count: { select: { audits: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(id: string) {
  const userId = await getUserId();
  const project = await db.project.findFirst({
    where: { id, userId },
    include: {
      audits: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) throw new Error("Project not found");
  return project;
}

export async function createProject(name: string, description?: string) {
  const userId = await getUserId();
  const project = await db.project.create({
    data: { name, description, userId },
  });
  revalidatePath("/dashboard");
  return project;
}

export async function deleteProject(id: string) {
  const userId = await getUserId();
  await db.project.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
