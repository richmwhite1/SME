import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const baseStyles =
      "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
      primary: "border-2 border-[#B8860B] bg-[#B8860B] text-white hover:bg-[#9A7209]",
      secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
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
