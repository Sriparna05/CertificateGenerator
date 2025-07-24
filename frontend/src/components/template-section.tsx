import { cn } from "@/lib/utils";

const templates = [
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" },
];

export function TemplateSection({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <section className="w-full flex flex-col items-center gap-4 py-8">
      <h2 className="text-xl font-semibold">Choose a Template</h2>
      <div className="flex gap-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            className={cn(
              "px-4 py-2 rounded border transition",
              selected === tpl.id ? "bg-primary text-white border-primary" : "bg-background border-muted"
            )}
            onClick={() => onSelect(tpl.id)}
          >
            {tpl.name}
          </button>
        ))}
      </div>
    </section>
  );
}
