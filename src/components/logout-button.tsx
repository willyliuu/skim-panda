"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
