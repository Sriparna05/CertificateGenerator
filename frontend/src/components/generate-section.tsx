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
    const downloadUrl = `http://127.0.0.1:5000/${cert.file_path}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = cert.file_path.split("/").pop(); // Use the original filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllCertificates = async () => {
    // ... (This function remains the same)
  };

  useEffect(() => {
    // ... (This effect remains the same)
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

        {/* ... The rest of the JSX for loading, error, and result states ... */}
      </div>
    </div>
  );
};
