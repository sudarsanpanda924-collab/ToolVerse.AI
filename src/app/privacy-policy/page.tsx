import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ToolVerse AI privacy policy covering usage limits, uploaded content, analytics, and server-side API handling.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="How ToolVerse AI handles privacy"
      intro="This policy explains how ToolVerse AI is designed to protect visitors while offering free AI tools, converters, calculators, and utilities."
      sections={[
        {
          heading: "Information we process",
          body: "ToolVerse AI may process tool inputs, uploaded files, selected options, IP-derived hashes, dates, and basic technical logs needed to run tools, prevent abuse, and measure service health. We do not require user accounts in v1.",
        },
        {
          heading: "AI usage limits",
          body: "Free AI usage is limited to 5 generations per day per visitor. The limit is tracked with a one-way IP hash plus date in Firestore or a local development fallback. The raw IP address is not stored by the app logic.",
        },
        {
          heading: "API keys and providers",
          body: "Private provider keys for Gemini, Groq, OpenRouter, Hugging Face, and Firebase service accounts are used only on the server. They are never sent to frontend code or exposed in browser requests.",
        },
        {
          heading: "Uploaded files and content",
          body: "Files and text are used to complete the requested tool action. Production deployments should configure retention, deletion, and provider-specific data handling rules before enabling large file processing.",
        },
        {
          heading: "Advertising readiness",
          body: "The site includes clean placeholders for future ads but does not load real advertising scripts in v1. If AdSense is added later, this policy should be updated with Google advertising disclosures.",
        },
      ]}
    />
  );
}
