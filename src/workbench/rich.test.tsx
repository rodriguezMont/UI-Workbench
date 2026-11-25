// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { Rich } from "./rich";

afterEach(cleanup);

const html = (text: string) => render(<p>{<Rich text={text} />}</p>).container.firstElementChild!.innerHTML;

describe("Rich", () => {
  it("leaves plain prose as text", () => {
    expect(html("Nothing to mark here.")).toBe("Nothing to mark here.");
  });

  it("turns **bold** into strong and `code` into code", () => {
    const out = render(<p>{<Rich text="**The lead.** Then `--surface` and the rest." />}</p>).container;
    expect(out.querySelector("strong")?.textContent).toBe("The lead.");
    expect(out.querySelector("code")?.textContent).toBe("--surface");
    expect(out.textContent).toBe("The lead. Then --surface and the rest.");
  });

  it("does not parse anything else, and keeps stray marks as text", () => {
    expect(html("a * b ** c ` d")).toBe("a * b ** c ` d");
  });
});

describe("workbench copy", () => {
  /** Every string in the workbench messages, however deep. */
  const strings = (value: unknown): string[] =>
    typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];

  it("never nests code inside bold — the marks do not nest, and the backticks would show", () => {
    const nested = strings(messages.workbench).filter((s) => [...s.matchAll(/\*\*([^*]+)\*\*/g)].some((m) => m[1]!.includes("`")));
    expect(nested).toEqual([]);
  });
});
