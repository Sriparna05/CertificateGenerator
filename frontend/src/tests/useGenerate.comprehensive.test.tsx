import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerate } from "../hooks/use-generate";
import * as useApiModule from "../hooks/use-api";

// Mock the API hook
vi.mock("../hooks/use-api");

describe("useGenerate - Complete Image Generation Testing", () => {
  const mockGenerateSync = vi.fn();
  const mockGenerateAsync = vi.fn();
  const mockGetJobStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useApi return value
    vi.mocked(useApiModule.useApi).mockReturnValue({
      generateCertificatesSync: mockGenerateSync,
      generateCertificatesAsync: mockGenerateAsync,
      getJobStatus: mockGetJobStatus,
      downloadFile: vi.fn(),
      downloadZip: vi.fn(),
      getTemplates: vi.fn(),
    });
  });

  describe("Image Format Generation", () => {
    const createTestFile = (content: string) => {
      return new File([content], "test.csv", { type: "text/csv" });
    };

    const mockSuccessResult = (format: string, count: number = 1) => ({
      status: "completed",
      successful: count,
      failed: 0,
      results: Array.from({ length: count }, (_, i) => ({
        recipient: `Test User ${i + 1}`,
        certificate_id: `test-${i}`,
        file_path: `/path/to/cert_${i}.${format}`,
        status: "success",
      })),
    });

    it("should handle PNG generation successfully", async () => {
      const mockResult = mockSuccessResult("png");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());
      const csvFile = createTestFile("name,course\nJohn Doe,Web Development");

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith({
        template_id: "modern_excellence.html",
        output_format: "png",
        recipients: [{ name: "John Doe", course: "Web Development" }],
        ai_options: { prompt: "congratulatory" },
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toEqual(mockResult);
    });

    it("should handle JPEG generation successfully", async () => {
      const mockResult = mockSuccessResult("jpeg");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());
      const csvFile = createTestFile("name,course\nJane Smith,Data Science");

      await act(async () => {
        await result.current.generate(
          csvFile,
          "professional_training.html",
          false,
          "jpeg"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith({
        template_id: "professional_training.html",
        output_format: "jpeg",
        recipients: [{ name: "Jane Smith", course: "Data Science" }],
        ai_options: { prompt: "congratulatory" },
      });

      expect(result.current.result).toEqual(mockResult);
    });

    it("should handle all supported formats", async () => {
      const formats = ["pdf", "png", "jpeg", "html"];
      const { result } = renderHook(() => useGenerate());
      const csvFile = createTestFile("name,course\nTest User,Format Testing");

      for (const format of formats) {
        const mockResult = mockSuccessResult(format);
        mockGenerateSync.mockResolvedValue(mockResult);

        await act(async () => {
          await result.current.generate(
            csvFile,
            "classic_achievement.html",
            false,
            format
          );
        });

        expect(mockGenerateSync).toHaveBeenCalledWith(
          expect.objectContaining({
            output_format: format,
          })
        );
      }
    });
  });

  describe("Batch Image Generation", () => {
    it("should handle batch PNG generation", async () => {
      const batchSize = 10;
      const mockResult = mockSuccessResult("png", batchSize);
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      // Create CSV with multiple recipients
      const csvContent =
        "name,course,date\n" +
        Array.from(
          { length: batchSize },
          (_, i) => `Student ${i + 1},Course ${i + 1},2025-01-25`
        ).join("\n");

      const csvFile = new File([csvContent], "batch.csv", { type: "text/csv" });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          output_format: "png",
          recipients: expect.arrayContaining([
            expect.objectContaining({ name: "Student 1" }),
            expect.objectContaining({ name: "Student 10" }),
          ]),
        })
      );

      expect(result.current.result.successful).toBe(batchSize);
    });

    it("should handle large batch JPEG generation", async () => {
      const largeBatchSize = 50;
      const mockResult = mockSuccessResult("jpeg", largeBatchSize);
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      const csvContent =
        "name,course\n" +
        Array.from(
          { length: largeBatchSize },
          (_, i) => `Participant ${i + 1},Advanced Training ${i + 1}`
        ).join("\n");

      const csvFile = new File([csvContent], "large_batch.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "professional_training.html",
          false,
          "jpeg"
        );
      });

      expect(result.current.result.successful).toBe(largeBatchSize);
      expect(result.current.result.failed).toBe(0);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle special characters in image generation", async () => {
      const mockResult = mockSuccessResult("png");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      // CSV with special characters, unicode, and emojis
      const csvContent =
        "name,course,instructor\n" +
        '"François Müller","Advanced AI & ML 🤖 Course","Dr. José María García"';

      const csvFile = new File([csvContent], "special.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "elegant_excellence.html",
          false,
          "png"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: [
            expect.objectContaining({
              name: "François Müller",
              course: "Advanced AI & ML 🤖 Course",
              instructor: "Dr. José María García",
            }),
          ],
        })
      );

      expect(result.current.error).toBeNull();
    });

    it("should handle very long text content", async () => {
      const mockResult = mockSuccessResult("jpeg");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      const longName =
        "This Is An Extremely Long Name That Tests Text Wrapping And Layout Handling In Image Generation";
      const longCourse =
        "This Is An Exceptionally Long Course Title That Should Test How The System Handles Extended Text Content In Certificate Image Generation With Proper Wrapping And Formatting";

      const csvContent = `name,course\n"${longName}","${longCourse}"`;
      const csvFile = new File([csvContent], "long_text.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "professional_completion.html",
          false,
          "jpeg"
        );
      });

      expect(result.current.error).toBeNull();
      expect(result.current.result.successful).toBe(1);
    });

    it("should handle partial failures in batch generation", async () => {
      const mockResult = {
        status: "completed",
        successful: 3,
        failed: 2,
        results: [
          {
            recipient: "Success 1",
            file_path: "/path/to/cert1.png",
            status: "success",
          },
          {
            recipient: "Success 2",
            file_path: "/path/to/cert2.png",
            status: "success",
          },
          {
            recipient: "Success 3",
            file_path: "/path/to/cert3.png",
            status: "success",
          },
          {
            recipient: "Failed 1",
            file_path: null,
            status: "error",
            error: "Image generation failed",
          },
          {
            recipient: "Failed 2",
            file_path: null,
            status: "error",
            error: "Template processing error",
          },
        ],
      };

      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      const csvContent =
        "name,course\n" +
        "Success 1,Course 1\n" +
        "Success 2,Course 2\n" +
        "Success 3,Course 3\n" +
        "Failed 1,Bad Course 1\n" +
        "Failed 2,Bad Course 2";

      const csvFile = new File([csvContent], "partial_fail.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_achievement.html",
          false,
          "png"
        );
      });

      expect(result.current.result.successful).toBe(3);
      expect(result.current.result.failed).toBe(2);
      expect(result.current.error).toBeNull(); // Should not set global error for partial failures
    });

    it("should handle complete generation failure", async () => {
      mockGenerateSync.mockRejectedValue(
        new Error("Image conversion library not available")
      );

      const { result } = renderHook(() => useGenerate());
      const csvFile = new File(["name,course\nTest,Test Course"], "error.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        "Image conversion library not available"
      );
      expect(result.current.result).toBeNull();
    });

    it("should handle empty CSV file", async () => {
      const { result } = renderHook(() => useGenerate());
      const emptyFile = new File(["name,course"], "empty.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          emptyFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      expect(result.current.error).toBe(
        "CSV must have at least a header and one data row"
      );
    });

    it("should handle malformed CSV file", async () => {
      const { result } = renderHook(() => useGenerate());
      const malformedFile = new File(
        ["invalid,csv,data\nwith,missing"],
        "malformed.csv",
        { type: "text/csv" }
      );

      await act(async () => {
        await result.current.generate(
          malformedFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      // Should still process what it can
      expect(mockGenerateSync).toHaveBeenCalled();
    });
  });

  describe("Async Image Generation", () => {
    it("should handle async PNG generation with polling", async () => {
      const mockAsyncResult = { job_id: "img-job-123" };
      const mockJobComplete = {
        state: "SUCCESS",
        result: mockSuccessResult("png", 5),
      };

      mockGenerateAsync.mockResolvedValue(mockAsyncResult);
      mockGetJobStatus.mockResolvedValue(mockJobComplete);

      const { result } = renderHook(() => useGenerate());

      const csvContent =
        "name,course\n" +
        Array.from(
          { length: 5 },
          (_, i) => `User ${i + 1},Course ${i + 1}`
        ).join("\n");

      const csvFile = new File([csvContent], "async.csv", { type: "text/csv" });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "classic_achievement.html",
          true,
          "png"
        );
      });

      expect(mockGenerateAsync).toHaveBeenCalledWith({
        template_id: "classic_achievement.html",
        output_format: "png",
        recipients: expect.any(Array),
        ai_options: { prompt: "congratulatory" },
      });

      expect(result.current.jobId).toBe("img-job-123");
      expect(result.current.isPolling).toBe(true);

      // Simulate polling completion
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2100));
      });

      expect(result.current.result).toEqual(mockJobComplete.result);
      expect(result.current.loading).toBe(false);
      expect(result.current.isPolling).toBe(false);
    });

    it("should handle async job failure", async () => {
      const mockAsyncResult = { job_id: "fail-job-123" };
      const mockJobFailed = {
        state: "FAILURE",
        result: null,
      };

      mockGenerateAsync.mockResolvedValue(mockAsyncResult);
      mockGetJobStatus.mockResolvedValue(mockJobFailed);

      const { result } = renderHook(() => useGenerate());
      const csvFile = new File(["name,course\nTest,Test"], "fail.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_excellence.html",
          true,
          "jpeg"
        );
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2100));
      });

      expect(result.current.error).toBe("Job failed to complete");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Template Compatibility", () => {
    const templates = [
      "modern_excellence.html",
      "professional_training.html",
      "classic_achievement.html",
      "elegant_excellence.html",
      "modern_achievement.html",
      "professional_completion.html",
    ];

    templates.forEach((template) => {
      it(`should work with ${template} for PNG generation`, async () => {
        const mockResult = mockSuccessResult("png");
        mockGenerateSync.mockResolvedValue(mockResult);

        const { result } = renderHook(() => useGenerate());
        const csvFile = new File(
          ["name,course\nTest User,Test Course"],
          "test.csv",
          { type: "text/csv" }
        );

        await act(async () => {
          await result.current.generate(csvFile, template, false, "png");
        });

        expect(mockGenerateSync).toHaveBeenCalledWith(
          expect.objectContaining({
            template_id: template,
            output_format: "png",
          })
        );

        expect(result.current.error).toBeNull();
      });

      it(`should work with ${template} for JPEG generation`, async () => {
        const mockResult = mockSuccessResult("jpeg");
        mockGenerateSync.mockResolvedValue(mockResult);

        const { result } = renderHook(() => useGenerate());
        const csvFile = new File(
          ["name,course\nTest User,Test Course"],
          "test.csv",
          { type: "text/csv" }
        );

        await act(async () => {
          await result.current.generate(csvFile, template, false, "jpeg");
        });

        expect(mockGenerateSync).toHaveBeenCalledWith(
          expect.objectContaining({
            template_id: template,
            output_format: "jpeg",
          })
        );

        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("CSV Parsing Edge Cases", () => {
    it("should handle CSV with quoted fields containing commas", async () => {
      const mockResult = mockSuccessResult("png");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      const csvContent =
        "name,course,organization\n" +
        '"Smith, John","Advanced Programming, Part 1","Tech Corp, Inc."';

      const csvFile = new File([csvContent], "quoted.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "modern_excellence.html",
          false,
          "png"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: [
            expect.objectContaining({
              name: "Smith, John",
              course: "Advanced Programming, Part 1",
              organization: "Tech Corp, Inc.",
            }),
          ],
        })
      );
    });

    it("should handle CSV with missing fields", async () => {
      const mockResult = mockSuccessResult("png");
      mockGenerateSync.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useGenerate());

      const csvContent =
        "name,course,date,instructor\n" +
        "Complete User,Full Course,2025-01-25,Dr. Smith\n" +
        "Partial User,Basic Course\n" +
        "Another User,Another Course,2025-01-26";

      const csvFile = new File([csvContent], "missing_fields.csv", {
        type: "text/csv",
      });

      await act(async () => {
        await result.current.generate(
          csvFile,
          "professional_training.html",
          false,
          "png"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining([
            expect.objectContaining({
              name: "Complete User",
              instructor: "Dr. Smith",
            }),
            expect.objectContaining({ name: "Partial User" }),
            expect.objectContaining({
              name: "Another User",
              date: "2025-01-26",
            }),
          ]),
        })
      );
    });
  });
});
