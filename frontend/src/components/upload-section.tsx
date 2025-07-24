import { useRef } from "react";
import { cn } from "@/lib/utils";

export function UploadSection({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="w-full flex flex-col items-center gap-4 py-8">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
          }
        }}
      />
      <button
        className="px-6 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
        onClick={() => inputRef.current?.click()}
      >
        Upload CSV/XLSX
      </button>
    </section>
  );
}
