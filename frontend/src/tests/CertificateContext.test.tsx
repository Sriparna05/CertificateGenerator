import React from "react";
import type { ReactNode } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CertificateProvider,
  useCertificate,
} from "../contexts/CertificateContext";
import Papa from "papaparse";

// Mock Papa.parse to control its behavior in tests
vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock the global fetch function
global.fetch = vi.fn();

// A simple component to consume and display context values for testing
const TestConsumer = () => {
  const {
    file,
    onUpload,
    selectedTemplate,
    setSelectedTemplate,
    generate,
    generateLoading,
    generateError,
    generateResult,
  } = useCertificate();

  return (
    <div>
      <div data-testid="file-name">{file?.name || "no file"}</div>
      <div data-testid="template-id">{selectedTemplate || "no template"}</div>
      <div data-testid="loading-status">
        {generateLoading ? "loading" : "idle"}
      </div>
      <div data-testid="error-message">{generateError || "no error"}</div>
      <div data-testid="result-status">
        {generateResult?.status || "no result"}
      </div>

      <button onClick={() => onUpload(new File(["test"], "test.csv"))}>
        Upload File
      </button>
      <button onClick={() => setSelectedTemplate("test-template.html")}>
        Select Template
      </button>
      <button
        onClick={() =>
          file &&
          selectedTemplate &&
          generate(file, selectedTemplate, false, "pdf")
        }
      >
        Generate PDF
      </button>
    </div>
  );
};

// Helper to render the consumer within the provider
const renderWithProvider = (component: ReactNode) => {
  return render(<CertificateProvider>{component}</CertificateProvider>);
};

describe("CertificateContext", () => {
  // Reset mocks before each test to ensure test isolation
  beforeEach(() => {
    vi.mocked(Papa.parse).mockClear();
    vi.mocked(fetch).mockClear();
  });

  it("should provide default initial values", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("file-name")).toHaveTextContent("no file");
    // ... other initial state assertions
  });

  it("should update file state when onUpload is called", async () => {
    renderWithProvider(<TestConsumer />);
    const uploadButton = screen.getByText("Upload File");
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    expect(screen.getByTestId("file-name")).toHaveTextContent("test.csv");
  });

  it("should update template state when setSelectedTemplate is called", async () => {
    renderWithProvider(<TestConsumer />);
    const selectTemplateButton = screen.getByText("Select Template");
    await act(async () => {
      fireEvent.click(selectTemplateButton);
    });
    expect(screen.getByTestId("template-id")).toHaveTextContent(
      "test-template.html"
    );
  });

  it("should call fetch with the correct body for PDF generation", async () => {
    const mockRecipients = [
      {
        name: "John Doe",
        guardian_name: "Jane Doe",
        stream: "Computer Science",
        school_college: "MIT",
        publish_date: "2024-01-01",
        duration: "4 years",
        organization: "Tech Academy",
        completion_date: "2024-05-20",
      },
    ];
    const mockSuccessResponse = {
      status: "completed",
      successful: 1,
      results: [],
    };

    vi.mocked(Papa.parse).mockImplementation((_file, config) => {
      if (config && config.complete) {
        config.complete({
          data: mockRecipients,
          errors: [],
          meta: {
            fields: [
              "name",
              "guardian_name",
              "stream",
              "school_college",
              "publish_date",
              "duration",
              "organization",
              "completion_date",
            ],
          },
        });
      }
      return {} as any;
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSuccessResponse),
    } as Response);

    renderWithProvider(<TestConsumer />);
    await act(async () => {
      fireEvent.click(screen.getByText("Upload File"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Select Template"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Generate PDF"));
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody.output_format).toBe("pdf");
  });

  it("should handle API errors during generation", async () => {
    const mockErrorMessage = "Server-side generation failed.";
    vi.mocked(Papa.parse).mockImplementation((_file, config) => {
      if (config && config.complete) {
        config.complete({
          data: [
            {
              name: "Error Person",
              guardian_name: "",
              stream: "",
              school_college: "",
              publish_date: "",
              duration: "",
              organization: "",
              completion_date: "",
            },
          ],
          errors: [],
          meta: {
            fields: [
              "name",
              "guardian_name",
              "stream",
              "school_college",
              "publish_date",
              "duration",
              "organization",
              "completion_date",
            ],
          },
        });
      }
      return {} as any;
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: mockErrorMessage }),
    } as Response);

    renderWithProvider(<TestConsumer />);
    await act(async () => {
      fireEvent.click(screen.getByText("Upload File"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Select Template"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Generate PDF"));
    });

    expect(screen.getByTestId("error-message")).toHaveTextContent(
      mockErrorMessage
    );
  });

  it("should set loading state during generation", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    vi.mocked(Papa.parse).mockImplementation((_file, config) => {
      if (config && config.complete) {
        config.complete({
          data: [
            {
              name: "Test",
              guardian_name: "",
              stream: "",
              school_college: "",
              publish_date: "",
              duration: "",
              organization: "",
              completion_date: "",
            },
          ],
          errors: [],
          meta: {
            fields: [
              "name",
              "guardian_name",
              "stream",
              "school_college",
              "publish_date",
              "duration",
              "organization",
              "completion_date",
            ],
          },
        });
      }
      return {} as any;
    });

    renderWithProvider(<TestConsumer />);
    await act(async () => {
      fireEvent.click(screen.getByText("Upload File"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Select Template"));
    });

    act(() => {
      fireEvent.click(screen.getByText("Generate PDF"));
    });

    expect(screen.getByTestId("loading-status")).toHaveTextContent("loading");
  });

  it("should throw an error if useCertificate is used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useCertificate must be used within a CertificateProvider"
    );
    spy.mockRestore();
  });
});
