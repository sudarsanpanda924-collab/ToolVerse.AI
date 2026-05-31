import { ToolIcon } from "@/components/ToolIcon";
import { cn } from "@/lib/utils";

type ToolIllustrationProps = {
  icon: string;
  accent: string;
  variant?: string;
  className?: string;
  label?: string;
};

function getShapes(variant = "") {
  if (variant.includes("gst-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["GST", "Tax", "₹"] };
  }
  if (variant.includes("currency-profit-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["FX", "Profit", "₹"] };
  }
  if (variant.includes("business-name-availability-checker")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Name", "Brand", "AI"] };
  }
  if (variant.includes("qr-menu-builder")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["QR", "Menu", "Resto"] };
  }
  if (variant.includes("profit-margin-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Margin", "Profit", "%"] };
  }
  if (variant.includes("invoice-generator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Invoice", "Bill", "PDF"] };
  }
  if (variant.includes("roi-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["ROI", "Growth", "%"] };
  }
  if (variant.includes("break-even-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Breakeven", "Cost", "Chart"] };
  }
  if (variant.includes("emi-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["EMI", "Loan", "₹"] };
  }
  if (variant.includes("startup-cost-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Startup", "Capital", "₹"] };
  }
  if (variant.includes("freelance-rate-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Rate", "Freelance", "₹"] };
  }
  if (variant.includes("subscription-revenue-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["SaaS", "MRR", "ARR"] };
  }
  if (variant.includes("business-valuation-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Value", "Equity", "₹"] };
  }
  if (variant.includes("sales-tax-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Tax", "Sales", "%"] };
  }
  if (variant.includes("pricing-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Pricing", "Markup", "%"] };
  }
  if (variant.includes("payroll-calculator")) {
    return { main: "rounded-2xl", orbit: "rounded-full", lines: ["Payroll", "Salary", "₹"] };
  }

  if (variant.includes("play") || variant.includes("thumbnail")) {
    return {
      main: "[clip-path:polygon(22%_12%,88%_50%,22%_88%)]",
      orbit: "rounded-lg",
      lines: ["CTR", "SEO", "A/B"],
    };
  }
  if (variant.includes("phone")) {
    return {
      main: "rounded-[1.7rem]",
      orbit: "rounded-full",
      lines: ["Reel", "Bio", "Post"],
    };
  }
  if (variant.includes("pdf") || variant.includes("document")) {
    return {
      main: "rounded-xl",
      orbit: "rounded-md",
      lines: ["PDF", "OCR", "TXT"],
    };
  }
  if (variant.includes("calculator")) {
    return {
      main: "rounded-2xl",
      orbit: "rounded-full",
      lines: ["ROI", "GST", "₹"],
    };
  }
  if (variant.includes("mic")) {
    return {
      main: "rounded-full",
      orbit: "rounded-xl",
      lines: ["WAV", "MP4", "TXT"],
    };
  }
  return {
    main: "rounded-2xl",
    orbit: "rounded-lg",
    lines: ["AI", "3D", "Go"],
  };
}

export function ToolIllustration({
  icon,
  accent,
  variant,
  className,
  label,
}: ToolIllustrationProps) {
  const shapes = getShapes(variant);

  return (
    <div
      className={cn(
        "perspective-1200 relative h-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40",
        className,
      )}
      aria-label={label}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", accent)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_18rem)]" />
      <div className="preserve-3d absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rotate-[-13deg]">
        <div
          className={cn("absolute inset-0 border border-white/30 bg-white/20 shadow-2xl backdrop-blur-xl", shapes.main)}
        />
        <div
          className={cn(
            "absolute inset-3 grid place-items-center border border-white/25 bg-slate-950/36 text-white shadow-inner",
            shapes.main,
          )}
        >
          <ToolIcon name={icon} className="h-10 w-10 drop-shadow-xl" />
        </div>
      </div>

      <div className="absolute left-4 top-5 flex flex-col gap-2">
        {shapes.lines.map((line, index) => (
          <span
            key={line}
            className="rounded-full border border-white/20 bg-white/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
            style={{ transform: `translateX(${index * 8}px)` }}
          >
            {line}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "absolute bottom-5 right-6 h-16 w-16 border border-white/25 bg-white/20 shadow-xl backdrop-blur-md",
          shapes.orbit,
        )}
      />
      <div className="absolute bottom-8 right-10 h-3 w-20 rounded-full bg-slate-950/30 blur-md" />
      <div className="absolute right-7 top-5 h-4 w-4 rounded-full bg-white/70" />
      <div className="absolute bottom-6 left-8 h-2 w-2 rounded-full bg-white/80" />
    </div>
  );
}
