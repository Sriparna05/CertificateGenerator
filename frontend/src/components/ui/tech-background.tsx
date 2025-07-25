import { cn } from "@/lib/utils";

export function TechBackground() {
  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-green-50 opacity-80 pointer-events-none"
      )}
    />
  );
}
