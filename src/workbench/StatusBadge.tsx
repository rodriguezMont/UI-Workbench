import { cn } from "@/lib/cn";

import { STATE_HINT, STATE_LABEL, type PieceState } from "./approvals";

// Roles only, and never color alone: the label says the state in words.
const TONE: Record<PieceState, string> = {
  "to-build": "border-border text-subtle",
  "in-review": "border-accent text-accent-label",
  approved: "border-signal text-signal-label",
};

export function StatusBadge({ state }: { state: PieceState }) {
  return (
    <span
      title={STATE_HINT[state]}
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TONE[state])}
    >
      {STATE_LABEL[state]}
    </span>
  );
}
