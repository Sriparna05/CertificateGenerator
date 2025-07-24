import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection, UploadSection, TemplateSection, GenerateSection } from "@/components";
import { PageTransition } from "@/components/ui";

import { useGenerate } from "@/hooks/use-generate";

const Index = () => {
  const [currentStep, setCurrentStep] = useState("home");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");
  const { loading, result, error, generate } = useGenerate();

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
            onGenerate={async () => {
              if (uploadedFile && selectedTemplate) {
                await generate(uploadedFile, selectedTemplate);
                setCurrentStep("home");
              }
            }}
            loading={loading}
          />
        );
      default:
        return <HeroSection onGetStarted={() => setCurrentStep("upload")} />;
    }
  };

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
