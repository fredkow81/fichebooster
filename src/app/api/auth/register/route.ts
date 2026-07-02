import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { handleApiError, jsonError } from "@/lib/api/response";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("Un compte existe déjà avec cet email.", 409);
    }

    const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true } });
    if (!defaultPlan) {
      return jsonError("Aucun plan par défaut configuré. Contactez le support.", 500);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const role = env.ADMIN_EMAILS.includes(email.toLowerCase()) ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        subscription: { create: { planId: defaultPlan.id, status: "ACTIVE" } },
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
