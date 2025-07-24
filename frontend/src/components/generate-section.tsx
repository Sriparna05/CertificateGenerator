import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Mail, CheckCircle, FileText } from "lucide-react";
import { TechBackground } from "@/components/tech-background";
import { useGenerate } from "@/hooks/use-generate";
import { useTemplate } from "@/hooks/use-template";
import { useUpload } from "@/hooks/use-upload";

interface GenerateSectionProps {
  onBack: () => void;
}

export const GenerateSection = ({ onBack }: GenerateSectionProps) => {
  const { selected: selectedTemplate } = useTemplate();
  const { file } = useUpload();
  const { loading, error, result, generate } = useGenerate();
  const [progress, setProgress] = useState(0);

  // This function will be called when the "Start Generation" button is clicked.
  const startGeneration = async () => {
    if (!file || !selectedTemplate) {
      console.error("No file or template selected");
      return;
    }

    await generate(file, selectedTemplate, false); // Use sync generation for now
  };

  // Effect to simulate progress bar animation.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10)); // Stops at 90% to wait for API response
      }, 200);
    }
    if (result) {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading, result]);

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

        {!loading && !result && !error && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center animate-slide-up">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  We'll create certificates using the {selectedTemplate}{" "}
                  template
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="font-medium mb-1">File</div>
                  <div className="text-muted-foreground">
                    {file?.name || "No file selected"}
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="font-medium mb-1">Template</div>
                  <div className="text-muted-foreground">
                    {selectedTemplate || "No template selected"}
                  </div>
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
                disabled={!file || !selectedTemplate}
              >
                Start Generation
              </Button>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center animate-slide-up">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-destructive">
                  Generation Failed
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {loading && (
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

        {result && (
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
                    {result.successful} of {result.total_recipients}{" "}
                    certificates have been successfully created
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
                {result.results.map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{cert.recipient}</div>
                      <div className="text-sm text-muted-foreground">
                        {cert.status === "success"
                          ? "Generated successfully"
                          : `Failed: ${cert.error}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-red-500" />
                      )}
                      {cert.file_path && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
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
          {result && (
            <Button
              variant="default"
              className="px-8"
              onClick={() => window.location.reload()}
            >
              Generate More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
