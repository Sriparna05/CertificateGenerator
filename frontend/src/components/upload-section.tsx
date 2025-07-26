import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui";
import { Upload, FileText, Plus, X } from "lucide-react";
import { TechBackground } from "./tech-background";
import { useCertificate } from "../contexts/CertificateContext";

interface UploadSectionProps {
  onNext: () => void;
}

interface CertificateData {
  name: string;
  guardian_name: string;
  stream: string;
  school_college: string;
  publish_date: string;
  duration: string;
  organization: string;
  completion_date: string;
}

const initialEntry: CertificateData = {
  name: "",
  guardian_name: "",
  stream: "",
  school_college: "",
  publish_date: "",
  duration: "",
  organization: "",
  completion_date: "",
};

export const UploadSection = ({ onNext }: UploadSectionProps) => {
  const { file, onUpload } = useCertificate();
  const [csvData, setCsvData] = useState<File | null>(file);
  const [manualData, setManualData] = useState<CertificateData[]>([
    initialEntry,
  ]);

  useEffect(() => {
    setCsvData(file);
  }, [file]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setCsvData(selectedFile);
      onUpload(selectedFile);
    }
  };

  const addManualEntry = () => {
    setManualData([...manualData, initialEntry]);
  };

  const removeManualEntry = (index: number) => {
    setManualData(manualData.filter((_, i) => i !== index));
  };

  const updateManualEntry = (
    index: number,
    field: keyof CertificateData,
    value: string
  ) => {
    const updated = manualData.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setManualData(updated);
  };

  const createCSVFromManualData = () => {
    const headers: (keyof CertificateData)[] = [
      "name",
      "guardian_name",
      "stream",
      "school_college",
      "publish_date",
      "duration",
      "organization",
      "completion_date",
    ];

    // Helper to safely format a CSV field
    const formatField = (value: string) => {
      const strValue = String(value || "");
      // If the value contains a comma, a double quote, or a newline, enclose it in double quotes.
      if (/[,"\n]/.test(strValue)) {
        // Also, escape any existing double quotes by doubling them up.
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    const csvRows = manualData
      .filter((entry) => entry.name.trim() !== "")
      .map((entry) =>
        headers.map((header) => formatField(entry[header])).join(",")
      );

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    return new File([blob], "manual-data.csv", { type: "text/csv" });
  };

  const handleContinue = () => {
    if (csvData) {
      onUpload(csvData);
    } else if (manualData.some((entry) => entry.name.trim() !== "")) {
      const generatedCSV = createCSVFromManualData();
      onUpload(generatedCSV);
    }
    onNext();
  };

  const hasValidData =
    csvData || manualData.some((entry) => entry.name.trim() !== "");

  return (
    <div className="min-h-screen relative py-16 px-4">
      <TechBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Upload Recipient Data</h1>
          <p className="text-xl text-muted-foreground">
            Provide recipient information via CSV or manual entry
          </p>
        </div>
        <Card className="p-8 bg-gradient-card shadow-elegant border-0">
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload CSV
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-6">
              {/* CSV Upload UI */}
              <div className="relative border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">
                  Drop your CSV file here or click to browse
                </h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {csvData && (
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="w-5 h-5 text-primary" />
                    {csvData.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCsvData(null);
                      onUpload(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>
                  <strong>Required Headers:</strong> name, guardian_name,
                  stream, school_college, publish_date, duration, organization,
                  completion_date
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              {/* Manual Entry UI */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {manualData.map((entry, index) => (
                  <Card key={index} className="p-4 bg-background/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Certificate #{index + 1}</h4>
                      {manualData.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeManualEntry(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(initialEntry).map((key) => (
                        <div key={key}>
                          <Label htmlFor={`${key}-${index}`}>
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            {key === "name" && "*"}
                          </Label>
                          <Input
                            id={`${key}-${index}`}
                            type={key.includes("_date") ? "date" : "text"}
                            value={entry[key as keyof CertificateData]}
                            onChange={(e) =>
                              updateManualEntry(
                                index,
                                key as keyof CertificateData,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addManualEntry}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Certificate
              </Button>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end mt-8">
            <Button
              variant="hero"
              onClick={handleContinue}
              disabled={!hasValidData}
              className="px-8"
            >
              Continue to Templates
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
