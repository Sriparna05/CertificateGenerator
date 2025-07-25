import * as React from "react";
import type { Template } from "../hooks/use-api";

import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle, Eye } from "lucide-react";
import certificateTemplate from "../assets/certificate-template.jpg";

interface TemplatePreviewCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateName: string) => void;
  getTemplateName: (template: Template) => string;
  getTemplateDescription: (template: Template) => string;
  getTemplateIcon: (type: string) => React.ReactElement;
  // This component now receives the pre-fetched content as a prop
  content: string | null;
}

export const TemplatePreviewCard = ({
  template,
  isSelected,
  onSelect,
  getTemplateName,
  getTemplateDescription,
  getTemplateIcon,
  content,
}: TemplatePreviewCardProps) => {
  // This helper function injects scaling CSS into the certificate's HTML
  const getPreviewHtml = (
    htmlContent: string | null,
    templateName: string
  ): string => {
    if (!htmlContent) return "";

    const isWiderTemplate =
      templateName.includes("classic_achievement") ||
      templateName.includes("modern_excellence") ||
      templateName.includes("professional_training");

    const scale = isWiderTemplate ? 0.25 : 0.35;

    const scalingStyles = `
      <style>
        body { margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: hidden; }
        .certificate { transform: scale(${scale}); transform-origin: top left; box-shadow: none !important; border: none !important; position: absolute !important; top: 0; left: 0; }
      </style>
    `;

    return htmlContent.replace(/<\/head>/i, `${scalingStyles}</head>`);
  };

  const previewHtml = getPreviewHtml(content, template.name);

  return (
    <Card
      key={template.name}
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 ${
        isSelected
          ? "ring-2 ring-primary shadow-glow"
          : "bg-gradient-card shadow-card border-0"
      }`}
      onClick={() => onSelect(template.name)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <CheckCircle className="w-6 h-6 text-primary bg-background rounded-full" />
        </div>
      )}

      <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
        {template.type === "html" && content ? (
          <iframe
            srcDoc={previewHtml}
            title={getTemplateName(template)}
            className="w-full h-full border-0"
            scrolling="no"
            style={{ pointerEvents: "none" }} // Keeps the card clickable
          ></iframe>
        ) : template.type === "html" && !content ? (
          <p className="text-destructive text-center p-4 text-sm">
            Preview failed to load
          </p>
        ) : (
          <img
            src={certificateTemplate} // Fallback for non-html or future types
            alt={getTemplateName(template)}
            className="w-full h-full object-cover"
          />
        )}
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
        <p className="text-sm text-muted-foreground mb-3 h-10">
          {getTemplateDescription(template)}
        </p>
        <Button variant="ghost" size="sm" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>
    </Card>
  );
};
