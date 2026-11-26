import { cn } from "@/lib/cn";
import { messages } from "@/messages";

/**
 * What a demo did, written under it — so a click that leaves the page as it
 * was still shows that it happened. Shared by every section that needs it.
 */
export function Outcome({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <p className={cn("w-full text-xs text-secondary", className)}>
      {label}: <code className="font-mono text-primary">{value || messages.workbench.demos.header.nothing}</code>
    </p>
  );
}
