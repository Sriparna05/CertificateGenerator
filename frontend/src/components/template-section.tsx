import * as React from "react";
import { useState, useEffect } from "react";
import { useApi, type Template } from "../hooks/use-api";
import { useCertificate } from "../contexts/CertificateContext";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton"; // Make sure you have a Skeleton component
import { TechBackground } from "./tech-background";
import { TemplatePreviewCard } from "./TemplatePreviewCard";
import { FileImage, FileText, Presentation } from "lucide-react";

interface TemplateSectionProps {
  onNext: () => void;
}

export const TemplateSection = ({ onNext }: TemplateSectionProps) => {
  const {
    templates,
    selectedTemplate: selected,
    setSelectedTemplate: setSelected,
    templatesLoading: loading,
    templatesError: error,
  } = useCertificate();

  const { getTemplateContent } = useApi();
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // State to hold content for all templates and a unified loading state for previews
  const [allTemplateContents, setAllTemplateContents] = useState<
    Record<string, string>
  >({});
  const [previewsLoading, setPreviewsLoading] = useState<boolean>(true);

  // Effect to fetch content for ALL HTML templates at once to prevent glitching
  useEffect(() => {
    if (templates && templates.length > 0) {
      const fetchAllPreviews = async () => {
        setPreviewsLoading(true);

        const htmlTemplates = templates.filter((t) => t.type === "html");

        const promises = htmlTemplates.map(
          (template) =>
            getTemplateContent(template.name)
              .then((content) => ({ name: template.name, content }))
              .catch(() => ({ name: template.name, content: null })) // Handle errors gracefully
        );

        const results = await Promise.all(promises);

        const contents: Record<string, string> = {};
        results.forEach((result) => {
          if (result.content) {
            contents[result.name] = result.content;
          }
        });

        setAllTemplateContents(contents);
        setPreviewsLoading(false);
      };

      fetchAllPreviews();
    }
  }, []);

  // Effect for the LARGE preview at the bottom
  useEffect(() => {
    if (selected) {
      const selectedTemplateData = templates.find((t) => t.name === selected);
      if (selectedTemplateData && selectedTemplateData.type === "html") {
        setPreviewLoading(true);
        // Use the pre-fetched content
        if (allTemplateContents[selected]) {
          setPreviewContent(allTemplateContents[selected]);
          setPreviewLoading(false);
        } else if (!previewsLoading) {
          // Only show error if initial load is done
          setPreviewError("Failed to load preview for this template.");
          setPreviewLoading(false);
        }
      } else {
        setPreviewContent(null);
      }
    }
  }, [selected, allTemplateContents, previewsLoading, templates]);

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

  const getLargePreviewHtml = (
    htmlContent: string | null,
    templateName: string | null
  ): string => {
    if (!htmlContent || !templateName) return "";
    const isWiderTemplate =
      templateName.includes("classic_achievement") ||
      templateName.includes("modern_excellence") ||
      templateName.includes("professional_training");
    const scale = isWiderTemplate ? 0.49 : 0.68;
    const scalingStyles = `<style>body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden; } .certificate { transform: scale(${scale}); transform-origin: top left; box-shadow: none !important; border: none !important; position: absolute !important; top: 0; left: 0; }</style>`;
    return htmlContent.replace(/<\/head>/i, `${scalingStyles}</head>`);
  };

  const largePreviewHtml = getLargePreviewHtml(previewContent, selected);

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <TechBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <TechBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <p className="text-destructive mb-4">
              Error loading templates: {error}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
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
            Select a professional template that matches your course style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {previewsLoading
            ? Array.from({ length: 6 }).map((_, index) => (
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
            : templates.map((template: Template) => (
                <TemplatePreviewCard
                  key={template.name}
                  template={template}
                  isSelected={selected === template.name}
                  onSelect={setSelected}
                  getTemplateName={getTemplateName}
                  getTemplateDescription={getTemplateDescription}
                  getTemplateIcon={getTemplateIcon}
                  content={allTemplateContents[template.name] || null}
                />
              ))}
        </div>

        {selected && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Template Preview</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Selected Template
                    </label>
                    <p className="text-lg font-semibold">
                      {templates.find((t: Template) => t.name === selected) &&
                        getTemplateName(
                          templates.find((t: Template) => t.name === selected)!
                        )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Type
                    </label>
                    <div className="flex items-center gap-2">
                      {templates.find((t: Template) => t.name === selected) &&
                        getTemplateIcon(
                          templates.find((t: Template) => t.name === selected)!
                            .type
                        )}
                      <span className="uppercase">
                        {
                          templates.find((t: Template) => t.name === selected)
                            ?.type
                        }
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-muted-foreground">
                      {templates.find((t: Template) => t.name === selected) &&
                        getTemplateDescription(
                          templates.find((t: Template) => t.name === selected)!
                        )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-card bg-muted flex items-center justify-center">
                {previewLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                ) : previewError ? (
                  <p className="text-destructive text-center p-4">
                    {previewError}
                  </p>
                ) : previewContent ? (
                  <iframe
                    srcDoc={largePreviewHtml}
                    title="Template Preview"
                    className="w-full h-full border-0"
                    scrolling="no"
                  ></iframe>
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
          <Button variant="outline" className="px-8">
            Back to Upload
          </Button>
          <Button
            variant="hero"
            onClick={onNext}
            disabled={!selected}
            className="px-8"
          >
            Generate Certificates
          </Button>
        </div>
      </div>
    </div>
  );
};
