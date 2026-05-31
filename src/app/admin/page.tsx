import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getManagedPricing, getManagedTools } from "@/lib/admin-store";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-token";
import { getProviderStatus } from "@/lib/providers";
import { getUsageStats } from "@/lib/usage";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Secure ToolVerse AI admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);

  if (session?.role !== "admin") {
    redirect("/admin/login");
  }

  const [managedTools, stats, providers, pricingPlans] = await Promise.all([
    getManagedTools(),
    getUsageStats(),
    getProviderStatus(),
    getManagedPricing(),
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
