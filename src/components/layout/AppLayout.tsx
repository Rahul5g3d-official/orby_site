import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-studio-bg text-studio-text">
      <Navbar />
      {children}
    </div>
  );
}
