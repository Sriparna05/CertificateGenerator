import * as React from "react";
import { useApi, type GenerateRequest, type Recipient } from "./use-api";

export function useGenerate() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);

  const { generateCertificatesSync, generateCertificatesAsync, getJobStatus } =
    useApi();

  const generate = async (
    file: File,
    template: string,
    isAsync: boolean = false,
    outputFormat: "pdf" | "html" | "png" | "jpeg" = "pdf"
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setJobId(null);

    try {
      // Parse CSV file to extract recipients
      const recipients = await parseCSVFile(file);

      const request: GenerateRequest = {
        template_id: template,
        output_format: outputFormat,
        recipients,
        ai_options: {
          prompt: "congratulatory",
        },
      };

      if (isAsync) {
        const response = await generateCertificatesAsync(request);
        setJobId(response.job_id);
        startPolling(response.job_id);
      } else {
        const response = await generateCertificatesSync(request);
        setResult(response);
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate certificates");
    } finally {
      if (!isAsync) {
        setLoading(false);
      }
    }
  };

  const startPolling = async (jobId: string) => {
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const response = await getJobStatus(jobId);

        if (response.state === "SUCCESS" || response.state === "FAILURE") {
          clearInterval(pollInterval);
          setResult(response.result);
          setLoading(false);
          setIsPolling(false);

          if (response.state === "FAILURE") {
            setError("Job failed to complete");
          }
        }
      } catch (e: any) {
        clearInterval(pollInterval);
        setError(e.message || "Failed to check job status");
        setLoading(false);
        setIsPolling(false);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isPolling) {
        setError("Job timeout - please check manually");
        setLoading(false);
        setIsPolling(false);
      }
    }, 300000);
  };

  const parseCSVFile = (file: File): Promise<Recipient[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            reject(
              new Error("CSV must have at least a header and one data row")
            );
            return;
          }

          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());
          const recipients: Recipient[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim());
            const recipient: Recipient = { name: "Unknown" };

            headers.forEach((header, index) => {
              if (values[index]) {
                recipient[header] = values[index];
              }
            });

            recipients.push(recipient);
          }

          resolve(recipients);
        } catch (err) {
          reject(new Error("Failed to parse CSV file"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  return {
    loading,
    error,
    result,
    jobId,
    isPolling,
    generate,
  };
}
