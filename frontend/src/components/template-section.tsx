import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import certificateTemplate from "../assets/certificate-template.jpg";
import {
  CheckCircle,
  Eye,
  FileImage,
  FileText,
  Presentation,
} from "lucide-react";
import { TechBackground } from "./tech-background";
import { useTemplate } from "../hooks/use-template";
import type { Template } from "../hooks/use-api";

interface TemplateSectionProps {
  onNext: () => void;
}

export const TemplateSection = ({ onNext }: TemplateSectionProps) => {
  const { templates, selected, setSelected, loading, error } = useTemplate();

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
    // Convert filename to display name
    return template.name
      .replace(/[_-]/g, " ")
      .replace(/\.[^/.]+$/, "")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTemplateDescription = (template: Template) => {
    const descriptions: Record<string, string> = {
      achievement_template:
        "Perfect for recognizing achievements and accomplishments",
      completion_template: "Ideal for course completion certificates",
      basic_template: "Simple and elegant design for any occasion",
    };

    const key = template.name.replace(/\.[^/.]+$/, "");
    return (
      descriptions[key] || `Professional ${template.type} certificate template`
    );
  };

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
          {templates.map((template) => (
            <Card
              key={template.name}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 ${
                selected === template.name
                  ? "ring-2 ring-primary shadow-glow"
                  : "bg-gradient-card shadow-card border-0"
              }`}
              onClick={() => setSelected(template.name)}
            >
              {selected === template.name && (
                <div className="absolute top-3 right-3 z-10">
                  <CheckCircle className="w-6 h-6 text-primary bg-background rounded-full" />
                </div>
              )}

              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={certificateTemplate}
                  alt={getTemplateName(template)}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{getTemplateName(template)}</h3>
                  <div className="flex items-center gap-1">
                    {getTemplateIcon(template.type)}
                    <Badge variant="secondary" className="text-xs uppercase">
                      {template.type}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {getTemplateDescription(template)}
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </Card>
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
                      {templates.find((t) => t.name === selected) &&
                        getTemplateName(
                          templates.find((t) => t.name === selected)!
                        )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Type
                    </label>
                    <div className="flex items-center gap-2">
                      {templates.find((t) => t.name === selected) &&
                        getTemplateIcon(
                          templates.find((t) => t.name === selected)!.type
                        )}
                      <span className="uppercase">
                        {templates.find((t) => t.name === selected)?.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-muted-foreground">
                      {templates.find((t) => t.name === selected) &&
                        getTemplateDescription(
                          templates.find((t) => t.name === selected)!
                        )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-card">
                <img
                  src={certificateTemplate}
                  alt="Template preview"
                  className="w-full h-full object-cover"
                />
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
