import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; asChild?: boolean }) {
  // `asChild` matters here: half the panels in this app are links or animated
  // wrappers. Merging into them keeps the card skin without a second box that
  // would break the hover lift and the reveal animations.
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="card"
      data-size={size}
      className={cn(
        // Deliberately just the panel surface — `.glass-card` and nothing else.
        //
        // This carried the stock shadcn base for a while (flex column, its own
        // 24px padding, 3xl radius, `text-card-foreground`) and that changed how
        // every panel in the product looked: the text colour inside a card went
        // from the body grey to near-black, and the extra gap/padding fought with
        // the padding each call site already sets. Every one of these call sites
        // brings its own radius, border, padding and spacing — the component's job
        // here is the glass surface, so that is all it adds.
        "group/card glass-card",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-[var(--card-spacing,1.5rem)] has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-[var(--card-spacing,1.5rem)]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs leading-relaxed text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[var(--card-spacing,1.5rem)]", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-slate-100 dark:border-slate-800 p-[var(--card-spacing,1.5rem)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
