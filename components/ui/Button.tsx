import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const baseStyles =
      "rounded-xl px-6 py-3 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-earth-green text-sand-beige hover:bg-earth-green/90",
      secondary: "bg-soft-clay text-deep-stone hover:bg-soft-clay/90",
      outline:
        "border-2 border-earth-green text-earth-green hover:bg-earth-green/10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

