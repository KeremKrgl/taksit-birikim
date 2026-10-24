import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A large, thumb-friendly checkbox with its label and optional help text. */
export function CheckboxField({
  id,
  label,
  help,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { id: string; label: ReactNode; help?: ReactNode }) {
  const helpId = help ? `${id}-help` : undefined;
  return (
    <div className={cn("flex gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        aria-describedby={helpId}
        className="mt-0.5 size-6 shrink-0 rounded border-input accent-primary"
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-base leading-snug">
          {label}
        </label>
        {help ? (
          <p id={helpId} className="mt-1 text-sm text-muted-foreground">
            {help}
          </p>
        ) : null}
      </div>
    </div>
  );
}
