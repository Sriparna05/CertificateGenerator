// src/contexts/CertificateContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Template } from "../hooks/use-api";
import { useApi } from "../hooks/use-api";
import { useUpload } from "../hooks/use-upload";
import { useGenerate } from "../hooks/use-generate";

interface CertificateContextType {
  file: File | null;
  onUpload: (file: File | null) => void;
  uploadError: string | null;

  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;

  // NEW: State for pre-fetched preview content is now part of the context
  templateContents: Record<string, string>;
  previewsLoading: boolean;

  selectedTemplate: string | null;
  setSelectedTemplate: (template: string | null) => void;

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
  const { file, onUpload, error: uploadError } = useUpload();
  const {
    loading: generateLoading,
    error: generateError,
    result: generateResult,
    generate,
  } = useGenerate();
  const { listTemplates, getTemplateContent } = useApi();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [templateContents, setTemplateContents] = useState<
    Record<string, string>
  >({});
  const [previewsLoading, setPreviewsLoading] = useState(true);

  // Effect 1: Fetch the list of templates
  useEffect(() => {
    const fetchTemplateList = async () => {
      try {
        setTemplatesLoading(true);
        const response = await listTemplates();
        const templateList: Template[] = [
          ...response.templates.html.map((name) => ({
            name,
            type: "html" as const,
          })),
          ...response.templates.images.map((name) => ({
            name,
            type: "image" as const,
          })),
          ...response.templates.pptx.map((name) => ({
            name,
            type: "pptx" as const,
          })),
        ];
        setTemplates(templateList);
        if (templateList.length > 0 && !selectedTemplate) {
          setSelectedTemplate(templateList[0].name);
        }
      } catch (err: any) {
        setTemplatesError(err.message || "Failed to fetch templates");
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplateList();
  }, [listTemplates]);

  // Effect 2: Fetch HTML content for all templates once the list is available
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
    } else if (!templatesLoading) {
      setPreviewsLoading(false); // Stop loading if no templates found
    }
  }, [templates, templatesLoading, getTemplateContent]);

  const value = {
    file,
    onUpload,
    uploadError,
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    setSelectedTemplate,
    templateContents,
    previewsLoading,
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
