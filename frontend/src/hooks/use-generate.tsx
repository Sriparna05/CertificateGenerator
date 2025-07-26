// src/hooks/use-generate.ts

import { useState, useCallback } from "react";
import { useApi, type GenerateRequest, type Recipient } from "./use-api";
import Papa from "papaparse";

const parseCSVFile = (file: File): Promise<Recipient[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          return reject(
            new Error(`CSV parsing error: ${results.errors[0].message}`)
          );
        }
        if (!results.data.length) {
          return reject(
            new Error("CSV file is empty or contains no valid data rows.")
          );
        }
        const validData = results.data.filter((row) =>
          Object.values(row as object).some((val) => val !== null && val !== "")
        );
        const recipients: Recipient[] = validData.map((row: any) => ({
          name: row.name || "Unnamed Recipient",
          guardian_name: row.guardian_name || undefined,
          stream: row.stream || undefined,
          school_college: row.school_college || undefined,
          publish_date: row.publish_date || undefined,
          duration: row.duration || undefined,
          organization: row.organization || undefined,
          completion_date: row.completion_date || undefined,
        }));
        resolve(recipients);
      },
      error: (err: Error) => {
        reject(new Error(`Failed to parse CSV file: ${err.message}`));
      },
    });
  });
};

export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const { generateCertificatesSync, generateCertificatesAsync, getJobStatus } =
    useApi();

  const startPolling = useCallback(
    async (currentJobId: string) => {
      /* ... (no changes needed here) ... */
    },
    [getJobStatus]
  );

  const generate = useCallback(
    async (
      file: File,
      template: string,
      isAsync: boolean = false,
      outputFormat: "pdf" | "html" | "png" | "jpeg" = "pdf"
    ) => {
      // Log #A: We have entered the real generate function
      console.log("--- DEBUG (use-generate): 'generate' function started ---");

      setLoading(true);
      setError(null);
      setResult(null);
      setJobId(null);
      setIsPolling(false);

      try {
        // Log #B: About to parse the CSV
        console.log("DEBUG (use-generate): Parsing CSV file...");
        const recipients = await parseCSVFile(file);
        // Log #C: CSV parsing was successful
        console.log(
          "DEBUG (use-generate): CSV parsing SUCCEEDED. Recipients found:",
          recipients
        );

        const request: GenerateRequest = {
          template_id: template,
          output_format: outputFormat,
          recipients,
        };

        if (isAsync) {
          // ... (async logic)
        } else {
          // Log #D: About to call the backend API
          console.log(
            "DEBUG (use-generate): Calling backend API (generateCertificatesSync)..."
          );
          const response = await generateCertificatesSync(request);
          // Log #E: Backend API call was successful
          console.log(
            "DEBUG (use-generate): Backend API call SUCCEEDED. Response:",
            response
          );
          setResult(response);
        }
      } catch (e: any) {
        // Log #F: An error was caught somewhere in the 'try' block
        console.error("--- DEBUG (use-generate): CAUGHT AN ERROR ---");
        console.error(e);
        setError(e.message || "An unknown error occurred during generation.");
      } finally {
        // Log #G: The 'finally' block is executing
        console.log(
          "--- DEBUG (use-generate): 'generate' function finished (finally block) ---"
        );
        if (!isAsync) {
          setLoading(false);
        }
      }
    },
    [generateCertificatesSync, generateCertificatesAsync, startPolling]
  );

  return {
    loading,
    error,
    result,
    jobId,
    isPolling,
    generate,
  };
}
