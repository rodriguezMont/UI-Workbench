import { messages } from "@/messages";

/**
 * What a demo did, written under it — so a click that leaves the page as it
 * was still shows that it happened. Shared by every section that needs it.
 */
export function Outcome({ label, value }: { label: string; value: string }) {
  return (
    <p className="w-full text-xs text-secondary">
      {label}: <code className="font-mono text-primary">{value || messages.workbench.demos.header.nothing}</code>
    </p>
  );
}
