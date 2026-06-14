"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="icon-button"
      type="button"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      <LogOut size={17} aria-hidden="true" />
      Sign out
    </button>
  );
}

