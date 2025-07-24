import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection, UploadSection, TemplateSection, GenerateSection } from "@/components";
import { PageTransition } from "@/components/ui";

import { useGenerate } from "@/hooks/use-generate";

const Index = () => {
  const [currentStep, setCurrentStep] = useState("home");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");
  const { loading, result, error, generate } = useGenerate();
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);

  // Auto-hide feedback and reset state after generation or error
  import { useEffect } from "react";
  useEffect(() => {
    if (result) {
      setShowResult(true);
      setUploadedFile(null);
      setSelectedTemplate("classic");
      const timer = setTimeout(() => setShowResult(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [result]);
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      {/* Result/Error feedback UI */}
      {showResult && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 px-6 py-3 rounded shadow-lg z-50"
          role="status"
          tabIndex={-1}
          aria-live="polite"
        >
          Certificates generated successfully!
        </div>
      )}
      {showError && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-800 px-6 py-3 rounded shadow-lg z-50"
          role="alert"
          tabIndex={-1}
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Index;
