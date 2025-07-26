import React, { useState, useEffect } from "react";
import { useCertificate } from "../contexts/CertificateContext";
import type { Template } from "../hooks/use-api"; // Still useful for type definition

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { TechBackground } from "./tech-background";
import { TemplatePreviewCard } from "./TemplatePreviewCard";
import { FileImage, FileText, Presentation } from "lucide-react";
import { Label } from "./ui/label";

interface TemplateSectionProps {
  onNext: () => void;
  onBack: () => void;
}

export const TemplateSection = ({ onNext, onBack }: TemplateSectionProps) => {
  // Destructure EVERYTHING from the single, centralized context
  const {
    selectedTemplate,
    setSelectedTemplate,
    templates,
    templatesLoading,
    templatesError,
    templateContents, // <-- New, from context
    previewsLoading, // <-- New, from context
  } = useCertificate();

  // Local state is now ONLY for the large preview display
  const [largePreviewContent, setLargePreviewContent] = useState<string | null>(
    null
  );

  // Effect to update the large preview when the selection changes
  useEffect(() => {
    if (selectedTemplate && !previewsLoading) {
      const selectedData = templates?.find((t) => t.name === selectedTemplate);
      if (selectedData?.type === "html") {
        setLargePreviewContent(templateContents[selectedTemplate] || null);
      } else {
        setLargePreviewContent(null);
      }
    }
  }, [selectedTemplate, templateContents, previewsLoading, templates]);

  // --- Helper functions can remain, as they are for display logic ---
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "html":
        return <FileText className="w-4 h-4" />;
      case "image":
        return <FileImage className="w-4 h-4" />;
      case "pptx":
        return <Presentation className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTemplateName = (template: Template) => {
    return template.name
      .replace(/[_-]/g, " ")
      .replace(/\.[^/.]+$/, "")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTemplateDescription = (template: Template) => {
    const descriptions: Record<string, string> = {
      classic_achievement:
        "A timeless design for recognizing significant accomplishments.",
      elegant_excellence:
        "Sophisticated and refined, perfect for high-level achievements.",
      modern_achievement:
        "Clean and contemporary, ideal for modern educational programs.",
      modern_excellence:
        "A sleek and professional design for showcasing outstanding performance.",
      professional_completion:
        "Formal and clear, suitable for professional course completions.",
      professional_training:
        "Designed for training programs, emphasizing skill development.",
    };
    const key = template.name.replace(/\.[^/.]+$/, "");
    return (
      descriptions[key] || `Professional ${template.type} certificate template`
    );
  };

  const getLargePreviewHtml = (htmlContent: string | null): string => {
    if (!htmlContent || !selectedTemplate) return "";
    const isWiderTemplate =
      selectedTemplate.includes("classic_achievement") ||
      selectedTemplate.includes("modern_excellence") ||
      selectedTemplate.includes("professional_training");
    const scale = isWiderTemplate ? 0.49 : 0.68;
    const scalingStyles = `<style>body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden; } .certificate { transform: scale(${scale}); transform-origin: top left; box-shadow: none !important; border: none !important; position: absolute !important; top: 0; left: 0; }</style>`;
    return htmlContent.replace(/<\/head>/i, `${scalingStyles}</head>`);
  };

  const largePreviewHtml = getLargePreviewHtml(largePreviewContent);
  const selectedTemplateData = templates?.find(
    (t) => t.name === selectedTemplate
  );

  if (templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Templates...</p>
        </div>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-destructive/10 border-destructive">
          <h2 className="text-xl font-bold text-destructive mb-2">
            Error Loading Templates
          </h2>
          <p className="text-muted-foreground mb-4">{templatesError}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-16 px-4">
      <TechBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Choose Your Template</h1>
          <p className="text-xl text-muted-foreground">
            Select a professional template that matches your style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {previewsLoading
            ? Array.from({ length: templates?.length || 6 }).map((_, index) => (
                <Card key={index}>
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-9 w-full mt-2" />
                  </div>
                </Card>
              ))
            : templates?.map((template) => (
                <TemplatePreviewCard
                  key={template.name}
                  template={template}
                  isSelected={selectedTemplate === template.name}
                  onSelect={setSelectedTemplate}
                  getTemplateName={getTemplateName}
                  getTemplateDescription={getTemplateDescription}
                  getTemplateIcon={getTemplateIcon}
                  content={templateContents[template.name] || null}
                />
              ))}
        </div>

        {selectedTemplateData && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Template Preview</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Selected Template</Label>
                    <p className="text-lg font-semibold">
                      {getTemplateName(selectedTemplateData)}
                    </p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <div className="flex items-center gap-2">
                      {getTemplateIcon(selectedTemplateData.type)}
                      <span className="uppercase">
                        {selectedTemplateData.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-muted-foreground">
                      {getTemplateDescription(selectedTemplateData)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-card bg-muted flex items-center justify-center">
                {largePreviewContent ? (
                  <iframe
                    srcDoc={largePreviewHtml}
                    title="Template Preview"
                    className="w-full h-full border-0"
                    scrolling="no"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    No preview available for this type.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="px-8">
            Back to Upload
          </Button>
          <Button
            variant="hero"
            onClick={onNext}
            disabled={!selectedTemplate}
            className="px-8"
          >
            Continue to Generate
          </Button>
        </div>
      </div>
    </div>
  );
};
