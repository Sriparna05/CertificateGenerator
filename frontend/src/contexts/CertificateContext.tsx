// src/contexts/CertificateContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import Papa from "papaparse";
import { useApi, type Template } from "../hooks/use-api"; // Assuming useApi and Template are here

interface CertificateContextType {
  file: File | null;
  onUpload: (file: File | null) => void;

  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;

  selectedTemplate: string | null;
  setSelectedTemplate: (template: string | null) => void;

  // NEW: State for pre-fetched preview content
  templateContents: Record<string, string>;
  previewsLoading: boolean;

  generate: (
    file: File,
    templateId: string,
    isAsync: boolean,
    format: "pdf" | "html" | "png" | "jpeg"
  ) => Promise<void>;
  generateLoading: boolean;
  generateError: string | null;
  generateResult: any | null;
}

const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined
);

export const CertificateProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Use the API hook inside the context
  const { listTemplates, getTemplateContent } = useApi();

  // State for the template list
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // NEW: State for preview content
  const [templateContents, setTemplateContents] = useState<
    Record<string, string>
  >({});
  const [previewsLoading, setPreviewsLoading] = useState(true);

  // Effect to fetch the list of templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const response = await listTemplates();
        const templateList: Template[] = response.templates.html.map(
          (name) => ({ name, type: "html" })
        );
        // Add other types (images, pptx) if needed
        setTemplates(templateList);
      } catch (err: any) {
        setTemplatesError(err.message || "Failed to fetch templates");
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, [listTemplates]);

  // NEW: Effect to fetch HTML content for all templates once the list is available
  useEffect(() => {
    if (!templatesLoading && templates.length > 0) {
      const fetchAllPreviews = async () => {
        setPreviewsLoading(true);
        const htmlTemplates = templates.filter((t) => t.type === "html");

        const promises = htmlTemplates.map((template) =>
          getTemplateContent(template.name)
            .then((content) => ({ name: template.name, content }))
            .catch(() => ({ name: template.name, content: null }))
        );

        const results = await Promise.all(promises);
        const contents = results.reduce((acc, result) => {
          if (result.content) {
            acc[result.name] = result.content;
          }
          return acc;
        }, {} as Record<string, string>);

        setTemplateContents(contents);
        setPreviewsLoading(false);
      };
      fetchAllPreviews();
    }
  }, [templates, templatesLoading, getTemplateContent]);

  const onUpload = (uploadedFile: File | null) => setFile(uploadedFile);

  // ... (generate function and its state)
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<any | null>(null);
  const generate = async (
    dataFile: File,
    templateId: string,
    isAsync: boolean,
    format: "pdf" | "html" | "png" | "jpeg"
  ) => {
    /* ... your generate logic ... */
  };

  const value = {
    file,
    onUpload,
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    setSelectedTemplate,
    templateContents,
    previewsLoading, // Expose new state
    generate,
    generateLoading,
    generateError,
    generateResult,
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
    throw new Error("useCertificate must be used within a CertificateProvider");
  }
  return context;
};
