// src/hooks/use-upload.ts

import { useState, useCallback } from "react";

export function useUpload(defaultFile: File | null = null) {
  const [file, setFile] = useState<File | null>(defaultFile);
  const [error, setError] = useState<string | null>(null);

  const onUpload = useCallback((newFile: File | null) => {
    if (newFile && !["text/csv"].includes(newFile.type)) {
      setError("Invalid file type. Please upload a CSV file.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(newFile);
  }, []);

  return {
    file,
    error,
    onUpload,
  };
}
