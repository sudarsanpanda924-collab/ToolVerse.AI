export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  sections: {
    heading: string;
    body: string;
  }[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const blogArticles: BlogArticle[] = [
  {
    title: "Best Free AI Tools for Creators",
    description:
      "A practical guide to choosing free AI tools for scripts, captions, thumbnails, summaries, and daily creator workflows.",
    category: "Creator AI",
    readTime: "6 min read",
    sections: [
      {
        heading: "Start with repeatable work",
        body: "The best AI tools remove friction from tasks you do every week: planning content, rewriting captions, drafting titles, summarizing notes, and turning rough ideas into usable outlines. Free tools are most valuable when they shorten a workflow without replacing your judgment.",
      },
      {
        heading: "Match the model to the task",
        body: "Fast models are useful for titles, hooks, and variants. Reasoning-focused models are better for summaries, long-form writing, and document review. Image tools should focus on strong prompts and clear style direction before generation.",
      },
      {
        heading: "Keep a human review step",
        body: "Creators should treat AI output as a first draft. Check claims, improve voice, remove generic phrases, and make sure the result matches your audience before publishing.",
      },
    ],
  },
  {
    title: "How to Use AI Writing Tools Safely",
    description:
      "Simple safety habits for using AI writing tools without publishing private, inaccurate, or low-quality content.",
    category: "AI Safety",
    readTime: "5 min read",
    sections: [
      {
        heading: "Do not paste sensitive data",
        body: "Avoid putting private customer details, passwords, legal secrets, medical records, or unreleased financial information into AI tools. Redact details and use placeholders when possible.",
      },
      {
        heading: "Ask for structure, then edit",
        body: "AI writing works best when it creates outlines, options, summaries, and drafts. You should still verify facts, adapt the tone, and add real examples from your own experience.",
      },
      {
        heading: "Use specific prompts",
        body: "A safer prompt includes audience, goal, tone, length, and forbidden claims. The more constraints you provide, the less likely the tool is to invent details.",
      },
    ],
  },
  {
    title: "Best YouTube Title Generator Tips",
    description:
      "Learn how to get stronger YouTube title ideas by combining clarity, curiosity, keywords, and audience intent.",
    category: "YouTube",
    readTime: "6 min read",
    sections: [
      {
        heading: "Lead with the viewer payoff",
        body: "A strong title makes the viewer understand what they will gain. Start with the transformation, surprising result, mistake avoided, or problem solved.",
      },
      {
        heading: "Use curiosity carefully",
        body: "Curiosity improves clicks when it opens a gap without becoming vague. Replace empty hype with a specific tension, comparison, or unexpected finding.",
      },
      {
        heading: "Generate sets, not singles",
        body: "Ask for multiple title angles: search-focused, curiosity-led, beginner-friendly, contrarian, and story-based. Then test the best candidates against the thumbnail.",
      },
    ],
  },
  {
    title: "How to Improve YouTube CTR",
    description:
      "A practical CTR checklist for improving thumbnails, titles, packaging, and viewer expectation before publishing.",
    category: "YouTube",
    readTime: "7 min read",
    sections: [
      {
        heading: "Make the promise visible",
        body: "The title and thumbnail should communicate one clear promise. If the viewer has to decode the idea, the click usually goes elsewhere.",
      },
      {
        heading: "Reduce visual noise",
        body: "Use fewer words, stronger contrast, one focal subject, and a readable composition at small sizes. A thumbnail must work on a phone first.",
      },
      {
        heading: "Align title and thumbnail",
        body: "CTR improves when the title and thumbnail add to each other instead of repeating the same words. One should create context while the other creates emotion or proof.",
      },
    ],
  },
  {
    title: "Free PDF Tools Every Student Needs",
    description:
      "A student-friendly list of PDF tools for compressing, merging, extracting text, counting words, and summarizing documents.",
    category: "PDF",
    readTime: "5 min read",
    sections: [
      {
        heading: "Compress before sharing",
        body: "Large PDFs can be hard to upload to college portals or email. A compressor helps reduce file size while keeping the document readable.",
      },
      {
        heading: "Extract text for studying",
        body: "Text extraction and OCR tools help turn scanned notes into searchable material. Always review the extracted text for errors before citing it.",
      },
      {
        heading: "Summarize with context",
        body: "AI summaries are useful for revision, but students should still read the original document. Use summaries to locate key sections, not to replace learning.",
      },
    ],
  },
  {
    title: "Image Converter Tools Explained",
    description:
      "Understand JPG, PNG, WEBP, SVG, compression, resizing, and when each image format makes sense.",
    category: "Images",
    readTime: "6 min read",
    sections: [
      {
        heading: "Choose the right format",
        body: "JPG is useful for photos, PNG works well for transparency, WEBP offers strong compression, and SVG is best for scalable vector graphics like icons and logos.",
      },
      {
        heading: "Resize before compressing",
        body: "Most oversized images are too large in dimensions before they are too large in quality. Resize to the display size first, then compress for web delivery.",
      },
      {
        heading: "Keep originals safe",
        body: "When converting or compressing, keep a copy of the original. Conversion can remove metadata, transparency, or fine detail depending on the format.",
      },
    ],
  },
  {
    title: "How AI Tools Help Small Businesses",
    description:
      "Ways small businesses can use AI tools for sales copy, invoices, pricing, customer replies, and content planning.",
    category: "Business",
    readTime: "6 min read",
    sections: [
      {
        heading: "Improve everyday communication",
        body: "AI can help draft proposals, product descriptions, email replies, ad variants, and social posts. This gives small teams a faster starting point without hiring a full content team.",
      },
      {
        heading: "Support financial decisions",
        body: "Calculators for margins, taxes, ROI, subscription revenue, and break-even points help owners understand tradeoffs before changing prices or launching campaigns.",
      },
      {
        heading: "Keep approvals human",
        body: "Business owners should approve final copy, pricing, and customer-facing claims. AI can accelerate the draft, but accountability stays with the business.",
      },
    ],
  },
  {
    title: "Best Instagram Caption Ideas",
    description:
      "Caption frameworks for launches, education, personal brands, reels, carousels, and community posts.",
    category: "Instagram",
    readTime: "5 min read",
    sections: [
      {
        heading: "Use a clear opening line",
        body: "The first line should stop the scroll with a useful promise, relatable problem, strong opinion, or specific result. Avoid filler intros.",
      },
      {
        heading: "Make the caption scannable",
        body: "Short paragraphs, simple language, and one call to action make captions easier to read. Carousels can use the caption for context while reels can use it for extra value.",
      },
      {
        heading: "Rotate content angles",
        body: "Mix educational captions, behind-the-scenes notes, proof posts, customer questions, and opinion-led posts. Variety keeps the account useful without feeling random.",
      },
    ],
  },
  {
    title: "How to Compress PDF Without Losing Quality",
    description:
      "Learn practical PDF compression settings and habits that keep documents readable while reducing file size.",
    category: "PDF",
    readTime: "5 min read",
    sections: [
      {
        heading: "Know what increases size",
        body: "Scanned pages, high-resolution images, embedded fonts, and duplicate assets often make PDFs heavy. Compression works by optimizing those parts of the file.",
      },
      {
        heading: "Use balanced compression first",
        body: "Start with a balanced setting so text stays sharp and images remain readable. Use stronger compression only when a portal or email limit requires it.",
      },
      {
        heading: "Check the final file",
        body: "After compression, open the PDF and inspect small text, signatures, tables, and image-heavy pages. A quick review prevents submission problems.",
      },
    ],
  },
  {
    title: "Beginner Guide to AI Prompt Writing",
    description:
      "A beginner-friendly prompt writing framework for better AI outputs across writing, images, summaries, and business tools.",
    category: "Prompting",
    readTime: "7 min read",
    sections: [
      {
        heading: "Use the role, task, context, format pattern",
        body: "Tell the AI what role to take, what task to complete, what context matters, and what format you want. This simple pattern improves most prompts immediately.",
      },
      {
        heading: "Add examples and constraints",
        body: "Examples show the style you want. Constraints such as word count, audience, tone, forbidden words, and required sections prevent generic output.",
      },
      {
        heading: "Iterate with feedback",
        body: "A good prompt often takes two or three rounds. Ask for a stronger opening, simpler language, more examples, or a more specific structure until the output fits.",
      },
    ],
  },
].map((article) => ({
  ...article,
  slug: slugify(article.title),
}));

export const getBlogArticle = (slug: string) =>
  blogArticles.find((article) => article.slug === slug);
