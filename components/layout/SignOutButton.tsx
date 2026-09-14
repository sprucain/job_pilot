"use client";

import posthog from "posthog-js";

import { signOut } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        // Must run before the server action's redirect — posthog-js has no
        // server-side equivalent, so this is the only place a logout can
        // clear the identified session (distinct id, person properties).
        // Wrapped so an analytics failure can never block the actual sign-out.
        try {
          posthog.reset();
        } catch (error) {
          console.error("[SignOutButton]", error);
        }
        await signOut();
      }}
    >
      <button
        type="submit"
        className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
      >
        Sign out
      </button>
    </form>
  );
}
