import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, tag) => tag }),
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: () => {}, on: () => () => {} }),
  useTransform: () => ({ get: () => 0, on: () => () => {} }),
  animate: () => ({ stop: () => {} }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
  Upload: (props: any) => <span data-testid="icon-upload" {...props} />,
  File: (props: any) => <span data-testid="icon-file" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  CheckCircle2: (props: any) => <span data-testid="icon-check" {...props} />,
}));

import { FileUploadDropzone } from "./FileUploadDropzone";

function createMockFile(name: string, sizeBytes: number, type = "text/plain"): File {
  const content = new Array(sizeBytes).fill("a").join("");
  return new File([content], name, { type });
}

describe("FileUploadDropzone", () => {
  let onFilesSelected: (files: File[]) => void;

  beforeEach(() => {
    onFilesSelected = vi.fn();
  });

  it("renders upload prompt", () => {
    render(<FileUploadDropzone onFilesSelected={onFilesSelected} />);
    expect(screen.getByText("Click to upload")).toBeTruthy();
    expect(screen.getByText("or drag and drop")).toBeTruthy();
  });

  it("shows file after selection", () => {
    render(<FileUploadDropzone onFilesSelected={onFilesSelected} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = createMockFile("report.pdf", 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("report.pdf")).toBeTruthy();
    expect(onFilesSelected).toHaveBeenCalledTimes(1);
  });

  it("removes file when X clicked", () => {
    render(<FileUploadDropzone onFilesSelected={onFilesSelected} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile("notes.txt", 512);
    fireEvent.change(input, { target: { files: [file] } });

    // File should be visible
    expect(screen.getByText("notes.txt")).toBeTruthy();

    // Click the remove button (the X icon's parent button)
    const xIcon = screen.getByTestId("icon-x");
    fireEvent.click(xIcon.closest("button")!);

    // File should be removed
    expect(screen.queryByText("notes.txt")).toBeNull();
  });
});
