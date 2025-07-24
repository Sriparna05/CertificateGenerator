import { Link, useLocation } from "react-router-dom";
import * as React from "react";

interface NavigationProps {
  currentStep: string;
  onStepChange: (step: string) => void;
}

export const Navigation = ({ currentStep, onStepChange }: NavigationProps) => {
  const steps = [
    { key: "home", label: "Home" },
    { key: "upload", label: "Upload" },
    { key: "templates", label: "Templates" },
    { key: "generate", label: "Generate" },
  ];

  return (
    <nav className="flex gap-4 items-center justify-center py-6">
      {steps.map((step) => (
        <button
          key={step.key}
          className={`px-4 py-2 rounded transition font-medium text-sm ${
            currentStep === step.key
              ? "bg-primary text-white shadow-glow" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
          onClick={() => onStepChange(step.key)}
        >
          {step.label}
        </button>
      ))}
    </nav>
  );
};
