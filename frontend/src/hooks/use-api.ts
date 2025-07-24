import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:5000/api/v1";

export interface Template {
  name: string;
  type: "html" | "image" | "pptx";
}

export interface Recipient {
  name: string;
  course?: string;
  date?: string;
  instructor?: string;
  organization?: string;
  [key: string]: string | undefined;
}

export interface GenerateRequest {
  template_id: string;
  output_format: "pdf" | "png" | "jpeg";
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

  const listTemplates = async (): Promise<{
    templates: { html: string[]; images: string[]; pptx: string[] };
  }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch templates";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatesSync = async (
    request: GenerateRequest
  ): Promise<GenerateResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate certificates";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatesAsync = async (
    request: GenerateRequest
  ): Promise<AsyncJobResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/certificates/generate_async`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit async job";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get job status";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (): Promise<{ status: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check API health";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    listTemplates,
    generateCertificatesSync,
    generateCertificatesAsync,
    getJobStatus,
    checkHealth,
  };
}
