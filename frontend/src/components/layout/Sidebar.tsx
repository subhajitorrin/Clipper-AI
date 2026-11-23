"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, LayoutDashboard, Film, HelpCircle, User } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/" || pathname === "/dashboard",
    },
    {
      label: "My Projects",
      href: "/dashboard#projects",
      icon: Film,
      active: pathname.startsWith("/processing") || pathname.startsWith("/results"),
    },
    {
      label: "Help & Docs",
      href: "#help",
      icon: HelpCircle,
      active: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#292929] bg-[#0D0D0D] transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-[#292929] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white">ClipForge AI</span>
            <span className="text-[11px] text-[#737373]">Shorts Studio</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-medium tracking-wider text-[#737373] uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-[#202020] text-white"
                    : "text-[#A3A3A3] hover:bg-[#171717] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Account / Footer */}
        <div className="border-t border-[#292929] p-4">
          <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#171717]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#292929] bg-[#171717] text-[#A3A3A3]">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-medium text-white">Creator Account</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
