// import { useRef } from "react";
import { useState, useEffect } from "react";
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
  course: string;
  date: string;
  instructor: string;
}

export const UploadSection = ({ onNext }: UploadSectionProps) => {
  const { file, onUpload } = useCertificate();
  const [csvData, setCsvData] = useState<File | null>(file);
  const [manualData, setManualData] = useState<CertificateData[]>([
    { name: "", course: "", date: "", instructor: "" },
  ]);

  // Sync csvData with context file
  useEffect(() => {
    setCsvData(file);
  }, [file]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvData(file);
      onUpload(file); // Update context
    }
  };

  const addManualEntry = () => {
    setManualData([
      ...manualData,
      { name: "", course: "", date: "", instructor: "" },
    ]);
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
    const headers = ["name", "course", "date", "instructor"];
    const csvContent = [
      headers.join(","),
      ...manualData
        .filter((entry) => entry.name.trim() !== "")
        .map((entry) =>
          [entry.name, entry.course, entry.date, entry.instructor]
            .map((field) => `"${field || ""}"`)
            .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
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
            Choose how you'd like to provide the certificate recipient
            information
          </p>
        </div>
        <Card className="p-8 bg-gradient-card shadow-elegant border-0">
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>
            <TabsContent value="csv" className="space-y-6">
              <div className="relative border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Drop your CSV file here</h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer z-10"
                  tabIndex={-1}
                  aria-label="Upload CSV file"
                />
              </div>
              {csvData && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">{csvData.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvData(null);
                        onUpload(null); // Clear context
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                <p className="text-sm text-muted-foreground">
                  Your CSV should include columns: Name, Course, Date,
                  Instructor
                </p>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="space-y-6">
              <div className="space-y-4">
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
                      <div>
                        <Label htmlFor={`name-${index}`}>Recipient Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={entry.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateManualEntry(index, "name", e.target.value)
                          }
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`course-${index}`}>Course Name</Label>
                        <Input
                          id={`course-${index}`}
                          value={entry.course}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateManualEntry(index, "course", e.target.value)
                          }
                          placeholder="React Development Fundamentals"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`date-${index}`}>Completion Date</Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={entry.date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateManualEntry(index, "date", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`instructor-${index}`}>
                          Instructor
                        </Label>
                        <Input
                          id={`instructor-${index}`}
                          value={entry.instructor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateManualEntry(
                              index,
                              "instructor",
                              e.target.value
                            )
                          }
                          placeholder="Jane Smith"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addManualEntry}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Certificate
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
