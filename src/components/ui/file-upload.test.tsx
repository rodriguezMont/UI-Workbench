// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { messages } from "@/messages";

import { FileUpload, type UploadFn } from "./file-upload";

afterEach(cleanup);

const m = messages.ui.fileUpload;
const DOCS = "application/pdf,image/png";
const pdf = (name: string, size = 2048) => new File([new Uint8Array(size)], name, { type: "application/pdf", lastModified: 1 });

/** An upload the test finishes by hand, recording each call's signal. */
function manualUpload() {
  const calls: { file: File; signal: AbortSignal; onProgress: (f: number) => void; resolve: () => void; reject: () => void }[] = [];
  const upload: UploadFn = (file, { signal, onProgress }) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ file, signal, onProgress, resolve, reject: () => reject(new Error("test")) });
    });
  return { upload, calls };
}

const user = () => userEvent.setup({ applyAccept: false });
const fileInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;

describe("FileUpload", () => {
  it("names the input with the label and the button, and lists what was chosen", async () => {
    const { upload, calls } = manualUpload();
    const onChange = vi.fn();
    const { container } = render(<FileUpload label="Documents" accept={DOCS} upload={upload} onChange={onChange} />);

    expect(screen.getByLabelText(`Documents ${m.chooseMany}`)).toBe(fileInput(container));
    await user().upload(fileInput(container), [pdf("a.pdf"), pdf("b.pdf")]);

    expect(calls).toHaveLength(2);
    const list = screen.getByRole("list", { name: m.list });
    expect(list.textContent).toContain("a.pdf");
    expect(list.textContent).toContain(m.uploading(0));
    expect(onChange).toHaveBeenLastCalledWith({ done: [], pending: 2 });

    await act(async () => {
      calls[0]!.onProgress(0.5);
    });
    expect(screen.getByRole("progressbar", { name: m.progress("a.pdf") }).getAttribute("aria-valuenow")).toBe("50");

    await act(async () => calls[0]!.resolve());
    expect(screen.getByRole("status").textContent).toBe(m.uploaded("a.pdf"));
    expect(onChange).toHaveBeenLastCalledWith({ done: [calls[0]!.file], pending: 1 });
  });

  it("refuses a wrong format and a repeated file; the error takes the hint's place", async () => {
    const { upload } = manualUpload();
    const { container } = render(<FileUpload label="Documents" hint="Signed copies only." accept={DOCS} upload={upload} />);
    expect(screen.getByText("Signed copies only.")).toBeDefined();

    await user().upload(fileInput(container), pdf("a.pdf"));
    await user().upload(fileInput(container), [pdf("a.pdf"), new File(["x"], "notes.docx", { type: "application/msword" })]);

    expect(screen.getByText(m.duplicate("a.pdf"))).toBeDefined();
    expect(screen.getByText(/“notes\.docx” isn't an accepted format\. Upload PDF or PNG\./)).toBeDefined();
    expect(screen.queryByText("Signed copies only.")).toBeNull();
    expect(fileInput(container).getAttribute("aria-invalid")).toBe("true");
  });

  it("removing a file mid-upload cancels it and moves focus to the next row", async () => {
    const { upload, calls } = manualUpload();
    const { container } = render(<FileUpload label="Documents" accept={DOCS} upload={upload} />);
    await user().upload(fileInput(container), [pdf("a.pdf"), pdf("b.pdf")]);

    await user().click(screen.getByRole("button", { name: m.cancel("a.pdf") }));
    expect(calls[0]!.signal.aborted).toBe(true);
    expect(screen.queryByText("a.pdf")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: m.cancel("b.pdf") }));
  });

  it("a failed upload says so and can be retried", async () => {
    const { upload, calls } = manualUpload();
    const { container } = render(<FileUpload label="Documents" accept={DOCS} upload={upload} />);
    await user().upload(fileInput(container), pdf("a.pdf"));

    await act(async () => calls[0]!.reject());
    expect(screen.getByText(new RegExp(m.notUploaded))).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe(m.failed("a.pdf"));

    await user().click(screen.getByRole("button", { name: m.retry("a.pdf") }));
    expect(calls).toHaveLength(2);
    expect(screen.getByText(new RegExp(m.uploading(0)))).toBeDefined();
  });

  it("at the limit, the picker gives way to the reason", async () => {
    const { upload } = manualUpload();
    const { container } = render(<FileUpload label="Contract" accept={DOCS} maxFiles={1} upload={upload} />);
    expect(screen.getByText(m.chooseOne)).toBeDefined();
    expect(fileInput(container).multiple).toBe(false);

    await user().upload(fileInput(container), pdf("a.pdf"));
    expect(fileInput(container)).toBeNull();
    expect(screen.getByText(m.full(m.files(1)))).toBeDefined();
  });
});
