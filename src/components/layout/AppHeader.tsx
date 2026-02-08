"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppHeader({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="hidden sm:inline">UX Audit AI</span>
      </Link>
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
