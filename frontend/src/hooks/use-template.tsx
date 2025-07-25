import * as React from "react";
import { useApi, type Template } from "./use-api";

export function useTemplate(
  defaultTemplate: string = "achievement_template.html"
) {
  const [selected, setSelected] = React.useState<string>(defaultTemplate);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const { listTemplates, loading, error } = useApi();

  React.useEffect(() => {
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
        setTemplates(templateList);

        // Set default template if available
        if (
          templateList.length > 0 &&
          !templateList.find((t) => t.name === selected)
        ) {
          setSelected(templateList[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };

    fetchTemplates();
  }, []);

  return {
    selected,
    setSelected,
    templates,
    loading,
    error,
  };
}
