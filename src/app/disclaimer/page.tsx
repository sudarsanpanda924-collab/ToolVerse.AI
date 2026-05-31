import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "ToolVerse AI disclaimer for AI-generated content, calculators, converters, and third-party providers.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      title="Important limits of AI and utility tools"
      intro="ToolVerse AI is built to make everyday digital work easier, but every generated or calculated result should be reviewed before use."
      sections={[
        {
          heading: "AI output accuracy",
          body: "AI tools may produce confident but incorrect text, summaries, titles, scores, or recommendations. Always verify facts, citations, platform rules, and sensitive claims before publishing.",
        },
        {
          heading: "Finance and business calculators",
          body: "Calculators provide quick estimates only. Tax, payroll, valuation, EMI, GST, ROI, and pricing outputs should be checked with qualified professionals or official sources where needed.",
        },
        {
          heading: "File conversion and OCR",
          body: "Converters and OCR tools can lose formatting, metadata, image quality, or text accuracy depending on the source file. Keep original files and inspect results before sharing them.",
        },
        {
          heading: "Third-party services",
          body: "AI and media features may call providers such as Gemini, Groq, OpenRouter, Pollinations, Hugging Face, or Firebase. Availability and quality can vary by provider status and configuration.",
        },
      ]}
    />
  );
}
