import { Avatar as RadixAvatar } from "radix-ui";

import { cn } from "@/lib/cn";

/**
 * The avatar: a person's or an organization's picture in a circle.
 *
 * **The image only shows once it has loaded.** Until then — and for good, if
 * it fails — the `AvatarFallback` stays. That is why the fallback is not
 * decoration: in a list of accounts, a hole where a face should be is worse
 * than initials.
 */
export function Avatar({ className, ...props }: React.ComponentProps<typeof RadixAvatar.Root>) {
  return (
    <RadixAvatar.Root
      className={cn(
        // A light outline around the circle that does not compete with the
        // face; `--border-emblem` lifts it a step in dark mode.
        "relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border-emblem",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: React.ComponentProps<typeof RadixAvatar.Image>) {
  return <RadixAvatar.Image className={cn("size-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof RadixAvatar.Fallback>) {
  return (
    <RadixAvatar.Fallback
      className={cn(
        "flex size-full items-center justify-center bg-surface-emblem text-sm font-medium text-secondary",
        className,
      )}
      {...props}
    />
  );
}
