"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // The app's own scrim: dark enough that the page behind stops competing,
        // blurred so the dialog reads as the only live surface.
        "fixed inset-0 isolate z-50 bg-slate-950/50 duration-150 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Card geometry of the product: 3xl corners, real padding, a lifted shadow.
          // `max-h`/`overflow` so a long form scrolls inside the dialog instead of
          // running off the bottom of the screen.
          "fixed z-50 grid gap-4 overflow-y-auto border border-slate-200 bg-white text-sm text-popover-foreground shadow-2xl shadow-slate-950/20 duration-200 outline-none dark:border-slate-800 dark:bg-slate-900",
          // Phone: a sheet that comes up from the bottom edge, full width, rounded only
          // at the top, clearing the home indicator. A dialog floating in the middle of a
          // phone screen with a margin around it is a desktop dialog that has been
          // shrunk; this is the shape every app on the device already uses, and it puts
          // the actions where the thumb is.
          "inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-3xl rounded-b-none border-b-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-8 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-8",
          // Tablet and up: back to a centred card.
          "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border-b sm:p-8 sm:pb-8",
          "sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0 sm:data-closed:zoom-out-95 sm:data-closed:slide-out-to-bottom-0",
          className
        )}
        {...props}
      >
        {/* The grab handle every bottom sheet has. Decorative — the sheet is dismissed
            by the close button, the overlay or Escape — but its absence is what makes a
            sheet look like a web page that slid up. */}
        <div
          aria-hidden
          className="mx-auto -mt-1 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700"
        />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 size-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              size="icon"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 pr-10 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // The actions sit in the dialog's own padding — the stock grey strip fought
        // with the card look every screen here already has.
        "flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end sm:items-center",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // The modal titles in this product are set like page titles: heavy and tight.
        "font-heading text-lg leading-tight font-extrabold tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-xs leading-relaxed text-slate-500 dark:text-slate-400 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
