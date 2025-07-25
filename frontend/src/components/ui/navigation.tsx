import { cn } from "@/lib/utils";
import { Home, Upload, Palette, Zap } from "lucide-react";

interface NavigationProps {
  currentStep: string;
  onStepChange: (step: string) => void;
}

export const Navigation = ({ currentStep, onStepChange }: NavigationProps) => {
  const steps = [
    { id: "home", label: "Home", icon: Home },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "templates", label: "Templates", icon: Palette },
    { id: "generate", label: "Generate", icon: Zap },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 group cursor-pointer hover:scale-105 transition-all duration-300">
            <div className="w-8 h-8 bg-gradient-tech rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-tech bg-clip-text text-transparent">
              CertGen
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 group",
                  currentStep === step.id
                    ? "bg-gradient-tech text-primary-foreground shadow-neon"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-glow"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <step.icon
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    currentStep === step.id
                      ? "scale-110"
                      : "group-hover:scale-110"
                  )}
                />
                <span className="hidden md:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
