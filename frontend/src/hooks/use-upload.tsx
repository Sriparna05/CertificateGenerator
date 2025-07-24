import * as React from "react";

export function useUpload() {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onUpload = (f: File | null) => {
    setFile(f);
    setError(null);
  };

  return {
    file,
    error,
    onUpload,
  };
}
