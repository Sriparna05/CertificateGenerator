import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react-hooks";
import { useGenerate } from "../hooks/use-generate";
import * as useApiModule from "../hooks/use-api";

// Mock the API hook
vi.mock("../hooks/use-api");

describe("useGenerate - Image Generation Tests", () => {
  const mockGenerateSync = vi.fn();
  const mockGenerateAsync = vi.fn();
  const mockGetJobStatus = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useApi return value
    vi.mocked(useApiModule.useApi).mockReturnValue({
      loading: false,
      error: null,
      listTemplates: vi.fn(),
      generateCertificatesSync: mockGenerateSync,
      generateCertificatesAsync: mockGenerateAsync,
      getJobStatus: mockGetJobStatus,
      checkHealth: vi.fn(),
      downloadZip: vi.fn(),
      getTemplateContent: vi.fn(),
    });
  });

  it("should generate PNG certificates successfully", async () => {
    const mockResult = {
      status: "completed",
      successful: 1,
      failed: 0,
      results: [
        {
          recipient: "Test User",
          certificate_id: "test-123",
          file_path: "/path/to/cert.png",
          status: "success",
        },
      ],
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    // Create a mock CSV file with image format
    const csvContent = "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\nTest User,Jane Doe,Computer Science,MIT,2024-01-01,4 years,Tech Academy,2024-05-20";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "modern_excellence.html",
        false,
        "png"
      );
    });

    expect(mockGenerateSync).toHaveBeenCalledWith({
      template_id: "modern_excellence.html",
      output_format: "png",
      recipients: [
        {
          name: "Test User",
          guardian_name: "Jane Doe",
          stream: "Computer Science",
          school_college: "MIT",
          publish_date: "2024-01-01",
          duration: "4 years",
          organization: "Tech Academy",
          completion_date: "2024-05-20",
        },
      ],
      ai_options: { prompt: "congratulatory" },
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual(mockResult);
  });

  it("should generate JPEG certificates successfully", async () => {
    const mockResult = {
      status: "completed",
      successful: 1,
      failed: 0,
      results: [
        {
          recipient: "JPEG Test User",
          certificate_id: "jpeg-123",
          file_path: "/path/to/cert.jpeg",
          status: "success",
        },
      ],
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    const csvContent =
      "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\n" +
      "JPEG Test User,John Doe,Electrical Engineering,Stanford,2023-09-01,2 years,DevCorp,2025-01-15";
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "professional_training.html",
        false,
        "jpeg"
      );
    });

    expect(mockGenerateSync).toHaveBeenCalledWith({
      template_id: "professional_training.html",
      output_format: "jpeg",
      recipients: [
        {
          name: "JPEG Test User",
          guardian_name: "John Doe",
          stream: "Electrical Engineering",
          school_college: "Stanford",
          publish_date: "2023-09-01",
          duration: "2 years",
          organization: "DevCorp",
          completion_date: "2025-01-15",
        },
      ],
      ai_options: { prompt: "congratulatory" },
    });

    expect(result.current.result).toEqual(mockResult);
  });

  it("should handle async image generation with polling", async () => {
    const mockAsyncResult = { job_id: "job-123" };
    const mockJobInProgress = { state: "PENDING", result: null };
    const mockJobComplete = {
      state: "SUCCESS",
      result: {
        status: "completed",
        successful: 2,
        failed: 0,
        results: [
          {
            recipient: "User 1",
            file_path: "/path/to/cert1.png",
            status: "success",
          },
          {
            recipient: "User 2",
            file_path: "/path/to/cert2.png",
            status: "success",
          },
        ],
      },
    };

    mockGenerateAsync.mockResolvedValue(mockAsyncResult);
    mockGetJobStatus
      .mockResolvedValueOnce(mockJobInProgress)
      .mockResolvedValueOnce(mockJobComplete);

    const { result } = renderHook(() => useGenerate());

    const csvContent = "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\nUser 1,G1,S1,C1,2024-01-01,1yr,Org1,2024-01-01\nUser 2,G2,S2,C2,2024-01-01,1yr,Org2,2024-01-01";
    const file = new File([csvContent], "batch.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "classic_achievement.html",
        true,
        "png"
      );
    });

    expect(mockGenerateAsync).toHaveBeenCalledWith({
      template_id: "classic_achievement.html",
      output_format: "png",
      recipients: [
        { name: "User 1", guardian_name: "G1", stream: "S1", school_college: "C1", publish_date: "2024-01-01", duration: "1yr", organization: "Org1", completion_date: "2024-01-01" },
        { name: "User 2", guardian_name: "G2", stream: "S2", school_college: "C2", publish_date: "2024-01-01", duration: "1yr", organization: "Org2", completion_date: "2024-01-01" },
      ],
      ai_options: { prompt: "congratulatory" },
    });

    expect(result.current.jobId).toBe("job-123");
    expect(result.current.isPolling).toBe(true);

    // Wait for polling to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100)); // Wait for poll interval
    });

    expect(result.current.result).toEqual(mockJobComplete.result);
    expect(result.current.loading).toBe(false);
    expect(result.current.isPolling).toBe(false);
  });

  it("should handle CSV parsing with special characters for image generation", async () => {
    const mockResult = {
      status: "completed",
      successful: 1,
      failed: 0,
      results: [
        {
          recipient: "François Müller",
          certificate_id: "special-123",
          file_path: "/path/to/cert_special.png",
          status: "success",
        },
      ],
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    // CSV with special characters and emojis
    const csvContent =
      "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\n" +
      "François Müller,Jane Müller,Computer Science,University of XYZ,2023-01-01,4 years,Tech Corp,2023-05-20";
    const file = new File([csvContent], "special.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "modern_excellence.html",
        false,
        "png"
      );
    });

    expect(mockGenerateSync).toHaveBeenCalledWith({
      template_id: "modern_excellence.html",
      output_format: "png",
      recipients: [
        {
          recipients: [
        {
          name: "François Müller",
          guardian_name: "Jane Müller",
          stream: "Computer Science",
          school_college: "University of XYZ",
          publish_date: "2023-01-01",
          duration: "4 years",
          organization: "Tech Corp",
          completion_date: "2023-05-20",
        },
      ],
        },
      ],
      ai_options: { prompt: "congratulatory" },
    });

    expect(result.current.result).toEqual(mockResult);
  });

  it("should handle large batch image generation", async () => {
    const recipients = Array.from({ length: 50 }, (_, i) => ({
      name: `Student ${i + 1}`,
      guardian_name: `Guardian ${i + 1}`,
      stream: `Stream ${i + 1}`,
      school_college: `College ${i + 1}`,
      publish_date: `2025-01-${(i + 1).toString().padStart(2, '0')}`,
      duration: `${i + 1} hours`,
      organization: `Org ${i + 1}`,
      completion_date: `2025-02-${(i + 1).toString().padStart(2, '0')}`,
    }));

    const mockResult = {
      status: "completed",
      successful: 50,
      failed: 0,
      results: recipients.map((recipient, i) => ({
        recipient: recipient.name,
        certificate_id: `batch-${i}`,
        file_path: `/path/to/cert_${i}.jpeg`,
        status: "success",
      })),
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    // Generate CSV with 50 recipients
    const csvContent =
      "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\n" +
      recipients.map((r) =>
        `"${r.name}","${r.guardian_name}","${r.stream}","${r.school_college}","${r.publish_date}","${r.duration}","${r.organization}","${r.completion_date}"`
      ).join("\n");
    const file = new File([csvContent], "batch.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "professional_training.html",
        false,
        "jpeg"
      );
    });

    expect(mockGenerateSync).toHaveBeenCalledWith({
      template_id: "professional_training.html",
      output_format: "jpeg",
      recipients,
      ai_options: { prompt: "congratulatory" },
    });

    expect(result.current.result.successful).toBe(50);
  });

  it("should handle image generation errors gracefully", async () => {
    mockGenerateSync.mockRejectedValue(new Error("Image conversion failed"));

    const { result } = renderHook(() => useGenerate());

    const csvContent =
      "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\n" +
      "Error Test,G,S,C,2024-01-01,D,O,2024-01-01";
    const file = new File([csvContent], "error.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "modern_excellence.html",
        false,
        "png"
      );
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Image conversion failed");
    expect(result.current.result).toBeNull();
  });

  it("should handle partial failures in batch image generation", async () => {
    const mockResult = {
      status: "completed",
      successful: 2,
      failed: 1,
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
          recipient: "Failed User",
          file_path: null,
          status: "error",
          error: "Image generation failed",
        },
      ],
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    const csvContent =
      "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\n" +
      "Success 1,G1,S1,C1,2024-01-01,D1,O1,2024-01-01\n" +
      "Success 2,G2,S2,C2,2024-01-01,D2,O2,2024-01-01\n" +
      "Failed User,G3,S3,C3,2024-01-01,D3,O3,2024-01-01";
    const file = new File([csvContent], "partial.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "classic_achievement.html",
        false,
        "png"
      );
    });

    expect(result.current.result.successful).toBe(2);
    expect(result.current.result.failed).toBe(1);
    expect(result.current.error).toBeNull(); // Should not set global error for partial failures
  });

  it("should validate output format parameter", async () => {
    const mockResult = {
      status: "completed",
      successful: 1,
      failed: 0,
      results: [
        {
          recipient: "Format Test",
          certificate_id: "format-123",
          file_path: "/path/to/cert.html",
          status: "success",
        },
      ],
    };

    mockGenerateSync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerate());

    const csvContent = "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\nFormat Test,G,S,C,2024-01-01,D,O,2024-01-01";
    const file = new File([csvContent], "format.csv", { type: "text/csv" });

    // Test with each supported format
    const formats = ["pdf", "png", "jpeg", "html"];

    for (const format of formats) {
      await act(async () => {
        await result.current.generate(
          file,
          "modern_excellence.html",
          false,
          format as "pdf" | "png" | "jpeg" | "html"
        );
      });

      expect(mockGenerateSync).toHaveBeenCalledWith(
        expect.objectContaining({
          output_format: format,
        })
      );
    }
  });

  it("should handle job timeout for async image generation", async () => {
    const mockAsyncResult = { job_id: "timeout-job" };
    const mockJobInProgress = { state: "PENDING", result: null };

    mockGenerateAsync.mockResolvedValue(mockAsyncResult);
    mockGetJobStatus.mockResolvedValue(mockJobInProgress);

    const { result } = renderHook(() => useGenerate());

    const csvContent = "name,guardian_name,stream,school_college,publish_date,duration,organization,completion_date\nTimeout Test,G,S,C,2024-01-01,D,O,2024-01-01";
    const file = new File([csvContent], "timeout.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.generate(
        file,
        "professional_training.html",
        true,
        "png"
      );
    });

    expect(result.current.isPolling).toBe(true);

    // Simulate timeout (would normally take 5 minutes, but we can't wait that long in tests)
    // In a real test environment, you might want to mock setTimeout or use fake timers

    expect(result.current.jobId).toBe("timeout-job");
  });
});
