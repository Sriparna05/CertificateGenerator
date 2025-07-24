import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useUpload } from "../hooks/use-upload";
import { useTemplate } from "../hooks/use-template";
import { useGenerate } from "../hooks/use-generate";

interface CertificateContextType {
  // Upload state
  file: File | null;
  uploadError: string | null;
  onUpload: (file: File | null) => void;

  // Template state
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templates: Array<{ name: string; type: "html" | "image" | "pptx" }>;
  templatesLoading: boolean;
  templatesError: string | null;

  // Generation state
  generateLoading: boolean;
  generateError: string | null;
  generateResult: any;
  generate: (file: File, template: string, isAsync?: boolean) => Promise<void>;
  jobId: string | null;
  isPolling: boolean;
}

const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined
);

export function CertificateProvider({ children }: { children: ReactNode }) {
  const uploadHook = useUpload();
  const templateHook = useTemplate();
  const generateHook = useGenerate();

  const contextValue: CertificateContextType = {
    // Upload state
    file: uploadHook.file,
    uploadError: uploadHook.error,
    onUpload: uploadHook.onUpload,

    // Template state
    selectedTemplate: templateHook.selected,
    setSelectedTemplate: templateHook.setSelected,
    templates: templateHook.templates,
    templatesLoading: templateHook.loading,
    templatesError: templateHook.error,

    // Generation state
    generateLoading: generateHook.loading,
    generateError: generateHook.error,
    generateResult: generateHook.result,
    generate: generateHook.generate,
    jobId: generateHook.jobId,
    isPolling: generateHook.isPolling,
  };

  return (
    <CertificateContext.Provider value={contextValue}>
      {children}
    </CertificateContext.Provider>
  );
}

export function useCertificate() {
  const context = useContext(CertificateContext);
  if (context === undefined) {
    throw new Error("useCertificate must be used within a CertificateProvider");
  }
  return context;
}
