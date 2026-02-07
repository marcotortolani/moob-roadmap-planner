import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border-2 border-border px-2.5 py-0.5 text-xs font-bold uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground",
        neutral: "bg-secondary-background text-foreground",
        // Legacy shadcn/ui variants for compatibility
        secondary: "bg-secondary-background text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-transparent border-border",
        // Product status variants
        planned: "bg-[#6B7280] text-white",
        inProgress: "bg-[#FF2E63] text-white",
        demoOk: "bg-[#FFD700] text-black",
        live: "bg-[#2EBD59] text-white",
        // Role variants
        admin: "bg-[#EF4444] text-white",
        user: "bg-[#3B82F6] text-white",
        guest: "bg-[#F97316] text-white",
        blocked: "bg-[#A855F7] text-white",
        // Invitation status variants
        pending: "bg-[#FCC419] text-black",
        accepted: "bg-[#51CF66] text-white",
        expired: "bg-[#868E96] text-white",
        revoked: "bg-[#FF6B6B] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
