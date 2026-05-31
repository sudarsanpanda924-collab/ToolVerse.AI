export type ToolCategoryId =
  | "ai-writing"
  | "youtube-creator"
  | "instagram-creator"
  | "ai-image"
  | "pdf-ocr"
  | "business-finance"
  | "image-conversion"
  | "document-conversion"
  | "audio-video"
  | "youtube-optimization"
  | "extra-utilities";

export type ToolProvider =
  | "gemini"
  | "groq"
  | "openrouter"
  | "pollinations"
  | "huggingface"
  | "local";

export type ToolOutputType =
  | "text"
  | "image"
  | "file"
  | "score"
  | "calculator"
  | "code";

export type ToolField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "url" | "file";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  helperText?: string;
  multiple?: boolean;
};

export type ToolFaq = {
  question: string;
  answer: string;
};

export type Tool = {
  slug: string;
  name: string;
  category: ToolCategoryId;
  description: string;
  fields: ToolField[];
  outputType: ToolOutputType;
  isAI: boolean;
  provider: ToolProvider;
  icon: string;
  illustration: string;
  accent: string;
  seoTitle: string;
  seoDescription: string;
  howToUse: string[];
  benefits: string[];
  faq: ToolFaq[];
};

export type ToolCategory = {
  id: ToolCategoryId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  illustration: string;
  accent: string;
  imagePrompt: string;
  audience: string;
};

const aiWriting = [
  "AI Cold Email Writer",
  "AI Product Description Generator",
  "AI Bio Generator",
  "AI Tweet Rewriter",
  "LinkedIn Post Formatter",
  "Freelancer Proposal Generator",
  "Contract Simplifier",
  "AI Meeting Notes Summarizer",
  "AI Startup Idea Generator",
  "AI Ad Copy Generator",
  "Blog Intro Generator",
  "Blog Outline Generator",
  "Paragraph Rewriter",
  "Grammar Fixer",
  "Email Subject Generator",
  "Resume Summary Generator",
  "Cover Letter Generator",
  "Business Proposal Generator",
  "Product Review Generator",
  "Social Media Post Generator",
];

const youtubeCreator = [
  "YouTube Title Generator",
  "YouTube Description Generator",
  "YouTube Tags Generator",
  "YouTube Hashtag Generator",
  "YouTube Script Outline Generator",
  "YouTube Hook Generator",
  "Thumbnail Idea Generator",
  "YouTube Thumbnail Downloader",
  "YouTube Transcript Extractor",
  "YouTube Channel Bio Generator",
  "YouTube Video Summary Generator",
  "YouTube SEO Score Checker",
  "YouTube Keyword Generator",
  "Video Topic Generator",
  "Viral Video Idea Generator",
  "YouTube Chapter Generator",
  "Shorts Script Generator",
  "Thumbnail Text Generator",
  "Competitor Analysis Tool",
  "Retention Hook Analyzer",
  "Audience Fit Checker",
  "Video Trend Analyzer",
];

const instagramCreator = [
  "Instagram Caption Generator",
  "Instagram Hashtag Generator",
  "Instagram Bio Generator",
  "Instagram Post Idea Generator",
  "Instagram Reel Hook Generator",
  "Instagram Content Calendar Generator",
  "Reel Caption Generator",
  "Carousel Post Generator",
  "Story Idea Generator",
  "Engagement Booster Generator",
  "Influencer Bio Generator",
  "Comment Reply Generator",
];

const aiImage = [
  "AI Image Generator",
  "Thumbnail Generator",
  "Logo Generator",
  "Wallpaper Generator",
  "Product Photography Generator",
  "Background Generator",
  "Thumbnail Text Generator",
  "Color Palette Generator",
  "AI Poster Generator",
  "AI Banner Generator",
  "AI Sticker Generator",
  "AI Character Prompt Generator",
  "AI Cartoon Prompt Generator",
  "AI Product Mockup Generator",
  "AI Social Media Design Prompt Generator",
  "AI Fashion Prompt Generator",
  "AI Real Estate Prompt Generator",
  "AI Cinematic Prompt Generator",
  "AI Avatar Generator",
  "AI Anime Generator",
  "AI Interior Design Generator",
  "AI Character Generator",
  "AI Cartoon Generator",
  "AI Architecture Generator",
];

const pdfOcr = [
  "Merge PDF",
  "Split PDF",
  "Remove Pages",
  "Extract Pages",
  "Organize PDF",
  "Scan to PDF",
  "Compress PDF",
  "Repair PDF",
  "OCR PDF",
  "JPG to PDF",
  "PNG to PDF",
  "Word to PDF",
  "PowerPoint to PDF",
  "Excel to PDF",
  "HTML to PDF",
  "Text to PDF",
  "PDF to JPG",
  "PDF to PNG",
  "PDF to Word",
  "PDF to PowerPoint",
  "PDF to Excel",
  "PDF to PDF/A",
  "Rotate PDF",
  "Add Page Numbers",
  "Add Watermark",
  "Crop PDF",
  "Edit PDF",
  "PDF Forms",
  "Unlock PDF",
  "Protect PDF",
  "Sign PDF",
  "Redact PDF",
  "Compare PDF",
  "AI PDF Summarizer",
  "Translate PDF",
  "PDF to Flashcards",
  "PDF Quiz Generator",
  "PDF Key Points Extractor",
  "PDF Study Notes Generator",
  "PDF Invoice Data Extractor",
  "Receipt Scanner",
  "PDF to Audiobook",
  "Voice Note to Blog Converter",
  "Resume ATS Score Checker",
  "PDF Metadata Viewer",
  "PDF Word Counter",
];

const businessFinance = [
  "GST Calculator",
  "Currency Profit Calculator",
  "Business Name Availability Checker",
  "QR Menu Builder",
  "Profit Margin Calculator",
  "Invoice Generator",
  "ROI Calculator",
  "Break Even Calculator",
  "EMI Calculator",
  "Startup Cost Calculator",
  "Freelance Rate Calculator",
  "Subscription Revenue Calculator",
  "Business Valuation Calculator",
  "Sales Tax Calculator",
  "Pricing Calculator",
  "Payroll Calculator",
];

const imageConversion = [
  "JPG to PNG Converter",
  "PNG to JPG Converter",
  "WEBP to PNG Converter",
  "PNG to WEBP Converter",
  "JPG to WEBP Converter",
  "Image Resizer",
  "Image Compressor",
  "Image Cropper",
  "Background Remover",
  "Image Watermark Remover",
  "Image Metadata Viewer",
  "Rotate Image",
  "Flip Image",
  "Blur Image",
  "Sharpen Image",
  "Base64 To Image",
  "Image To Base64",
  "SVG To PNG",
  "PNG To SVG",
];

const documentConversion = [
  "PPT To JPG",
  "CSV To Excel",
  "Excel To CSV",
  "ODT To PDF",
];

const audioVideo = [
  "Video to MP3 Converter",
  "Audio Format Converter",
  "Audio Noise Cleaner",
  "Video Compressor",
  "MP4 To GIF",
  "GIF To MP4",
  "Audio Cutter",
  "Audio Joiner",
  "Video Trimmer",
  "Video Speed Controller",
  "Subtitle Generator",
  "Subtitle Extractor",
  "Text To Speech",
  "Speech To Text",
];

const youtubeOptimization = [
  "Thumbnail CTR Analyzer",
  "Thumbnail Roast Tool",
  "Thumbnail A/B Tester",
  "Thumbnail Text Checker",
  "Thumbnail Color Analyzer",
  "YouTube Hook Score Checker",
  "YouTube Title CTR Analyzer",
  "Title Roast Tool",
  "Title Rewriter",
  "Viral Title Generator",
  "Style-Based Title Generator",
  "Title A/B Tester",
  "Title Length Checker",
  "Keyword Optimizer",
  "Curiosity Gap Analyzer",
  "Search Intent Checker",
  "Title + Thumbnail Match Checker",
  "Video Packaging Score Checker",
  "Viral Potential Checker",
  "Thumbnail Emotion Analyzer",
  "Thumbnail Readability Checker",
  "Thumbnail Face Detection Analyzer",
  "Competitor Title Analyzer",
  "SEO Audit Tool",
  "Search Ranking Predictor",
  "Clickability Score Checker",
  "Retention Score Predictor",
  "Video Idea Validator",
  "Audience Psychology Analyzer",
];

const extraUtilities = [
  "QR Code Generator",
  "Barcode Generator",
  "Password Generator",
  "UUID Generator",
  "JSON Formatter",
  "JSON Validator",
  "XML Formatter",
  "Text Diff Checker",
  "Word Counter",
  "Character Counter",
  "Case Converter",
  "URL Encoder Decoder",
  "Base64 Encoder Decoder",
  "Markdown Previewer",
  "Lorem Ipsum Generator",
];

export const categories: ToolCategory[] = [
  {
    id: "ai-writing",
    name: "AI Writing Tools",
    shortName: "AI Writing",
    description:
      "Draft, rewrite, summarize, polish, and package written content for work, school, and creator workflows.",
    icon: "Sparkles",
    illustration: "document-pen",
    accent: "from-sky-400 via-cyan-300 to-violet-500",
    imagePrompt: "3D document, pen, sparkles, premium glass SaaS",
    audience: "creators, students, marketers, founders, and freelancers",
  },
  {
    id: "youtube-creator",
    name: "YouTube Creator Tools",
    shortName: "YouTube",
    description:
      "Plan videos, generate hooks, improve metadata, summarize videos, and package ideas for better creator output.",
    icon: "Youtube",
    illustration: "play-analytics",
    accent: "from-red-400 via-fuchsia-400 to-cyan-300",
    imagePrompt: "3D play button, camera, analytics graph",
    audience: "YouTubers, shorts creators, editors, and channel managers",
  },
  {
    id: "instagram-creator",
    name: "Instagram Creator Tools",
    shortName: "Instagram",
    description:
      "Create captions, reels hooks, bios, calendars, comments, and carousel ideas for consistent social publishing.",
    icon: "Instagram",
    illustration: "phone-social",
    accent: "from-pink-400 via-violet-400 to-sky-300",
    imagePrompt: "3D phone, social bubbles, creator interface",
    audience: "social creators, influencers, brands, and community teams",
  },
  {
    id: "ai-image",
    name: "AI Image Tools",
    shortName: "AI Images",
    description:
      "Create image prompts, mockups, thumbnails, palettes, posters, banners, and generated visuals from simple inputs.",
    icon: "Palette",
    illustration: "art-canvas",
    accent: "from-cyan-300 via-blue-400 to-purple-500",
    imagePrompt: "3D art canvas, image frame, magic brush",
    audience: "designers, creators, ecommerce teams, and prompt writers",
  },
  {
    id: "pdf-ocr",
    name: "PDF Tools",
    shortName: "PDF",
    description:
      "Organize, optimize, convert, edit, secure, OCR, summarize, and study PDF files without heavy software.",
    icon: "FileText",
    illustration: "pdf-scanner",
    accent: "from-amber-300 via-orange-400 to-cyan-300",
    imagePrompt: "3D PDF file, scanner, document stack",
    audience: "students, accountants, office teams, and researchers",
  },
  {
    id: "business-finance",
    name: "Business & Finance Tools",
    shortName: "Business",
    description:
      "Calculate pricing, margins, taxes, revenue, payroll, invoices, and business decisions with lightweight tools.",
    icon: "Calculator",
    illustration: "calculator-coins",
    accent: "from-emerald-300 via-cyan-300 to-blue-500",
    imagePrompt: "3D calculator, coins, invoice, business dashboard",
    audience: "small businesses, freelancers, agencies, and finance teams",
  },
  {
    id: "image-conversion",
    name: "Image Conversion Tools",
    shortName: "Images",
    description:
      "Convert, resize, compress, crop, rotate, flip, encode, decode, and inspect images directly in the browser.",
    icon: "Image",
    illustration: "image-layers",
    accent: "from-blue-300 via-indigo-400 to-cyan-300",
    imagePrompt: "3D image layers, file icons, conversion arrows",
    audience: "designers, developers, ecommerce teams, and content teams",
  },
  {
    id: "document-conversion",
    name: "Document Conversion Tools",
    shortName: "Documents",
    description:
      "Convert PDFs, Office files, markdown, CSVs, images, and text into cleaner formats for sharing and archiving.",
    icon: "Files",
    illustration: "document-arrows",
    accent: "from-violet-300 via-sky-400 to-teal-300",
    imagePrompt: "3D document arrows, file conversion, paper stack",
    audience: "students, administrators, writers, and operations teams",
  },
  {
    id: "audio-video",
    name: "Audio & Video Tools",
    shortName: "Media",
    description:
      "Trim, compress, convert, clean, transcribe, subtitle, and transform media for publishing workflows.",
    icon: "AudioWaveform",
    illustration: "mic-waveform",
    accent: "from-fuchsia-400 via-blue-400 to-cyan-300",
    imagePrompt: "3D microphone, waveform, video reel",
    audience: "podcasters, editors, educators, and short-form creators",
  },
  {
    id: "youtube-optimization",
    name: "YouTube Optimization Suite",
    shortName: "Optimization",
    description:
      "Analyze titles, thumbnails, packaging, clickability, retention, search intent, and viral potential before publishing.",
    icon: "Rocket",
    illustration: "thumbnail-rocket",
    accent: "from-cyan-300 via-violet-400 to-rose-400",
    imagePrompt: "3D thumbnail board, CTR graph, rocket",
    audience: "growth-focused YouTubers, strategists, editors, and agencies",
  },
  {
    id: "extra-utilities",
    name: "Extra Utilities",
    shortName: "Utilities",
    description:
      "Handy daily utilities for formatting, counting, validating, encoding, generating IDs, and previewing text.",
    icon: "WandSparkles",
    illustration: "utility-grid",
    accent: "from-slate-300 via-cyan-300 to-blue-400",
    imagePrompt: "3D utility grid, QR blocks, code tokens",
    audience: "developers, writers, students, and busy operations teams",
  },
];

const toolNamesByCategory: Record<ToolCategoryId, string[]> = {
  "ai-writing": aiWriting,
  "youtube-creator": youtubeCreator,
  "instagram-creator": instagramCreator,
  "ai-image": aiImage,
  "pdf-ocr": pdfOcr,
  "business-finance": businessFinance,
  "image-conversion": imageConversion,
  "document-conversion": documentConversion,
  "audio-video": audioVideo,
  "youtube-optimization": youtubeOptimization,
  "extra-utilities": extraUtilities,
};

const categoryMap = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Record<ToolCategoryId, ToolCategory>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const slugOverrides: Record<string, string> = {
  "Thumbnail Generator": "ai-thumbnail-prompt-generator",
  "Logo Generator": "ai-logo-prompt-generator",
  "Wallpaper Generator": "ai-wallpaper-prompt-generator",
  "Product Photography Generator": "ai-product-photography-prompt-generator",
  "Background Generator": "ai-background-generator",
  "Thumbnail Text Generator": "ai-thumbnail-text-generator",
  "Color Palette Generator": "ai-color-palette-generator",
};

const pdfSlugOverrides: Record<string, string> = {
  "Merge PDF": "pdf-merger",
  "Split PDF": "pdf-splitter",
  "Remove Pages": "pdf-page-remover",
  "Compress PDF": "pdf-compressor",
  "OCR PDF": "ocr-pdf-converter",
  "JPG to PDF": "jpg-to-pdf-converter",
  "PNG to PDF": "png-to-pdf-converter",
  "Word to PDF": "word-to-pdf-converter",
  "PowerPoint to PDF": "ppt-to-pdf-converter",
  "Excel to PDF": "excel-to-pdf-converter",
  "PDF to JPG": "pdf-to-jpg-converter",
  "PDF to Word": "pdf-to-word-converter",
  "PDF to PowerPoint": "pdf-to-ppt",
  "PDF to Excel": "pdf-to-excel-converter",
  "AI PDF Summarizer": "pdf-summarizer",
  "Translate PDF": "pdf-translator",
  "PDF Key Points Extractor": "pdf-keyword-extractor",
  "Unlock PDF": "pdf-password-remover",
};

const slugFor = (name: string, category: ToolCategoryId) =>
  category === "ai-image"
    ? slugOverrides[name] || slugify(name)
    : category === "pdf-ocr"
      ? pdfSlugOverrides[name] || slugify(name)
      : slugify(name);

const titleCaseKeyword = (toolName: string) =>
  toolName
    .replace(/^AI\s+/, "")
    .replace(/\b(Generator|Converter|Tool|Analyzer|Checker|Formatter|Viewer)$/i, "")
    .trim();

const defaultTextFields: ToolField[] = [
  {
    name: "topic",
    label: "What should the tool work on?",
    type: "textarea",
    placeholder: "Paste your idea, draft, notes, URL, or context here...",
    required: true,
  },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: ["Clear", "Professional", "Friendly", "Bold", "Casual", "Academic"],
  },
  {
    name: "audience",
    label: "Audience",
    type: "text",
    placeholder: "Creators, students, founders, customers...",
  },
];

const productDescriptionFields: ToolField[] = [
  {
    name: "productName",
    label: "Product name",
    type: "text",
    placeholder: "Example: AeroSip Smart Water Bottle",
    required: true,
  },
  {
    name: "productCategory",
    label: "Product category",
    type: "text",
    placeholder: "Example: Fitness accessory, SaaS, skincare, kitchen gadget...",
    required: true,
  },
  {
    name: "targetAudience",
    label: "Target audience",
    type: "text",
    placeholder: "Example: Busy professionals, students, founders, parents...",
    required: true,
  },
  {
    name: "keyFeatures",
    label: "Key features",
    type: "textarea",
    placeholder: "List the product's main benefits, materials, features, specs, or differentiators...",
    required: true,
  },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: ["Professional", "Friendly", "Premium", "Playful", "Persuasive", "Minimal"],
  },
  {
    name: "platform",
    label: "Platform",
    type: "select",
    options: ["Ecommerce Store", "Amazon", "Shopify", "Landing Page", "Social Media", "App Marketplace"],
  },
];

const bioGeneratorFields: ToolField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Example: Jane Doe",
    required: true,
  },
  {
    name: "profession",
    label: "Profession",
    type: "text",
    placeholder: "Example: Software Engineer, Content Creator...",
    required: true,
  },
  {
    name: "platform",
    label: "Platform",
    type: "select",
    options: ["LinkedIn", "Twitter/X", "YouTube", "Instagram", "GitHub", "Personal Website", "TikTok", "General"],
    required: true,
  },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: ["Professional", "Friendly", "Casual", "Bold", "Creative", "Academic"],
    required: true,
  },
  {
    name: "skills",
    label: "Skills / Expertise",
    type: "textarea",
    placeholder: "Example: React, Next.js, UI design, copywriting...",
    required: true,
  },
  {
    name: "goal",
    label: "Goal",
    type: "text",
    placeholder: "Example: Attract freelance clients, build network, grow followers...",
    required: true,
  },
];

const tweetRewriterFields: ToolField[] = [
  {
    name: "originalTweet",
    label: "Original tweet",
    type: "textarea",
    placeholder: "Paste your original tweet draft here...",
    required: true,
  },
  {
    name: "mode",
    label: "Mode",
    type: "select",
    options: [
      "Viral Mode",
      "Elon Musk Style",
      "Alex Hormozi Style",
      "Professional Mode",
      "Casual Mode",
      "Thread Mode",
    ],
    required: true,
  },
  {
    name: "targetAudience",
    label: "Target audience",
    type: "text",
    placeholder: "Example: Tech founders, SaaS developers, students...",
    required: false,
  },
  {
    name: "goal",
    label: "Goal",
    type: "text",
    placeholder: "Example: Drive link clicks, maximize engagement, start discussion...",
    required: false,
  },
];

const freelancerProposalFields: ToolField[] = [
  {
    name: "jobPost",
    label: "Client job post / project description",
    type: "textarea",
    placeholder: "Paste the client's job post, project brief, or requirements here...",
    required: true,
  },
  {
    name: "freelancerSkill",
    label: "Freelancer skill",
    type: "textarea",
    placeholder: "Example: Next.js, React, Tailwind, Framer Motion, Supabase...",
    required: true,
  },
  {
    name: "experienceLevel",
    label: "Experience level",
    type: "text",
    placeholder: "Example: Beginner to intermediate, 3+ years, senior agency team...",
    required: true,
  },
  {
    name: "portfolioLink",
    label: "Portfolio link",
    type: "url",
    placeholder: "https://yourportfolio.com/project",
  },
  {
    name: "budgetRange",
    label: "Budget range",
    type: "text",
    placeholder: "Example: $500-$1000",
    required: true,
  },
  {
    name: "deliveryTime",
    label: "Delivery time",
    type: "text",
    placeholder: "Example: 7 days",
    required: true,
  },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: [
      "Professional",
      "Friendly",
      "Confident",
      "Premium",
      "Short and direct",
      "Upwork style",
      "Fiverr style",
      "Agency style",
    ],
    required: true,
  },
];

const startupIdeaGeneratorFields: ToolField[] = [
  {
    name: "industry",
    label: "Industry / Niche",
    type: "text",
    placeholder: "Example: Artificial Intelligence, Clean Energy, Healthcare...",
    required: true,
  },
  {
    name: "ideaMode",
    label: "Idea Mode",
    type: "select",
    options: [
      "AI Startup",
      "SaaS Startup",
      "Marketplace",
      "Mobile App",
      "Creator Economy",
      "EdTech",
      "FinTech",
      "HealthTech",
      "E-commerce",
      "Productivity",
      "Local Business",
      "B2B",
      "B2C",
    ],
    required: true,
  },
  {
    name: "budget",
    label: "Budget Level",
    type: "select",
    options: ["Low", "Medium", "High"],
    required: true,
  },
  {
    name: "country",
    label: "Target Country / Region",
    type: "text",
    placeholder: "Example: India, United States, Global...",
    required: true,
  },
  {
    name: "experience",
    label: "Founder Experience Level",
    type: "select",
    options: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
];

const linkedinFormatterFields: ToolField[] = [
  {
    name: "rawText",
    label: "Raw text / idea",
    type: "textarea",
    placeholder: "Paste your raw text, draft, or post idea here...",
    required: true,
  },
  {
    name: "targetAudience",
    label: "Target audience",
    type: "text",
    placeholder: "Example: Tech founders, recruiters, sales executives...",
    required: true,
  },
  {
    name: "postGoal",
    label: "Post goal",
    type: "text",
    placeholder: "Example: Hire talent, promote product, share personal win...",
    required: true,
  },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: [
      "Professional",
      "Founder Story",
      "Viral",
      "Educational",
      "Personal Branding",
      "Hiring",
      "Sales",
      "Thought Leadership",
      "Casual",
    ],
    required: true,
  },
  {
    name: "industry",
    label: "Industry Focus",
    type: "select",
    options: [
      "Tech / SaaS",
      "Marketing",
      "Finance",
      "Healthcare",
      "HR / Recruiting",
      "Education",
      "Consulting",
      "Real Estate",
      "General",
    ],
    required: true,
  },
];

const youtubeFields: ToolField[] = [
  {
    name: "videoIdea",
    label: "Video topic or current title",
    type: "textarea",
    placeholder: "Example: I tested 7 budget microphones for new podcasters",
    required: true,
  },
  {
    name: "channelNiche",
    label: "Channel niche",
    type: "text",
    placeholder: "Tech reviews, cooking, finance, gaming...",
  },
  {
    name: "style",
    label: "Style",
    type: "select",
    options: ["High CTR", "Educational", "Storytelling", "Shorts", "Search-focused"],
  },
];

const instagramFields: ToolField[] = [
  {
    name: "postIdea",
    label: "Post or reel idea",
    type: "textarea",
    placeholder: "Describe your post, offer, niche, or campaign...",
    required: true,
  },
  {
    name: "brandVoice",
    label: "Brand voice",
    type: "select",
    options: ["Warm", "Luxury", "Funny", "Educational", "Minimal"],
  },
  {
    name: "hashtags",
    label: "Hashtag direction",
    type: "text",
    placeholder: "Local, niche, viral, low competition...",
  },
];

const imageFields: ToolField[] = [
  {
    name: "prompt",
    label: "Image idea or prompt",
    type: "textarea",
    placeholder: "Describe the subject, style, colors, mood, and composition...",
    required: true,
  },
  {
    name: "style",
    label: "Visual style",
    type: "select",
    options: ["Premium 3D", "Photoreal", "Minimal vector", "Anime", "Cinematic", "Product render"],
  },
  {
    name: "size",
    label: "Format",
    type: "select",
    options: ["Square", "YouTube thumbnail", "Instagram portrait", "Wide banner"],
  },
];

const fileFields: ToolField[] = [
  {
    name: "file",
    label: "Upload file",
    type: "file",
    required: true,
  },
  {
    name: "instructions",
    label: "Instructions",
    type: "textarea",
    placeholder: "Optional: add any conversion, quality, page, or formatting preferences...",
  },
];

const pdfCompressorFields: ToolField[] = [
  {
    name: "file",
    label: "Upload PDF file",
    type: "file",
    required: true,
    accept: "application/pdf",
    maxSizeMB: 8,
  },
];

const pdfOnlyFields: ToolField[] = [
  {
    name: "file",
    label: "Upload PDF file",
    type: "file",
    required: true,
    accept: "application/pdf",
    maxSizeMB: 8,
  },
];

const pdfMergerFields: ToolField[] = [
  {
    name: "file",
    label: "Upload PDF files",
    type: "file",
    required: true,
    accept: "application/pdf",
    maxSizeMB: 8,
    multiple: true,
  },
];

const pdfRangeFields: ToolField[] = [
  pdfOnlyFields[0],
  {
    name: "instructions",
    label: "Pages or ranges",
    type: "textarea",
    placeholder: "Example: 1,3-5. Leave blank to split every page.",
  },
];

const imageOcrFields: ToolField[] = [
  {
    name: "file",
    label: "Upload screenshot or image",
    type: "file",
    required: true,
    accept: "image/png,image/jpeg,image/webp,image/bmp,image/tiff",
    maxSizeMB: 8,
  },
];

const scanToPdfFields: ToolField[] = [
  {
    name: "file",
    label: "Upload scan images",
    type: "file",
    required: true,
    accept: "image/png,image/jpeg,image/webp,image/bmp,image/tiff",
    maxSizeMB: 8,
    multiple: true,
  },
];

const pdfOrImageOcrFields: ToolField[] = [
  {
    name: "file",
    label: "Upload PDF or image",
    type: "file",
    required: true,
    accept: "application/pdf,image/png,image/jpeg,image/webp,image/bmp,image/tiff",
    maxSizeMB: 8,
  },
];

const audioBlogFields: ToolField[] = [
  {
    name: "file",
    label: "Upload file",
    type: "file",
    required: true,
    accept: "audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/webm,audio/ogg",
    maxSizeMB: 12,
  },
  fileFields[1],
];

const pdfTranslatorFields: ToolField[] = [
  {
    ...pdfOnlyFields[0],
    label: "Upload PDF file",
  },
  {
    name: "instructions",
    label: "Instructions",
    type: "textarea",
    placeholder: "Target language, tone, or formatting notes. Example: Translate to Hindi.",
  },
];

const pdfInstructionFields: ToolField[] = [
  pdfOnlyFields[0],
  {
    name: "instructions",
    label: "Instructions",
    type: "textarea",
    placeholder: "Optional: page ranges, text, order, angle, watermark, or processing notes...",
  },
];

const pdfCompareFields: ToolField[] = [
  {
    name: "file",
    label: "Upload two PDF files",
    type: "file",
    required: true,
    accept: "application/pdf",
    maxSizeMB: 8,
    multiple: true,
  },
];

const pdfTextInputFields: ToolField[] = [
  {
    name: "input",
    label: "Text or HTML content",
    type: "textarea",
    placeholder: "Paste the content you want to convert into PDF...",
    required: true,
  },
];

const pdfImageFields: ToolField[] = [
  {
    name: "file",
    label: "Upload image",
    type: "file",
    required: true,
    accept: "image/jpeg,image/png,image/webp",
    maxSizeMB: 8,
  },
];

const officeToPdfFields: ToolField[] = [
  {
    name: "file",
    label: "Upload Office file",
    type: "file",
    required: true,
    accept:
      ".doc,.docx,.ppt,.pptx,.xls,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSizeMB: 8,
  },
];

const calculatorFields: ToolField[] = [
  {
    name: "valueA",
    label: "Primary value",
    type: "number",
    placeholder: "10000",
    required: true,
  },
  {
    name: "valueB",
    label: "Secondary value or rate",
    type: "number",
    placeholder: "18",
  },
  {
    name: "notes",
    label: "Context",
    type: "text",
    placeholder: "Currency, region, campaign, or business type...",
  },
];

const gstCalculatorFields: ToolField[] = [
  {
    name: "amount",
    label: "Amount",
    type: "number",
    placeholder: "10000",
    required: true,
  },
  {
    name: "gstRate",
    label: "GST Rate (%)",
    type: "number",
    placeholder: "18",
    required: true,
  },
  {
    name: "mode",
    label: "Mode",
    type: "select",
    options: ["Add GST", "Remove GST / Reverse GST"],
    required: true,
  },
  {
    name: "taxType",
    label: "GST Type",
    type: "select",
    options: ["CGST + SGST", "IGST"],
    required: true,
  },
];

const utilityFields: ToolField[] = [
  {
    name: "input",
    label: "Input",
    type: "textarea",
    placeholder: "Paste text, JSON, XML, markdown, URL, or source value...",
  },
  {
    name: "option",
    label: "Output preference",
    type: "select",
    options: ["Clean", "Compact", "Detailed", "Uppercase", "Lowercase"],
  },
];

const qrCodeFields: ToolField[] = [
  {
    name: "input",
    label: "Content to Encode",
    type: "textarea",
    placeholder: "Enter URL, plain text, email address, phone number, or WhatsApp text...",
    required: true,
  },
  {
    name: "type",
    label: "Content Type",
    type: "select",
    options: ["Text/URL", "Email", "Phone Number", "WhatsApp Link"],
  },
];

const barcodeFields: ToolField[] = [
  {
    name: "input",
    label: "Barcode Value / Product Code",
    type: "text",
    placeholder: "Example: 8901234567890",
    required: true,
  },
  {
    name: "barcodeType",
    label: "Barcode Type",
    type: "select",
    options: ["CODE128", "EAN13", "UPC", "CODE39", "ITF"],
    required: true,
  },
  {
    name: "width",
    label: "Width",
    type: "number",
    placeholder: "2",
    helperText: "Width of a single bar (1 to 4)",
  },
  {
    name: "height",
    label: "Height",
    type: "number",
    placeholder: "100",
    helperText: "Height of the barcode in pixels",
  },
  {
    name: "displayText",
    label: "Display Text",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    name: "backgroundColor",
    label: "Background Color",
    type: "text",
    placeholder: "#ffffff",
  },
  {
    name: "lineColor",
    label: "Line Color",
    type: "text",
    placeholder: "#000000",
  },
];

const textDiffFields: ToolField[] = [
  {
    name: "text1",
    label: "Original Text",
    type: "textarea",
    placeholder: "Paste original text here...",
    required: true,
  },
  {
    name: "text2",
    label: "Modified Text",
    type: "textarea",
    placeholder: "Paste modified text here to compare...",
    required: true,
  },
];

const urlFields: ToolField[] = [
  {
    name: "input",
    label: "URL or Text",
    type: "textarea",
    placeholder: "Paste URL or text to encode/decode here...",
    required: true,
  },
  {
    name: "mode",
    label: "Mode",
    type: "select",
    options: ["Encode", "Decode"],
  },
];

const providerFor = (name: string, category: ToolCategoryId): ToolProvider => {
  const normalized = name.toLowerCase();
  if (category === "ai-image") {
    return "pollinations";
  }
  if (category === "youtube-optimization") return "groq";
  if (
    normalized.includes("title") ||
    normalized.includes("hook") ||
    normalized.includes("rewrite") ||
    normalized.includes("ad copy") ||
    normalized.includes("roast")
  ) {
    return "groq";
  }
  if (
    normalized.includes("ocr") ||
    normalized.includes("speech") ||
    normalized.includes("voice note") ||
    normalized.includes("background remover") ||
    normalized.includes("noise")
  ) {
    return "huggingface";
  }
  if (
    category === "ai-writing" ||
    category === "youtube-creator" ||
    category === "instagram-creator" ||
    normalized.includes("summary") ||
    normalized.includes("summarizer") ||
    normalized.includes("translator") ||
    normalized.includes("extractor") ||
    normalized.includes("score")
  ) {
    return "gemini";
  }
  return "local";
};

const isAiTool = (name: string, category: ToolCategoryId) => {
  const normalized = name.toLowerCase();
  const pdfIntelligenceTools = new Set([
    "ai pdf summarizer",
    "translate pdf",
    "pdf to flashcards",
    "pdf quiz generator",
    "pdf key points extractor",
    "pdf study notes generator",
    "ocr pdf",
  ]);
  if (category === "pdf-ocr" && pdfIntelligenceTools.has(normalized)) {
    return true;
  }
  if (
    ["ai-writing", "youtube-creator", "instagram-creator", "ai-image", "youtube-optimization"].includes(
      category,
    )
  ) {
    return true;
  }
  return [
    "ocr",
    "scanner",
    "summarizer",
    "translator",
    "extractor",
    "score",
    "background remover",
    "watermark remover",
    "noise cleaner",
    "subtitle generator",
    "speech to text",
    "text to speech",
    "voice note",
    "business name availability",
  ].some((keyword) => normalized.includes(keyword));
};

const outputFor = (name: string, category: ToolCategoryId): ToolOutputType => {
  const normalized = name.toLowerCase();
  if (normalized.includes("score") || normalized.includes("analyzer") || normalized.includes("checker")) {
    return "score";
  }
  if (category === "ai-image") return "image";
  if (category === "pdf-ocr") {
    return ["ai pdf summarizer", "translate pdf", "pdf quiz generator", "pdf key points extractor", "pdf study notes generator"].includes(normalized)
      ? "text"
      : "file";
  }
  if (
    category === "image-conversion" ||
    category === "document-conversion" ||
    category === "audio-video" ||
    normalized.includes("compressor") ||
    normalized.includes("merger") ||
    normalized.includes("splitter")
  ) {
    return "file";
  }
  if (category === "business-finance") return "calculator";
  if (category === "extra-utilities") return normalized.includes("json") || normalized.includes("xml") ? "code" : "text";
  return "text";
};

const fieldsFor = (name: string, category: ToolCategoryId): ToolField[] => {
  if (name === "AI Product Description Generator") return productDescriptionFields;
  if (name === "AI Bio Generator") return bioGeneratorFields;
  if (name === "AI Tweet Rewriter") return tweetRewriterFields;
  if (name === "Freelancer Proposal Generator") return freelancerProposalFields;
  if (name === "AI Startup Idea Generator") return startupIdeaGeneratorFields;
  if (name === "LinkedIn Post Formatter") return linkedinFormatterFields;
  if (name === "QR Code Generator") return qrCodeFields;
  if (name === "Barcode Generator") return barcodeFields;
  if (name === "Text Diff Checker") return textDiffFields;
  if (name === "URL Encoder Decoder") return urlFields;
  if (name === "PDF Compressor") return pdfCompressorFields;
  if (name === "PDF Merger") return pdfMergerFields;
  if (name === "PDF Splitter" || name === "PDF Page Remover") return pdfRangeFields;
  if (name === "Voice Note to Blog Converter") return audioBlogFields;
  if (name === "PDF Translator") return pdfTranslatorFields;
  if (name === "GST Calculator") return gstCalculatorFields;
  if (["JPG to PDF", "PNG to PDF"].includes(name)) return pdfImageFields;
  if (["Word to PDF", "PowerPoint to PDF", "Excel to PDF"].includes(name)) return officeToPdfFields;
  if (["HTML to PDF", "Text to PDF"].includes(name)) return pdfTextInputFields;
  if (name === "Merge PDF") return pdfMergerFields;
  if (name === "Scan to PDF") return scanToPdfFields;
  if (name === "Compare PDF") return pdfCompareFields;
  if (
    [
      "Split PDF",
      "Remove Pages",
      "Extract Pages",
      "Organize PDF",
      "Rotate PDF",
      "Add Page Numbers",
      "Add Watermark",
      "Crop PDF",
      "Edit PDF",
      "PDF Forms",
      "Protect PDF",
      "Sign PDF",
      "Redact PDF",
      "AI PDF Summarizer",
      "Translate PDF",
      "PDF to Flashcards",
      "PDF Quiz Generator",
      "PDF Key Points Extractor",
      "PDF Study Notes Generator",
    ].includes(name)
  ) {
    return pdfInstructionFields;
  }
  if (
    [
      "Compress PDF",
      "Repair PDF",
      "OCR PDF",
      "PDF to JPG",
      "PDF to PNG",
      "PDF to Word",
      "PDF to PowerPoint",
      "PDF to Excel",
      "PDF to PDF/A",
      "Unlock PDF",
      "PDF Summarizer",
      "PDF Text Extractor",
      "PDF to Audiobook",
      "PDF Metadata Viewer",
      "PDF Word Counter",
      "PDF Password Remover",
      "PDF Watermark Remover",
      "PDF Keyword Extractor",
      "Resume ATS Score Checker",
    ].includes(name)
  ) {
    return pdfOnlyFields;
  }
  if (name === "Scan To PDF") return scanToPdfFields;
  if (name === "Screenshot to Text Extractor") return imageOcrFields;
  if (
    [
      "OCR PDF Converter",
      "PDF Invoice Data Extractor",
      "Receipt Scanner",
    ].includes(name)
  ) {
    return pdfOrImageOcrFields;
  }
  if (category === "youtube-creator" || category === "youtube-optimization") return youtubeFields;
  if (category === "instagram-creator") return instagramFields;
  if (category === "ai-image") return imageFields;
  if (category === "business-finance") return calculatorFields;
  if (category === "extra-utilities") return utilityFields;
  if (["pdf-ocr", "image-conversion", "document-conversion", "audio-video"].includes(category)) {
    return fileFields;
  }
  if (name.toLowerCase().includes("email")) {
    return [
      defaultTextFields[0],
      {
        name: "goal",
        label: "Goal",
        type: "text",
        placeholder: "Book a call, follow up, sell a product...",
      },
      defaultTextFields[1],
    ];
  }
  return defaultTextFields;
};

const iconFor = (category: ToolCategoryId) => categoryMap[category].icon;

const customDescriptions: Record<string, string> = {
  "GST Calculator": "Calculate CGST, SGST, and IGST for invoice totals, with support for inclusive and exclusive tax rates.",
  "Currency Profit Calculator": "Calculate net profit margins and conversion values for multi-currency transactions.",
  "Business Name Availability Checker": "Check brand name ideas for domains, social handles, and trademark viability instantly.",
  "QR Menu Builder": "Generate elegant, mobile-responsive QR menus for restaurants, cafes, and hospitality businesses.",
  "Profit Margin Calculator": "Calculate selling price, gross profit margins, and markups to optimize product pricing.",
  "Invoice Generator": "Create professional, exportable PDF invoices with itemized billing, taxes, and client details.",
  "ROI Calculator": "Measure the financial returns, growth metrics, and efficiency of your business investments.",
  "Break Even Calculator": "Determine the sales volume and revenue threshold needed to cover fixed and variable costs.",
  "EMI Calculator": "Calculate monthly loan repayments, interest schedules, and total borrowing costs instantly.",
  "Startup Cost Calculator": "Estimate the total pre-launch expenses and initial working capital needed to start your business.",
  "Freelance Rate Calculator": "Determine your ideal hourly and project rates based on target income and business expenses.",
  "Subscription Revenue Calculator": "Project MRR, ARR, LTV, and churn impacts for subscription and SaaS business models.",
  "Business Valuation Calculator": "Estimate the economic value of your business using cash flow, revenue multipliers, and asset metrics.",
  "Sales Tax Calculator": "Calculate local sales tax amounts, net prices, and gross totals for customer billing.",
  "Pricing Calculator": "Determine retail markup, wholesale costs, and target profit margins for merchandise.",
  "Payroll Calculator": "Calculate gross salary deductions, net pay estimates, and employer tax obligations.",
};

const buildDescription = (name: string, category: ToolCategoryId) => {
  if (customDescriptions[name]) {
    return customDescriptions[name];
  }
  const categoryInfo = categoryMap[category];
  const keyword = titleCaseKeyword(name).toLowerCase();
  return `${name} helps ${categoryInfo.audience} handle ${keyword || "daily work"} quickly with a clean, guided workflow and export-friendly results.`;
};

const buildBenefits = (name: string, category: ToolCategoryId) => {
  const categoryInfo = categoryMap[category];
  return [
    `Save time by turning messy inputs into a useful ${name.toLowerCase()} result in seconds.`,
    `Keep work simple with a no-login flow designed for ${categoryInfo.audience}.`,
    "Use non-AI utilities without limits, while AI tools stay protected by a fair daily free quota.",
  ];
};

const buildHowToUse = (name: string) => [
  `Open ${name} and add the context, file, topic, or numbers requested in the form.`,
  "Choose a tone, style, format, or quality preference when the tool offers one.",
  "Run the tool, review the output, then copy or download the result for your workflow.",
];

const buildFaq = (name: string, category: ToolCategoryId, isAI: boolean): ToolFaq[] => [
  {
    question: `Is ${name} free to use?`,
    answer: `${name} is free on ToolVerse AI. AI tools include a daily free generation limit, while non-AI tools are unlimited in v1.`,
  },
  {
    question: `Do I need an account for ${name}?`,
    answer:
      "No login is required in the first version. Usage limits are tracked privately with a daily IP hash so private API keys stay server-side.",
  },
  {
    question: `What makes ${name} useful for ${categoryMap[category].shortName.toLowerCase()} workflows?`,
    answer: `${name} is tuned for ${categoryMap[category].audience}, with focused inputs, related tools, and SEO-ready guidance on the same page.`,
  },
  {
    question: isAI ? "Which AI provider powers this tool?" : "Does this tool use AI?",
    answer: isAI
      ? "ToolVerse AI routes requests to free-tier-first providers such as Gemini, Groq, OpenRouter, Pollinations, or Hugging Face depending on the task."
      : "This is a non-AI utility in v1, so it can be used without the daily AI generation limit.",
  },
];

const pdfToolIcons: Record<string, string> = {
  "Merge PDF": "Plus",
  "Split PDF": "Scissors",
  "Remove Pages": "Trash2",
  "Extract Pages": "Copy",
  "Organize PDF": "FolderSync",
  "Scan to PDF": "Camera",
  "Compress PDF": "Minimize2",
  "Repair PDF": "Wrench",
  "OCR PDF": "ScanLine",
  "JPG to PDF": "Image",
  "PNG to PDF": "FileImage",
  "Word to PDF": "FileText",
  "PowerPoint to PDF": "Presentation",
  "Excel to PDF": "Table",
  "HTML to PDF": "FileCode",
  "Text to PDF": "Type",
  "PDF to JPG": "ArrowDownToLine",
  "PDF to PNG": "FileDown",
  "PDF to Word": "FileEdit",
  "PDF to PowerPoint": "Play",
  "PDF to Excel": "FileSpreadsheet",
  "PDF to PDF/A": "FileArchive",
  "Rotate PDF": "RotateCw",
  "Add Page Numbers": "Binary",
  "Add Watermark": "Stamp",
  "Crop PDF": "Crop",
  "Edit PDF": "FileSignature",
  "PDF Forms": "Keyboard",
  "Unlock PDF": "Unlock",
  "Protect PDF": "Lock",
  "Sign PDF": "PenTool",
  "Redact PDF": "EyeOff",
  "Compare PDF": "Columns",
  "AI PDF Summarizer": "Sparkles",
  "Translate PDF": "Languages",
};

const pdfGradients = [
  "from-red-400 via-orange-400 to-yellow-300",
  "from-orange-400 via-pink-500 to-purple-600",
  "from-pink-500 via-red-500 to-yellow-500",
  "from-rose-400 via-pink-500 to-indigo-500",
  "from-fuchsia-400 via-purple-500 to-indigo-500",
  "from-purple-400 via-indigo-500 to-blue-500",
  "from-indigo-400 via-blue-500 to-cyan-400",
  "from-blue-400 via-cyan-400 to-teal-400",
  "from-cyan-300 via-teal-400 to-emerald-400",
  "from-teal-300 via-emerald-400 to-green-500",
  "from-emerald-300 via-green-400 to-yellow-400",
  "from-green-300 via-yellow-400 to-orange-400",
  "from-yellow-300 via-orange-400 to-red-400",
  "from-amber-300 via-red-400 to-purple-500",
  "from-rose-400 via-purple-500 to-blue-500",
  "from-sky-400 via-indigo-500 to-purple-500",
  "from-violet-400 via-fuchsia-500 to-pink-500",
  "from-pink-400 via-rose-500 to-orange-500",
  "from-orange-400 via-amber-500 to-yellow-500",
  "from-amber-300 via-emerald-400 to-cyan-400",
  "from-teal-300 via-blue-400 to-purple-500",
  "from-cyan-300 via-indigo-400 to-pink-500",
  "from-indigo-300 via-purple-400 to-red-400",
  "from-purple-300 via-pink-400 to-yellow-400",
  "from-pink-300 via-red-400 to-orange-400",
  "from-orange-300 via-yellow-400 to-green-400",
  "from-yellow-300 via-green-400 to-teal-400",
  "from-green-300 via-teal-400 to-cyan-400",
  "from-teal-300 via-cyan-400 to-sky-400",
  "from-sky-300 via-blue-400 to-indigo-400",
  "from-blue-300 via-indigo-400 to-purple-400",
  "from-indigo-300 via-purple-400 to-fuchsia-400",
  "from-purple-300 via-fuchsia-400 to-rose-400",
  "from-fuchsia-300 via-rose-400 to-red-400",
  "from-red-300 via-orange-400 to-amber-400",
];

export const tools: Tool[] = Object.entries(toolNamesByCategory).flatMap(
  ([categoryId, names]) =>
    names.map((name, index) => {
      const category = categoryId as ToolCategoryId;
      const categoryInfo = categoryMap[category];
      const slug = slugFor(name, category);
      const isAI = isAiTool(name, category);
      
      const icon = category === "pdf-ocr" && pdfToolIcons[name]
        ? pdfToolIcons[name]
        : iconFor(category);

      const accent = category === "pdf-ocr"
        ? pdfGradients[index % pdfGradients.length]
        : categoryInfo.accent;

      return {
        slug,
        name,
        category,
        description: buildDescription(name, category),
        fields: fieldsFor(name, category),
        outputType: outputFor(name, category),
        isAI,
        provider: providerFor(name, category),
        icon,
        illustration: `${categoryInfo.illustration}-${slug}-${(index % 6) + 1}`,
        accent,
        seoTitle: `${name} - Free Online Tool | ToolVerse AI`,
        seoDescription: `Use ${name} online for free. Fast, simple, AI-powered tool for creators, students, freelancers and businesses.`,
        howToUse: buildHowToUse(name),
        benefits: buildBenefits(name, category),
        faq: buildFaq(name, category, isAI),
      };
    }),
);

export const popularToolSlugs = [
  "youtube-title-generator",
  "thumbnail-ctr-analyzer",
  "ai-image-generator",
  "pdf-compressor",
  "instagram-caption-generator",
  "qr-code-generator",
  "jpg-to-pdf-converter",
  "grammar-fixer",
  "profit-margin-calculator",
  "speech-to-text",
];

export const featuredTools = popularToolSlugs
  .map((slug) => tools.find((tool) => tool.slug === slug))
  .filter(Boolean) as Tool[];

export const toolCount = tools.length;

const toolSlugAliases: Record<string, string> = {
  "ai-image-prompt-generator": "ai-image-generator",
  "ai-thumbnail-generator": "ai-thumbnail-prompt-generator",
  "ai-logo-generator": "ai-logo-prompt-generator",
  "ai-wallpaper-generator": "ai-wallpaper-prompt-generator",
  "ai-product-photography-generator": "ai-product-photography-prompt-generator",
  "ai-character-generator": "ai-character-prompt-generator",
  "ai-cartoon-generator": "ai-cartoon-prompt-generator",
  "ai-architecture-generator": "ai-real-estate-prompt-generator",
};

export const toolRouteSlugs = [
  ...tools.map((tool) => tool.slug),
  ...Object.keys(toolSlugAliases),
];

export const getToolBySlug = (slug: string) => {
  const resolvedSlug = toolSlugAliases[slug] || slug;
  return tools.find((tool) => tool.slug === resolvedSlug);
};

export const getToolsByCategory = (category: ToolCategoryId) =>
  tools.filter((tool) => tool.category === category);

export const getRelatedTools = (tool: Tool, count = 4) =>
  tools
    .filter((candidate) => candidate.category === tool.category && candidate.slug !== tool.slug)
    .slice(0, count);

export const getCategoryById = (id: ToolCategoryId) => categoryMap[id];

export const categoryToolCounts = categories.map((category) => ({
  ...category,
  count: getToolsByCategory(category.id).length,
}));
