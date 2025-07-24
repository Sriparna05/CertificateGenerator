
import { useState } from "react";
import { Navigation } from "../components/ui/navigation";
import { HeroSection } from "../components/hero-section";
import { UploadSection } from "../components/upload-section";
import { TemplateSection } from "../components/template-section";
import { GenerateSection } from "../components/generate-section";
import { PageTransition } from "../components/page-transition";

const Index = () => {
  const [currentStep, setCurrentStep] = useState("home");

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "upload":
        return <UploadSection onNext={() => setCurrentStep("templates")} />;
      case "templates":
        return <TemplateSection onNext={() => setCurrentStep("generate")} />;
      case "generate":
        return <GenerateSection onBack={() => setCurrentStep("templates")} />;
      default:
        return <HeroSection onGetStarted={() => setCurrentStep("upload")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentStep={currentStep} onStepChange={handleStepChange} />
      <PageTransition currentStep={currentStep}>
        {renderCurrentStep()}
      </PageTransition>
    </div>
  );
};

export default Index;
