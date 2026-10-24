import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        // 16px+ text stops iOS from zooming into the field.
        "block min-h-12 w-full rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
