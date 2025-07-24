import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className={cn("w-full py-16 flex flex-col items-center text-center gap-4")}> 
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">AI Certificate Generator</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Instantly generate beautiful, verifiable certificates using AI. Upload your data, pick a template, and let the magic happen.
      </p>
    </section>
  );
}
