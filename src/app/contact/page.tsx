import type { Metadata } from "next";
import { ContactPageClient } from "@/components/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact ToolVerse AI",
  description:
    "Contact ToolVerse AI for support, bug reports, feature requests, API issues, business inquiries, and partnerships.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
