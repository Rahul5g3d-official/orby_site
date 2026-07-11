import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-studio-bg text-studio-text">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
