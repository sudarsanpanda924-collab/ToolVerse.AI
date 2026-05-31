# ToolVerse AI

ToolVerse AI is a production-ready Next.js App Router project for a premium 3D glassmorphism website with 130+ free tools. It includes AI writing tools, YouTube tools, Instagram tools, AI image tools, PDF/OCR tools, business calculators, image/document converters, audio/video tools, YouTube optimization tools, utilities, starter blog content, legal pages, ad placeholders, usage limits, and a protected admin dashboard.

## Tech Stack

- Next.js 16 App Router
- Tailwind CSS
- Framer Motion
- lucide-react
- Firebase Admin SDK + Firestore
- Next.js API routes
- Gemini, Groq, OpenRouter, Pollinations, and Hugging Face routing
- pdf-lib, qrcode, sharp, ffmpeg.wasm-ready dependencies

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

3. Add API keys and secrets in `.env.local`.

Required for production:

- `NEXT_PUBLIC_APP_URL`
- `IP_HASH_SALT`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- Firebase Admin credentials for Firestore usage tracking

Required AI providers:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `HUGGINGFACE_API_KEY`

Pollinations image generation works without a private key.

4. Run the dev server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Admin Dashboard

Route:

```text
/admin
```

Development demo credentials:

```text
Username: Goutam
Password: Goutam@8260
```

Admin credentials are read from server-side environment variables and verified only on the server. The frontend never includes the password. Change `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` before production.

Admin features:

- View total users
- View AI and non-AI usage statistics
- Manage tools
- Enable or disable tools
- View API/provider status
- Manage pricing plan visibility
- Dashboard analytics

## API Routes

- `POST /api/ai`
- `POST /api/image`
- `POST /api/convert`
- `POST /api/ocr`
- `POST /api/usage`
- `GET /api/status`

AI usage is limited to 5 generations per day per visitor in v1. Usage is tracked with an IP hash plus date in Firestore when Firebase Admin credentials are configured. Non-AI tools are unlimited.

## Tool Engine

Tools are not hardcoded as individual pages. The central config lives in:

```text
src/config/tools.ts
```

That file generates:

- Tool listing
- Category filters
- Dynamic `/tools/[slug]` pages
- Form fields
- Provider preference
- SEO metadata
- FAQs
- Related tools
- Category illustrations

## Blog and Content

The blog system lives in:

```text
src/config/blog.ts
```

Ten original starter articles are included for launch and AdSense readiness:

- Best Free AI Tools for Creators
- How to Use AI Writing Tools Safely
- Best YouTube Title Generator Tips
- How to Improve YouTube CTR
- Free PDF Tools Every Student Needs
- Image Converter Tools Explained
- How AI Tools Help Small Businesses
- Best Instagram Caption Ideas
- How to Compress PDF Without Losing Quality
- Beginner Guide to AI Prompt Writing

## SEO

Included:

- Dynamic metadata for every tool page
- FAQ JSON-LD on every tool page
- `sitemap.xml`
- `robots.txt`
- Original legal/trust pages
- Blog content
- Clean internal navigation

Title format:

```text
{Tool Name} - Free Online Tool | ToolVerse AI
```

Description format:

```text
Use {Tool Name} online for free. Fast, simple, AI-powered tool for creators, students, freelancers and businesses.
```

## Google Search Console Setup

1. Deploy the website and connect the domain.
2. Open Google Search Console.
3. Add `https://yoursite.com` as a Domain property or URL Prefix property.
4. Verify ownership using DNS TXT, HTML file, or provider verification.
5. Submit:

```text
https://yoursite.com/sitemap.xml
```

6. Check indexing status after Google crawls the site.
7. Review coverage errors, redirects, blocked pages, and canonical issues.
8. Confirm `robots.txt` is available:

```text
https://yoursite.com/robots.txt
```

9. Request indexing for important pages:

- Home
- `/tools`
- Top tool pages
- Blog articles
- Legal pages

## AdSense Readiness

The site is prepared for future Google AdSense approval with:

- Original content
- Clear navigation
- No broken page structure
- Privacy Policy
- Terms and Conditions
- Disclaimer
- Contact page
- About page
- Fast, mobile responsive UI
- Safe user experience
- Clean ad placeholders only

Ad placeholder components:

- `HeaderAdPlaceholder`
- `SidebarAdPlaceholder`
- `InContentAdPlaceholder`
- `FooterAdPlaceholder`

No real ads are loaded in v1.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Add all `.env.local` values in Vercel Project Settings -> Environment Variables.
4. Deploy.
5. Add your domain in Vercel Project Settings -> Domains:

```text
yoursite.com
www.yoursite.com
```

6. Update DNS at your domain registrar using the records Vercel gives you.
7. Vercel automatically provisions SSL/HTTPS certificates after DNS is valid.
8. Set:

```text
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

9. Redeploy after changing environment variables.

## Firebase Hosting Deployment

Vercel is recommended for this Next.js app. If you use Firebase hosting:

1. Install Firebase CLI.
2. Create a Firebase project.
3. Enable Firestore.
4. Add Firebase Admin service account credentials to the hosting environment.
5. Configure Firebase Hosting for a Next.js framework deployment.
6. Connect your domain in Firebase Hosting.
7. Firebase provisions SSL/HTTPS after DNS verification.

## Core Web Vitals and Performance

The project is mobile-first and optimized for fast launch:

- Server Components by default
- Client components only for interactivity
- No copyrighted external imagery
- CSS/SVG-style generated illustrations
- Lightweight glass UI
- Sitemap and robots generated by Next.js
- Provider clients initialized lazily
- No private keys in frontend bundles

Before launch, run:

```bash
npm run build
npm run lint
```

## Production Notes

- Replace demo admin secrets before launch.
- Configure Firestore rules and service account storage carefully.
- Add provider rate limit monitoring.
- Graduate placeholder file converters into specialized implementations as demand appears.
- Keep all AI provider keys server-side only.
