import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { createPortalSession } from "@/lib/stripe/service";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.stripeCustomerId) {
      return jsonError("Aucun abonnement payant actif à gérer.", 422);
    }

    const origin = req.nextUrl.origin;
    const { url } = await createPortalSession(user.stripeCustomerId, `${origin}/billing`);

    return NextResponse.json({ url });
  } catch (err) {
    return handleApiError(err);
  }
}
