import type { ToolFaq } from "@/config/tools";

type FAQProps = {
  items: ToolFaq[];
};

export function FAQ({ items }: FAQProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.question} className="glass-card rounded-xl p-5">
          <summary className="cursor-pointer text-base font-semibold text-white">
            {item.question}
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
