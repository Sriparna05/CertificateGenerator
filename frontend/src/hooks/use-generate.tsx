import * as React from "react";

export function useGenerate() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);

  const generate = async (file: File, template: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((res) => setTimeout(res, 1500));
      setResult({ success: true });
    } catch (e: any) {
      setError(e.message || "Failed to generate certificates");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    generate,
  };
}
