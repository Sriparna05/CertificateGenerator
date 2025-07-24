import { useCertificate } from "../contexts/CertificateContext";

export const DebugStatus = () => {
  const {
    file,
    selectedTemplate,
    templates,
    templatesLoading,
    templatesError,
    generateLoading,
    generateError,
    generateResult,
  } = useCertificate();

  return (
    <div className="fixed bottom-4 right-4 bg-background/90 backdrop-blur-sm border border-primary/20 rounded-lg p-4 text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Status</h3>
      <div className="space-y-1">
        <div>
          <strong>File:</strong> {file ? file.name : "None"}
        </div>
        <div>
          <strong>Template:</strong> {selectedTemplate || "None"}
        </div>
        <div>
          <strong>Templates loaded:</strong> {templates.length}
        </div>
        <div>
          <strong>Templates loading:</strong> {templatesLoading ? "Yes" : "No"}
        </div>
        <div>
          <strong>Templates error:</strong> {templatesError || "None"}
        </div>
        <div>
          <strong>Generate loading:</strong> {generateLoading ? "Yes" : "No"}
        </div>
        <div>
          <strong>Generate error:</strong> {generateError || "None"}
        </div>
        <div>
          <strong>Generate result:</strong> {generateResult ? "Yes" : "None"}
        </div>
      </div>
    </div>
  );
};
