"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ onMenuToggle, title, subtitle, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#292929] bg-[#090909]/95 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#292929] text-[#A3A3A3] hover:text-white hover:border-[#404040] md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {title && (
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-xs text-[#737373] hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {action && <div>{action}</div>}
    </header>
  );
}
