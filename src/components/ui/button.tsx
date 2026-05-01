import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_14px_30px_hsl(var(--primary)/0.28)] hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_18px_36px_hsl(var(--primary)/0.32)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_14px_30px_hsl(var(--destructive)/0.24)] hover:-translate-y-0.5 hover:bg-destructive/92 hover:shadow-[0_18px_36px_hsl(var(--destructive)/0.28)]",
        outline: "border border-input/80 bg-card/95 text-foreground shadow-sm hover:border-primary/25 hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85 hover:shadow-md",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-[0_14px_30px_hsl(var(--success)/0.24)] hover:-translate-y-0.5 hover:bg-success/92 hover:shadow-[0_18px_36px_hsl(var(--success)/0.3)]",
        warning: "bg-warning text-warning-foreground shadow-[0_14px_30px_hsl(var(--warning)/0.24)] hover:-translate-y-0.5 hover:bg-warning/92 hover:shadow-[0_18px_36px_hsl(var(--warning)/0.3)]",
        info: "bg-info text-info-foreground shadow-[0_14px_30px_hsl(var(--info)/0.24)] hover:-translate-y-0.5 hover:bg-info/92 hover:shadow-[0_18px_36px_hsl(var(--info)/0.3)]",
        gradient: "bg-[linear-gradient(135deg,hsl(var(--getyn-navy)),hsl(var(--getyn-blue))_52%,hsl(var(--primary)))] text-primary-foreground shadow-[0_16px_32px_rgba(25,31,56,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(25,31,56,0.28)]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
