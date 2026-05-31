type AdPlaceholderProps = {
  label?: string;
  className?: string;
};

function AdPlaceholder({ label = "Future AdSense placement", className = "" }: AdPlaceholderProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-cyan-200/25 bg-cyan-300/[0.04] p-4 text-center text-xs text-cyan-100/70 ${className}`}
      role="note"
    >
      {label} - reserved, no ads loaded in v1.
    </div>
  );
}

export function HeaderAdPlaceholder() {
  return <AdPlaceholder label="Header ad placeholder" className="mx-auto max-w-7xl" />;
}

export function SidebarAdPlaceholder() {
  return <AdPlaceholder label="Sidebar ad placeholder" className="sticky top-24" />;
}

export function InContentAdPlaceholder() {
  return <AdPlaceholder label="In-content ad placeholder" />;
}

export function FooterAdPlaceholder() {
  return <AdPlaceholder label="Footer ad placeholder" className="mx-auto max-w-7xl" />;
}
