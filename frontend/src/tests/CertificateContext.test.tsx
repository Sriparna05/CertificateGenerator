// src/contexts/CertificateContext.tsx

import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import { useUpload } from "../hooks/use-upload";
import { useTemplate } from "../hooks/use-template";
import { useGenerate } from "../hooks/use-generate";
import type { Template } from "../hooks/use-api";

// Define the shape of the combined context
interface CertificateContextType {
  // From useUpload
  file: File | null;
  uploadError: string | null;
  onUpload: (file: File | null) => void;

  // From useTemplate
  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;
  selectedTemplate: string | null;
  setSelectedTemplate: (template: string | null) => void;

  // From useGenerate
  generate: (
    file: File,
    template: string,
    isAsync: boolean,
    outputFormat: "pdf" | "html" | "png" | "jpeg"
  ) => Promise<void>;
  generateLoading: boolean;
  generateError: string | null;
  generateResult: any | null;

  // Derived state
  canGenerate: boolean;
  reset: () => void;
}

const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined
);

export const CertificateProvider = ({ children }: { children: ReactNode }) => {
  // Use the individual hooks to manage their own logic
  const { file, error: uploadError, onUpload } = useUpload();
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    selected: selectedTemplate,
    setSelected: setSelectedTemplate,
  } = useTemplate();
  const {
    loading: generateLoading,
    error: generateError,
    result: generateResult,
    generate,
  } = useGenerate();

  // Combine and derive state for the rest of the app
  const canGenerate = useMemo(() => {
    return (
      !!file && !!selectedTemplate && !generateLoading && !templatesLoading
    );
  }, [file, selectedTemplate, generateLoading, templatesLoading]);

  const reset = () => {
    onUpload(null);
    if (templates && templates.length > 0) {
      setSelectedTemplate(templates[0].name);
    }
  };

  // The value provided by the context
  const value = {
    file,
    uploadError,
    onUpload,
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    setSelectedTemplate,
    generate,
    generateLoading,
    generateError,
    generateResult,
    canGenerate,
    reset,
  };

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
};

export const useCertificate = (): CertificateContextType => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error(
      "useCertificate must be used within a CertificateProvider."
    );
  }
  return context;
};
