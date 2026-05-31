import "server-only";

import { pricingPlans, type PricingPlan } from "@/config/pricing";
import { tools } from "@/config/tools";
import { getFirestoreAdmin } from "@/lib/firebase-admin";

export type ManagedTool = {
  slug: string;
  name: string;
  category: string;
  isAI: boolean;
  provider: string;
  enabled: boolean;
};

type PricingSetting = PricingPlan & {
  enabled: boolean;
};

const memoryToolSettings = new Map<string, boolean>();
const memoryPricingSettings = new Map<string, PricingSetting>();

export async function getManagedTools(): Promise<ManagedTool[]> {
  const db = getFirestoreAdmin();
  const enabledBySlug = new Map<string, boolean>();

  if (db) {
    const snapshot = await db.collection("admin_tool_settings").get();
    snapshot.docs.forEach((doc) => {
      enabledBySlug.set(doc.id, doc.data().enabled !== false);
    });
  } else {
    memoryToolSettings.forEach((enabled, slug) => enabledBySlug.set(slug, enabled));
  }

  return tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    category: tool.category,
    isAI: tool.isAI,
    provider: tool.provider,
    enabled: enabledBySlug.get(tool.slug) ?? true,
  }));
}

export async function isToolEnabled(slug: string) {
  const managedTools = await getManagedTools();
  return managedTools.find((tool) => tool.slug === slug)?.enabled ?? true;
}

export async function setToolEnabled(slug: string, enabled: boolean) {
  const db = getFirestoreAdmin();
  if (db) {
    await db.collection("admin_tool_settings").doc(slug).set(
      {
        enabled,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } else {
    memoryToolSettings.set(slug, enabled);
  }

  return getManagedTools();
}

export async function getManagedPricing(): Promise<PricingSetting[]> {
  const db = getFirestoreAdmin();
  const map = new Map(pricingPlans.map((plan) => [plan.id, { ...plan, enabled: true }]));

  if (db) {
    const snapshot = await db.collection("admin_pricing_settings").get();
    snapshot.docs.forEach((doc) => {
      const current = map.get(doc.id);
      if (current) map.set(doc.id, { ...current, ...doc.data() });
    });
  } else {
    memoryPricingSettings.forEach((plan, id) => map.set(id, plan));
  }

  return [...map.values()];
}

export async function updatePricingPlan(
  id: string,
  updates: Partial<Pick<PricingSetting, "price" | "description" | "enabled">>,
) {
  const db = getFirestoreAdmin();
  if (db) {
    await db.collection("admin_pricing_settings").doc(id).set(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } else {
    const current =
      memoryPricingSettings.get(id) ||
      ({ ...pricingPlans.find((plan) => plan.id === id), enabled: true } as PricingSetting);
    memoryPricingSettings.set(id, { ...current, ...updates });
  }

  return getManagedPricing();
}
