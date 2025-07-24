import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection, UploadSection, TemplateSection, GenerateSection } from "@/components";
import { PageTransition } from "@/components/ui";

const Index = () => {
  const [currentStep, setCurrentStep] = useState("home");

  // Remove unused handleStepChange, adapt to new component props

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "upload":
        return (
          <UploadSection
            onUpload={(file) => {
              setUploadedFile(file);
              setCurrentStep("templates");
            }}
          />
        );
      case "templates":
        return (
          <TemplateSection
            selected={selectedTemplate}
            onSelect={(id) => {
              setSelectedTemplate(id);
              setCurrentStep("generate");
            }}
          />
        );
      case "generate":
        return (
          <GenerateSection
            onGenerate={() => {
              setLoading(true);
              // Simulate generation and reset after
              setTimeout(() => {
                setLoading(false);
                setCurrentStep("home");
              }, 1500);
            }}
            loading={loading}
          />
        );
      default:
        return <HeroSection onGetStarted={() => setCurrentStep("upload")} />;
    }
  };

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation is now a simple nav bar, not step-based. If step navigation is needed, implement custom logic. */}
      {/* <Navigation currentStep={currentStep} onStepChange={handleStepChange} /> */}
        <PageTransition>
        {renderCurrentStep()}
      </PageTransition>
    </div>
  );
};

export default Index;
