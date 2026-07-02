import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/api/session";
import { requireOwnedOptimization } from "@/lib/api/optimization-access";
import { prisma } from "@/lib/prisma";
import { OptimizationEditor } from "./optimization-editor";

export default async function OptimizationPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const owned = await requireOwnedOptimization(params.id, userId).catch(() => null);
  if (!owned) notFound();

  const full = await prisma.productOptimization.findUnique({
    where: { id: params.id },
    include: { snapshot: true, keywordRecommendation: true, internalLinks: true },
  });
  if (!full) notFound();

  return <OptimizationEditor optimization={JSON.parse(JSON.stringify(full))} />;
}
