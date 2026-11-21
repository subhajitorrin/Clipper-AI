"use client";

import { useState } from "react";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { Header } from "@/src/components/layout/Header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090909]">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          title={title}
          subtitle={subtitle}
          action={action}
        />
        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
