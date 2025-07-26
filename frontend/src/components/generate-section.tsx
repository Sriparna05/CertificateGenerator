// src/components/GenerateSection.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  Download,
  Mail,
  CheckCircle,
  FileText,
  Archive,
  XCircle,
} from "lucide-react";
import { TechBackground } from "@/components/tech-background";
import { useCertificate } from "@/contexts/CertificateContext";

type OutputFormat = "pdf" | "html" | "png" | "jpeg";

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

  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>("pdf");

  // --- THIS IS THE CRITICAL FUNCTION TO DEBUG ---
  const startGeneration = async () => {
    // Log #1: Confirm the button click is registered
    console.log("--- DEBUG: 'startGeneration' function called ---");

    // Log #2: Check the state variables right before the guard clause
    console.log("DEBUG: Current file state:", file);
    console.log("DEBUG: Current selectedTemplate state:", selectedTemplate);

    if (!file || !selectedTemplate) {
      // Log #3: This will tell us if the function is exiting early
      console.error("DEBUG: Generation stopped. File or template is missing.");
      alert(
        "Please make sure you have uploaded a file and selected a template."
      );
      return;
    }

    // Log #4: Confirm we are about to call the generate function from the context
    console.log(`DEBUG: Calling 'generate' with format: ${selectedFormat}`);
    await generate(file, selectedTemplate, false, selectedFormat);
    console.log("--- DEBUG: 'generate' function finished ---");
  };

  const downloadCertificate = (cert: any) => {
    if (!cert.file_path) {
      console.error("No file path available for download");
      return;
    }
    // The file_path from the backend is relative, e.g., "generated_certificates/cert.pdf"
    const downloadUrl = import.meta.env.PROD 
      ? `/${cert.file_path}`  // Production: relative URL
      : `http://127.0.0.1:5000/${cert.file_path}`;  // Development: localhost

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = cert.file_path.split("/").pop(); // Use the original filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllCertificates = async () => {
    if (!result?.results) return;

    const filePaths = result.results
      .filter((cert: any) => cert.status === "success" && cert.file_path)
      .map((cert: any) => cert.file_path);

    if (filePaths.length === 0) {
      alert("No successful certificates available for download.");
      return;
    }

    // NOTE: This assumes you have a downloadZip function in your useApi hook
    // If not, this part will need to be implemented or removed.
    // For now, we assume it exists as per your older code.
    try {
      const response = await fetch(
        import.meta.env.PROD 
          ? "/api/v1/certificates/download_zip"
          : "http://127.0.0.1:5000/api/v1/certificates/download_zip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_paths: filePaths }),
        }
      );
      if (!response.ok) throw new Error("Failed to create ZIP file.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("ZIP download failed:", e);
      alert("Failed to download ZIP file.");
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 10));
      }, 200);
    } else {
      setProgress(100);
    }
    return () => {
      clearInterval(timer);
    };
  }, [loading]);

  return (
    <div className="min-h-screen relative py-16 px-4">
      {/* --- The rest of your JSX remains exactly the same --- */}
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
                  We'll create certificates using the{" "}
                  {selectedTemplate || "selected"} template.
                </p>
              </div>

              <Tabs
                value={selectedFormat}
                onValueChange={(value) =>
                  setSelectedFormat(value as OutputFormat)
                }
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="png">PNG</TabsTrigger>
                  <TabsTrigger value="jpeg">JPEG</TabsTrigger>
                </TabsList>
              </Tabs>

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

{loading && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 animate-slide-up">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Generating Certificates
                </h3>
                <p className="text-muted-foreground">Please wait...</p>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center animate-slide-up">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold my-4 text-destructive">
              Generation Failed
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-8 bg-gradient-card shadow-elegant border-0 text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold my-4">
                Certificates Generated!
              </h3>
              <p className="text-muted-foreground">
                {result.successful} of {result.total_recipients} certificates
                created.
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Button variant="hero" onClick={downloadAllCertificates}>
                  <Archive className="w-4 h-4 mr-2" /> Download All (.ZIP)
                </Button>
                <Button variant="outline" disabled>
                  <Mail className="w-4 h-4 mr-2" /> Email (Soon)
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-elegant border-0">
              <h4 className="font-semibold mb-4">Results</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {result.results.map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <span>{cert.recipient}</span>
                    {cert.status === "success" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadCertificate(cert)}
                      >
                        <Download className="w-4 h-4 text-green-500" />
                      </Button>
                    ) : (
                      <span className="text-xs text-destructive">
                        {cert.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="px-8">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};
