import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useApi } from "../hooks/use-api";

// Mock the useApi hook
vi.mock("../hooks/use-api");

describe("useApi Hook", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listTemplates", () => {
    it("should fetch templates successfully", async () => {
      const mockTemplates = {
        html: ["template1.html", "template2.html"],
        images: ["img1.png"],
        pptx: ["pres1.pptx"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: mockTemplates }),
      });

      const { result } = renderHook(() => useApi());

      const templates = await result.current.listTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/templates"
      );
      expect(templates).toEqual(mockTemplates);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useApi());

      await expect(result.current.listTemplates()).rejects.toThrow(
        "Network error"
      );
      expect(result.current.error).toBe("Network error");
    });

    it("should handle HTTP error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const { result } = renderHook(() => useApi());

      await expect(result.current.listTemplates()).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });
  });

  describe("generateCertificatesSync", () => {
    it("should generate certificates successfully", async () => {
      const mockRequest = {
        template_id: "test.html",
        output_format: "pdf" as const,
        recipients: [{ name: "John Doe" }],
      };

      const mockResponse = {
        status: "completed",
        total_recipients: 1,
        successful: 1,
        failed: 0,
        results: [{ recipient: "John Doe", status: "success" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useApi());

      const response = await result.current.generateCertificatesSync(
        mockRequest
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/certificates/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockRequest),
        }
      );
      expect(response).toEqual(mockResponse);
    });

    it("should handle generation error", async () => {
      const mockRequest = {
        template_id: "test.html",
        output_format: "pdf" as const,
        recipients: [{ name: "John Doe" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const { result } = renderHook(() => useApi());

      await expect(
        result.current.generateCertificatesSync(mockRequest)
      ).rejects.toThrow("HTTP 400: Bad Request");
    });
  });

  describe("generateCertificatesAsync", () => {
    it("should start async generation successfully", async () => {
      const mockRequest = {
        template_id: "test.html",
        output_format: "pdf" as const,
        recipients: [{ name: "John Doe" }],
      };

      const mockResponse = {
        status: "accepted",
        job_id: "job-123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useApi());

      const response = await result.current.generateCertificatesAsync(
        mockRequest
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/certificates/generate_async",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockRequest),
        }
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe("getJobStatus", () => {
    it("should get job status successfully", async () => {
      const mockResponse = {
        job_id: "job-123",
        state: "SUCCESS",
        result: { status: "completed" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useApi());

      const response = await result.current.getJobStatus("job-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/jobs/job-123"
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe("downloadZip", () => {
    it("should download ZIP file successfully", async () => {
      const mockBlob = new Blob(["zip content"], { type: "application/zip" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      // Mock DOM methods
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as any);
      const appendChildSpy = vi
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockLink as any);
      const removeChildSpy = vi
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockLink as any);
      const createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:url");
      const revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useApi());

      await result.current.downloadZip(
        ["cert1.pdf", "cert2.pdf"],
        "certificates.zip"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/certificates/download_zip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_paths: ["cert1.pdf", "cert2.pdf"],
            zip_name: "certificates.zip",
          }),
        }
      );

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockLink.click).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it("should handle download error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const { result } = renderHook(() => useApi());

      await expect(result.current.downloadZip(["cert1.pdf"])).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });
  });

  describe("checkHealth", () => {
    it("should check API health successfully", async () => {
      const mockResponse = { status: "ok" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useApi());

      const response = await result.current.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/v1/health"
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe("loading states", () => {
    it("should set loading state during API calls", async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(mockPromise);

      const { result } = renderHook(() => useApi());

      // Start API call
      const promise = result.current.listTemplates();

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ templates: {} }),
      });

      await promise;

      // Should no longer be loading
      expect(result.current.loading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useApi());

      await expect(result.current.listTemplates()).rejects.toThrow(
        "Network error"
      );
      expect(result.current.error).toBe("Network error");
    });

    it("should handle JSON parsing errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { result } = renderHook(() => useApi());

      await expect(result.current.listTemplates()).rejects.toThrow(
        "Invalid JSON"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useApi());

      const response = await result.current.listTemplates();
      expect(response).toBeNull();
    });

    it("should handle malformed URLs", async () => {
      // Test with invalid base URL
      const { result } = renderHook(() => useApi());

      // This should still attempt the fetch but may fail
      mockFetch.mockRejectedValueOnce(new Error("Invalid URL"));

      await expect(result.current.listTemplates()).rejects.toThrow(
        "Invalid URL"
      );
    });

    it("should handle concurrent API calls", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ templates: { html: ["template1.html"] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: "ok" }),
        });

      const { result } = renderHook(() => useApi());

      // Make concurrent calls
      const [templatesResult, healthResult] = await Promise.all([
        result.current.listTemplates(),
        result.current.checkHealth(),
      ]);

      expect(templatesResult).toEqual({ html: ["template1.html"] });
      expect(healthResult).toEqual({ status: "ok" });
    });
  });
});

// Helper function to render hooks (simplified version)
function renderHook(callback: () => any) {
  let result: any;

  function TestComponent() {
    result = callback();
    return null;
  }

  render(<TestComponent />);

  return { result };
}
