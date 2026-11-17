import * as React from "react"
import { Popover as HeadlessPopover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { cn } from "@/lib/utils"

const Popover = HeadlessPopover

export interface PopoverTriggerProps
  extends React.ComponentPropsWithoutRef<typeof PopoverButton> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, className, ...props }, ref) => {
    return (
      <PopoverButton
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPanel> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "start", sideOffset = 4, anchor, children, ...props }, ref) => {
    const anchorPosition =
      anchor ||
      (align === "start" ? "bottom start" : align === "end" ? "bottom end" : "bottom")

    return (
      <Transition
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-1 scale-95"
      >
        <PopoverPanel
          ref={ref}
          anchor={{ to: anchorPosition as any, gap: `${sideOffset}px` }}
          className={cn(
            "z-50 w-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none focus:outline-none",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPanel>
      </Transition>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
