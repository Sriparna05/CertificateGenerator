import { useState, useCallback } from "react";

const API_BASE_URL = "http://127.0.0.1:5000/api/v1";

export interface Template {
  name: string;
  type: "html" | "image" | "pptx";
}

export interface Recipient {
  name: string;
  guardian_name?: string;
  stream?: string;
  school_college?: string;
  publish_date?: string;
  duration?: string;
  organization?: string;
  completion_date?: string;
  [key: string]: string | undefined;
}

export interface GenerateRequest {
  template_id: string;
  output_format: "pdf" | "html" | "png" | "jpeg";
  recipients: Recipient[];
  ai_options?: {
    prompt?: string;
  };
}

export interface GenerateResponse {
  status: string;
  total_recipients: number;
  successful: number;
  failed: number;
  results: Array<{
    recipient: string;
    certificate_id: string | null;
    file_path: string | null;
    status: string;
    error?: string;
  }>;
}

export interface AsyncJobResponse {
  status: string;
  job_id: string;
}

export interface JobStatusResponse {
  job_id: string;
  state: string;
  result: GenerateResponse | null;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listTemplates = useCallback(async (): Promise<{
    templates: { html: string[]; images: string[]; pptx: string[] };
  }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch templates";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- THIS IS THE CORRECTED FUNCTION ---
  const generateCertificatesSync = useCallback(
    async (request: GenerateRequest): Promise<GenerateResponse> => {
      setLoading(true);
      setError(null);
      try {
        // These credentials match the 'users' dictionary in your routes.py
        const username = "admin";
        const password = "password123";

        const response = await fetch(`${API_BASE_URL}/certificates/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // The 'Authorization' header is required by the backend's @auth.login_required
            // It sends the username and password for Basic HTTP Authentication.
            Authorization: "Basic " + btoa(`${username}:${password}`),
          },
          body: JSON.stringify(request),
        });

        const resultData = await response.json();
        if (!response.ok) {
          throw new Error(
            resultData.message ||
              resultData.errors ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }
        return resultData;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate certificates";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateCertificatesAsync = useCallback(
    async (request: GenerateRequest): Promise<AsyncJobResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/certificates/generate_async`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }
        return await response.json();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit async job";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getJobStatus = useCallback(
    async (jobId: string): Promise<JobStatusResponse> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get job status";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkHealth = useCallback(async (): Promise<{ status: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check API health";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadZip = useCallback(
    async (filePaths: string[], zipName?: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/certificates/download_zip`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_paths: filePaths,
              zip_name: zipName,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          zipName ||
          `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to download ZIP";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getTemplateContent = useCallback(
    async (templateId: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/templates/${templateId}/content`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch template content";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    listTemplates,
    generateCertificatesSync,
    generateCertificatesAsync,
    getJobStatus,
    checkHealth,
    downloadZip,
    getTemplateContent,
  };
}
