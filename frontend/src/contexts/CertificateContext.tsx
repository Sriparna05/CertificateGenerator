import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useUpload } from "../hooks/use-upload";
import { useTemplate } from "../hooks/use-template";
import { useGenerate } from "../hooks/use-generate";
import type { Template } from "../hooks/use-api";

/**
 * Certificate context interface defining the state and actions
 * available throughout the certificate generation workflow
 */
interface CertificateContextType {
  // Upload state
  /** Currently uploaded file */
  file: File | null;
  /** Upload error message if any */
  uploadError: string | null;
  /** Function to handle file upload */
  onUpload: (file: File | null) => void;

  // Template state
  /** Currently selected template name */
  selectedTemplate: string;
  /** Function to set the selected template */
  setSelectedTemplate: (template: string) => void;
  /** Array of available templates */
  templates: Template[];
  /** Loading state for templates */
  templatesLoading: boolean;
  /** Template loading error if any */
  templatesError: string | null;

  // Generation state
  /** Loading state for certificate generation */
  generateLoading: boolean;
  /** Generation error message if any */
  generateError: string | null;
  /** Result of certificate generation */
  generateResult: any;
  /** Function to generate certificates */
  generate: (
    file: File,
    template: string,
    isAsync?: boolean,
    outputFormat?: "pdf" | "html" | "png" | "jpeg"
  ) => Promise<void>;
  /** Job ID for async generation */
  jobId: string | null;
  /** Polling state for async generation */
  isPolling: boolean;

  // Utility functions
  /** Reset all state to initial values */
  reset: () => void;
  /** Check if ready to generate certificates */
  canGenerate: boolean;
}

/**
 * Props for the CertificateProvider component
 */
interface CertificateProviderProps {
  children: ReactNode;
}

/**
 * Certificate context - provides certificate generation state and actions
 */
const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined
);

/**
 * Certificate Provider component that wraps the application and provides
 * certificate generation context to all child components
 */
export function CertificateProvider({ children }: CertificateProviderProps) {
  const uploadHook = useUpload();
  const templateHook = useTemplate();
  const generateHook = useGenerate();

  // Utility functions
  const reset = () => {
    uploadHook.onUpload(null);
    templateHook.setSelected(templateHook.templates[0]?.name || "");
    // Note: generateHook doesn't expose reset, but state will reset on next generation
  };

  const canGenerate = Boolean(
    uploadHook.file &&
      templateHook.selected &&
      !generateHook.loading &&
      !templateHook.loading
  );

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

    // Utility functions
    reset,
    canGenerate,
  };

  return (
    <CertificateContext.Provider value={contextValue}>
      {children}
    </CertificateContext.Provider>
  );
}

/**
 * Hook to access certificate context
 * @throws {Error} When used outside of CertificateProvider
 * @returns {CertificateContextType} Certificate context value
 */
export function useCertificate(): CertificateContextType {
  const context = useContext(CertificateContext);
  if (context === undefined) {
    throw new Error(
      "useCertificate must be used within a CertificateProvider. " +
        "Make sure to wrap your component with <CertificateProvider>."
    );
  }
  return context;
}
