import { useState } from "react";
import { Button, Card, Badge } from "./ui";
import certificateTemplate from "../assets/certificate-template.png";
import { CheckCircle, Eye } from "lucide-react";
import { TechBackground } from "./tech-background";

interface TemplateSectionProps {
  onNext: () => void;
}

const templates = [
  {
    id: 1,
    name: "Modern Tech",
    category: "Technology",
    description: "Clean and professional design perfect for technical courses",
    preview: certificateTemplate,
    color: "blue"
  },
  {
    id: 2,
    name: "Executive",
    category: "Management",
    description: "Elegant design for leadership and management certifications",
    preview: certificateTemplate,
    color: "purple"
  },
  {
    id: 3,
    name: "Creative Design",
    category: "Design",
    description: "Artistic template for creative and design courses",
    preview: certificateTemplate,
    color: "green"
  },
  {
    id: 4,
    name: "Marketing Pro",
    category: "Marketing",
    description: "Dynamic design for marketing and business courses",
    preview: certificateTemplate,
    color: "orange"
  }
];

export const TemplateSection = ({ onNext }: TemplateSectionProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

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
              key={template.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary shadow-glow'
                  : 'bg-gradient-card shadow-card border-0'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 z-10">
                  <CheckCircle className="w-6 h-6 text-primary bg-background rounded-full" />
                </div>
              )}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={template.preview}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {selectedTemplate && (
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
                      {templates.find(t => t.id === selectedTemplate)?.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Category
                    </label>
                    <p>
                      {templates.find(t => t.id === selectedTemplate)?.category}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-card">
                <img
                  src={templates.find(t => t.id === selectedTemplate)?.preview}
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
            disabled={!selectedTemplate}
            className="px-8"
          >
            Generate Certificates
          </Button>
        </div>
      </div>
    </div>
  );
};
