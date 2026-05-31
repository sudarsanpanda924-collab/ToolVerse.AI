import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getManagedPricing, getManagedTools } from "@/lib/admin-store";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-token";
import { getProviderStatus } from "@/lib/providers";
import { getUsageStats, type UsageStats } from "@/lib/usage";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Secure ToolVerse AI admin dashboard.",
};

export const dynamic = "force-dynamic";

const emptyUsageStats: UsageStats = {
  totalUsers: 0,
  totalAiUses: 0,
  totalNonAiUses: 0,
  todayAiUses: 0,
  todayUsers: 0,
};

async function loadAdminData<T>(label: string, loader: () => Promise<T>, fallback: T) {
  try {
    return await loader();
  } catch (error) {
    console.error(`[ToolVerse] Admin ${label} load failed`, error);
    return fallback;
  }
}

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);

  if (session?.role !== "admin") {
    redirect("/admin/login");
  }

  const [managedTools, stats, providers, pricingPlans] = await Promise.all([
    loadAdminData("tools", getManagedTools, []),
    loadAdminData("usage stats", getUsageStats, emptyUsageStats),
    loadAdminData("provider status", getProviderStatus, []),
    loadAdminData("pricing plans", getManagedPricing, []),
  ]);

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard
          initialTools={managedTools}
          stats={stats}
          providers={providers}
          pricingPlans={pricingPlans}
        />
      </div>
    </section>
  );
}
