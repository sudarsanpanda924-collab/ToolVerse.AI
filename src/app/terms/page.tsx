import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms and conditions for using ToolVerse AI free tools and AI-assisted outputs.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms and Conditions"
      title="Terms for using ToolVerse AI"
      intro="By using ToolVerse AI, visitors agree to use the tools responsibly, review generated outputs, and follow applicable laws and platform policies."
      sections={[
        {
          heading: "Acceptable use",
          body: "Do not use ToolVerse AI to create illegal, harmful, deceptive, abusive, infringing, or privacy-invasive content. Do not attempt to bypass usage limits, attack the service, or extract provider keys.",
        },
        {
          heading: "Generated output",
          body: "AI-generated content can be incomplete or inaccurate. Users are responsible for reviewing outputs before publishing, submitting, or relying on them for business, legal, financial, academic, or professional decisions.",
        },
        {
          heading: "Free and paid plans",
          body: "The free plan includes 45 AI uses per day and unlimited non-AI tools in v1. Pro and Agency plans are listed as launch-ready placeholders and may require account features before public release.",
        },
        {
          heading: "Tool availability",
          body: "Some conversion, OCR, and media workflows depend on third-party APIs, browser capability, or server configuration. ToolVerse AI may change, disable, or improve tools at any time.",
        },
        {
          heading: "Limitation of liability",
          body: "ToolVerse AI is provided as a practical utility platform. The service is not responsible for losses caused by unreviewed outputs, unsupported file formats, provider outages, or misuse of the tools.",
        },
      ]}
    />
  );
}
