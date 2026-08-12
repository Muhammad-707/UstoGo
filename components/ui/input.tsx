import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base restyled once to the UstoGo field: soft slate fill, 2xl radius, 12px text.
        // Screens then use <Input /> with no per-field class list, which is the whole
        // point of moving onto a design system.
        "w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
