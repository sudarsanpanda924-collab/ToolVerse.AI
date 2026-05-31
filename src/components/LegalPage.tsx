type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: {
    heading: string;
    body: string;
  }[];
};

export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel rounded-xl p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{intro}</p>
        </div>
        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.heading} className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
