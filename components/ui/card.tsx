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
        // The panel this product is built out of: 3xl corners, hairline border,
        // 24px of breathing room and the soft lift `.glass-card` gives (which also
        // carries the hover rise, so a card behaves the same whether it came from
        // here or from the hand-written markup it replaced).
        // No `overflow-hidden` in the base: panels in this app hang blurred glows and
        // badges outside their own box, and clipping them was never the intent. A card
        // that wraps an image passes `overflow-hidden` itself.
        "group/card glass-card flex flex-col gap-(--card-spacing) rounded-3xl py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(6)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-3xl *:[img:last-child]:rounded-b-3xl",
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
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-3xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
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
        "font-heading text-base leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white group-data-[size=sm]/card:text-sm",
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
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-3xl border-t border-slate-100 dark:border-slate-800 p-(--card-spacing)",
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
