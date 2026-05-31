type UsageLimitBannerProps = {
  remaining?: number;
  limit?: number;
};

export function UsageLimitBanner({ remaining = 45, limit = 45 }: UsageLimitBannerProps) {
  return (
    <div className="rounded-xl border border-cyan-200/20 bg-cyan-300/[0.06] p-4 text-sm text-cyan-50">
      Free AI limit: <span className="font-semibold">{remaining}</span> of{" "}
      <span className="font-semibold">{limit}</span> AI generations remaining today.
      Non-AI tools are unlimited.
    </div>
  );
}
