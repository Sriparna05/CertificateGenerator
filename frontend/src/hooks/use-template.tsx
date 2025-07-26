// src/hooks/use-template.ts

import { useState, useEffect, useMemo } from "react";
import { useApi, type Template } from "./use-api";

export function useTemplate(defaultTemplateName: string = "") {
  const [selected, setSelected] = useState<string | null>(defaultTemplateName);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const { listTemplates, loading, error } = useApi();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
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
        setAllTemplates(templateList);

        // Set a default selection if one isn't already set
        if (!selected && templateList.length > 0) {
          setSelected(templateList[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };
    fetchTemplates();
  }, [listTemplates]); // Removed 'selected' to prevent re-fetching on select

  const templates = useMemo(() => allTemplates, [allTemplates]);

  return {
    selected,
    setSelected,
    templates,
    loading,
    error,
  };
}
