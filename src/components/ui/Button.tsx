import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: "bg-studio-accent text-white hover:bg-indigo-500 border-transparent",
  secondary: "bg-studio-card text-studio-text hover:bg-[#1D2940] border-studio-border",
  ghost: "bg-transparent text-studio-muted hover:text-studio-text hover:bg-white/5 border-transparent",
  danger: "bg-studio-danger text-white hover:bg-red-500 border-transparent",
  success: "bg-studio-success text-[#03110A] hover:bg-green-400 border-transparent",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border text-center font-medium leading-tight transition focus:outline-none focus:ring-2 focus:ring-studio-cyan/70 focus:ring-offset-2 focus:ring-offset-studio-bg disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : icon}
      {children ? <span className="min-w-0">{children}</span> : null}
    </button>
  );
}
