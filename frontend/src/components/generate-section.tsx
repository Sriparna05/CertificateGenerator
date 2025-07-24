import { cn } from "@/lib/utils";

export function GenerateSection({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <section className="w-full flex flex-col items-center gap-4 py-8">
      <button
        className={cn(
          "px-8 py-3 rounded bg-green-600 text-white font-bold text-lg transition",
          loading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700"
        )}
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Certificates"}
      </button>
    </section>
  );
}
