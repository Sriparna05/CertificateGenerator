import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  CertificateProvider,
  useCertificate,
} from "../contexts/CertificateContext";
import * as useUploadModule from "../hooks/use-upload";
import * as useTemplateModule from "../hooks/use-template";
import * as useGenerateModule from "../hooks/use-generate";

// Mock the hooks
vi.mock("../hooks/use-upload");
vi.mock("../hooks/use-template");
vi.mock("../hooks/use-generate");

describe("CertificateContext", () => {
  const mockUploadHook = {
    file: null,
    error: null,
    onUpload: vi.fn(),
  };

  const mockTemplateHook = {
    selected: "modern_excellence.html",
    setSelected: vi.fn(),
    templates: [
      { name: "modern_excellence.html", type: "html" as const },
      { name: "professional_training.html", type: "html" as const },
    ],
    loading: false,
    error: null,
  };

  const mockGenerateHook = {
    loading: false,
    error: null,
    result: null,
    generate: vi.fn(),
    jobId: null,
    isPolling: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUploadModule.useUpload).mockReturnValue(mockUploadHook);
    vi.mocked(useTemplateModule.useTemplate).mockReturnValue(mockTemplateHook);
    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(mockGenerateHook);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CertificateProvider>{children}</CertificateProvider>
  );

  it("should provide all certificate context values", () => {
    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current).toEqual({
      // Upload state
      file: null,
      uploadError: null,
      onUpload: expect.any(Function),

      // Template state
      selectedTemplate: "modern_excellence.html",
      setSelectedTemplate: expect.any(Function),
      templates: [
        { name: "modern_excellence.html", type: "html" },
        { name: "professional_training.html", type: "html" },
      ],
      templatesLoading: false,
      templatesError: null,

      // Generation state
      generateLoading: false,
      generateError: null,
      generateResult: null,
      generate: expect.any(Function),
      jobId: null,
      isPolling: false,

      // Utility functions
      reset: expect.any(Function),
      canGenerate: false, // false because no file is uploaded
    });
  });

  it("should calculate canGenerate correctly when ready", () => {
    // Mock with file uploaded and template selected
    const mockWithFile = {
      ...mockUploadHook,
      file: new File(["test"], "test.csv", { type: "text/csv" }),
    };

    vi.mocked(useUploadModule.useUpload).mockReturnValue(mockWithFile);

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.canGenerate).toBe(true);
  });

  it("should calculate canGenerate as false when loading", () => {
    const mockWithFileAndLoading = {
      ...mockUploadHook,
      file: new File(["test"], "test.csv", { type: "text/csv" }),
    };

    const mockGenerateLoading = {
      ...mockGenerateHook,
      loading: true,
    };

    vi.mocked(useUploadModule.useUpload).mockReturnValue(
      mockWithFileAndLoading
    );
    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(
      mockGenerateLoading
    );

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.canGenerate).toBe(false);
  });

  it("should call reset function correctly", () => {
    const mockWithFile = {
      ...mockUploadHook,
      file: new File(["test"], "test.csv", { type: "text/csv" }),
    };

    vi.mocked(useUploadModule.useUpload).mockReturnValue(mockWithFile);

    const { result } = renderHook(() => useCertificate(), { wrapper });

    act(() => {
      result.current.reset();
    });

    expect(mockUploadHook.onUpload).toHaveBeenCalledWith(null);
    expect(mockTemplateHook.setSelected).toHaveBeenCalledWith(
      "modern_excellence.html"
    );
  });

  it("should handle empty templates in reset", () => {
    const mockEmptyTemplates = {
      ...mockTemplateHook,
      templates: [],
    };

    vi.mocked(useTemplateModule.useTemplate).mockReturnValue(
      mockEmptyTemplates
    );

    const { result } = renderHook(() => useCertificate(), { wrapper });

    act(() => {
      result.current.reset();
    });

    expect(mockTemplateHook.setSelected).toHaveBeenCalledWith("");
  });

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useCertificate());
    }).toThrow("useCertificate must be used within a CertificateProvider");
  });

  it("should provide detailed error message when used outside provider", () => {
    expect(() => {
      renderHook(() => useCertificate());
    }).toThrow("Make sure to wrap your component with <CertificateProvider>");
  });

  it("should pass through all hook functions correctly", () => {
    const { result } = renderHook(() => useCertificate(), { wrapper });

    // Test that the functions are properly passed through
    expect(result.current.onUpload).toBe(mockUploadHook.onUpload);
    expect(result.current.setSelectedTemplate).toBe(
      mockTemplateHook.setSelected
    );
    expect(result.current.generate).toBe(mockGenerateHook.generate);
  });

  it("should handle loading states correctly", () => {
    const mockTemplateLoading = {
      ...mockTemplateHook,
      loading: true,
    };

    const mockGenerateLoading = {
      ...mockGenerateHook,
      loading: true,
      isPolling: true,
    };

    vi.mocked(useTemplateModule.useTemplate).mockReturnValue(
      mockTemplateLoading
    );
    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(
      mockGenerateLoading
    );

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.templatesLoading).toBe(true);
    expect(result.current.generateLoading).toBe(true);
    expect(result.current.isPolling).toBe(true);
    expect(result.current.canGenerate).toBe(false); // Should be false when loading
  });

  it("should handle error states correctly", () => {
    const mockUploadError = {
      ...mockUploadHook,
      error: "Upload failed",
    };

    const mockTemplateError = {
      ...mockTemplateHook,
      error: "Template loading failed",
    };

    const mockGenerateError = {
      ...mockGenerateHook,
      error: "Generation failed",
    };

    vi.mocked(useUploadModule.useUpload).mockReturnValue(mockUploadError);
    vi.mocked(useTemplateModule.useTemplate).mockReturnValue(mockTemplateError);
    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(mockGenerateError);

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.uploadError).toBe("Upload failed");
    expect(result.current.templatesError).toBe("Template loading failed");
    expect(result.current.generateError).toBe("Generation failed");
  });

  it("should handle async generation state correctly", () => {
    const mockAsyncGenerate = {
      ...mockGenerateHook,
      jobId: "job-123",
      isPolling: true,
      loading: true,
    };

    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(mockAsyncGenerate);

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.jobId).toBe("job-123");
    expect(result.current.isPolling).toBe(true);
    expect(result.current.generateLoading).toBe(true);
  });

  it("should handle generation results correctly", () => {
    const mockResult = {
      status: "completed",
      successful: 2,
      failed: 0,
      results: [
        {
          recipient: "User 1",
          file_path: "/path/to/cert1.pdf",
          status: "success",
        },
        {
          recipient: "User 2",
          file_path: "/path/to/cert2.pdf",
          status: "success",
        },
      ],
    };

    const mockGenerateWithResult = {
      ...mockGenerateHook,
      result: mockResult,
    };

    vi.mocked(useGenerateModule.useGenerate).mockReturnValue(
      mockGenerateWithResult
    );

    const { result } = renderHook(() => useCertificate(), { wrapper });

    expect(result.current.generateResult).toEqual(mockResult);
  });
});
