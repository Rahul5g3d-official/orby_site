import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg border border-studio-border bg-studio-card/95 shadow-studio", className)}
      {...props}
    >
      {children}
    </div>
  );
}
