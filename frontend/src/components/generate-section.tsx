import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Mail, CheckCircle, FileText } from "lucide-react";
import { TechBackground } from "@/components/tech-background";

interface GenerateSectionProps {
  onBack: () => void;
}

interface Certificate {
  recipient_name: string;
  course_name: string;
  url: string;
}

export const GenerateSection = ({ onBack }: GenerateSectionProps) => {
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedCertificates, setGeneratedCertificates] = useState<
    Certificate[]
  >([]);

  // This function will be called when the "Start Generation" button is clicked.
  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    setIsComplete(false);
    setGeneratedCertificates([]);

    // The data to be sent to the backend API.
    const requestBody = {
      template_id: "tech_modern_01",
      output_format: "pdf",
      recipients: [
        {
          name: "John Doe",
          course: "React Development",
          certificate_id: "cert-001",
        },
        {
          name: "Jane Smith",
          course: "Node.js Fundamentals",
          certificate_id: "cert-002",
        },
        {
          name: "Mike Johnson",
          course: "Full Stack Development",
          certificate_id: "cert-003",
        },
      ],
    };

    try {
      // API call to the Flask backend. [1, 4, 5]
      const response = await fetch(
        "http://127.0.0.1:5000/api/v1/certificates/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Certificate generation failed");
      }

      const data = await response.json();
      setGeneratedCertificates(data.certificates);
      setIsComplete(true);
    } catch (error) {
      console.error("Error during certificate generation:", error);
      // Here you could set an error state and display a message to the user.
    } finally {
      setIsGenerating(false);
    }
  };

  // Effect to simulate progress bar animation.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10)); // Stops at 90% to wait for API response
      }, 200);
    }
    if (isComplete) {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isComplete]);

  return (
    <div className="min-h-screen relative py-16 px-4">
      <TechBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Generate Certificates</h1>
          <p className="text-xl text-muted-foreground">
            Ready to create your professional certificates
          </p>
        </div>

        {!isGenerating && !isComplete && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center animate-slide-up">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  We'll create 3 certificates using the Modern Tech template
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="font-medium mb-1">Recipients</div>
                  <div className="text-muted-foreground">3 people</div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="font-medium mb-1">Template</div>
                  <div className="text-muted-foreground">Modern Tech</div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="font-medium mb-1">Format</div>
                  <div className="text-muted-foreground">PDF</div>
                </div>
              </div>
              <Button
                variant="hero"
                size="lg"
                onClick={startGeneration}
                className="w-full"
              >
                Start Generation
              </Button>
            </div>
          </Card>
        )}

        {isGenerating && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 animate-slide-up">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Generating Certificates
                </h3>
                <p className="text-muted-foreground">
                  Please wait while we create your certificates...
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {progress}% complete
                </div>
              </div>
            </div>
          </Card>
        )}

        {isComplete && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Certificates Generated!
                  </h3>
                  <p className="text-muted-foreground">
                    All certificates have been successfully created and are
                    ready for download
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download All (ZIP)
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email to Recipients
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-elegant border-0">
              <h4 className="font-semibold mb-4">Generated Certificates</h4>
              <div className="space-y-3">
                {generatedCertificates.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{cert.recipient_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cert.course_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <a href={cert.url} download>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="px-8">
            Back to Templates
          </Button>
          {isComplete && (
            <Button
              variant="default"
              className="px-8"
              onClick={() => setIsComplete(false)}
            >
              Generate More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
