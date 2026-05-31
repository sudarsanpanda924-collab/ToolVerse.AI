import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure admin login for ToolVerse AI.",
};

export default function AdminLoginPage() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <LoginForm />
    </section>
  );
}
