export function AnimatedGradientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-grid absolute inset-0 opacity-70" />
      <div className="absolute -left-32 top-10 h-96 w-96 animate-pulse rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-500/16 blur-3xl" />
      <div className="absolute -right-24 top-72 h-[28rem] w-[28rem] rounded-full bg-blue-500/18 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-fuchsia-500/12 blur-3xl" />
    </div>
  );
}
