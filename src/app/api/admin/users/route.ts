import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            plan: { select: { id: true, key: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
