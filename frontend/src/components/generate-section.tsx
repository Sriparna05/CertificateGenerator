import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Download, Mail, CheckCircle, FileText, Archive } from "lucide-react";
import { TechBackground } from "@/components/tech-background";
import { useCertificate } from "@/contexts/CertificateContext";
import { useApi } from "@/hooks/use-api";

interface GenerateSectionProps {
  onBack: () => void;
}

export const GenerateSection = ({ onBack }: GenerateSectionProps) => {
  const {
    file,
    selectedTemplate,
    generateLoading: loading,
    generateError: error,
    generateResult: result,
    generate,
  } = useCertificate();
  const { downloadZip } = useApi();
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState("pdf");

  // This function will be called when the "Start Generation" button is clicked.
  const startGeneration = async () => {
    if (!file || !selectedTemplate) {
      console.error("No file or template selected");
      return;
    }

    await generate(file, selectedTemplate, false, selectedFormat); // Pass selected format
  };

  const downloadCertificate = async (cert: any) => {
    if (!cert.file_path) {
      console.error("No file path available for download");
      return;
    }

    try {
      // Extract filename from path (e.g., "generated_certificates/cert_xyz.pdf" -> "cert_xyz.pdf")
      const filename = cert.file_path.split("/").pop() || cert.file_path;
      const downloadUrl = `http://127.0.0.1:5000/generated_certificates/${filename}`;

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cert.recipient.replace(/\s+/g, "_")}_certificate.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const downloadAllCertificates = async () => {
    if (!result?.results) return;

    try {
      // Get all successful certificate file paths
      const filePaths = result.results
        .filter((cert: any) => cert.status === "success" && cert.file_path)
        .map((cert: any) => cert.file_path);

      if (filePaths.length === 0) {
        console.error("No certificates available for download");
        return;
      }

      // Use ZIP download for multiple files
      await downloadZip(
        filePaths,
        `certificates_${new Date().toISOString().slice(0, 10)}.zip`
      );
    } catch (error) {
      console.error("Failed to download certificates:", error);
      // Fallback to individual downloads
      for (const cert of result.results) {
        if (cert.status === "success" && cert.file_path) {
          await downloadCertificate(cert);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
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
                  <div className="text-muted-foreground">
                    {selectedFormat.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Download Format</h4>
                <Tabs
                  value={selectedFormat}
                  onValueChange={setSelectedFormat}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                      value="pdf"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </TabsTrigger>
                    <TabsTrigger
                      value="html"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      HTML
                    </TabsTrigger>
                    <TabsTrigger
                      value="png"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      PNG
                    </TabsTrigger>
                    <TabsTrigger
                      value="jpeg"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      JPEG
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="pdf"
                    className="text-sm text-muted-foreground mt-3"
                  >
                    Professional PDF format, perfect for printing and sharing
                  </TabsContent>
                  <TabsContent
                    value="html"
                    className="text-sm text-muted-foreground mt-3"
                  >
                    Interactive HTML format, great for web viewing and embedding
                  </TabsContent>
                  <TabsContent
                    value="png"
                    className="text-sm text-muted-foreground mt-3"
                  >
                    High-quality PNG image, ideal for social media and
                    presentations
                  </TabsContent>
                  <TabsContent
                    value="jpeg"
                    className="text-sm text-muted-foreground mt-3"
                  >
                    Compressed JPEG image, smaller file size for easy sharing
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                variant="hero"
                size="lg"
                onClick={startGeneration}
                className="w-full"
                disabled={!file || !selectedTemplate}
              >
                Generate {selectedFormat.toUpperCase()} Certificates
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
                  <Button
                    variant="hero"
                    className="flex items-center gap-2"
                    onClick={downloadAllCertificates}
                  >
                    <Archive className="w-4 h-4" />
                    Download ZIP
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadCertificate(cert)}
                        >
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
