"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

import { CODE_VERIFIER_COOKIE, POSTHOG_LOGIN_DISTINCT_ID_COOKIE } from "@/lib/auth-constants";
import { flushPostHogSafely, getPostHogClient } from "@/lib/posthog-server";

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function signInWithProvider(provider: "google" | "github") {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const origin = await getOrigin();

  // Capture login initiation with a per-attempt anonymous ID, persisted in a
  // cookie so the callback can correlate login_failed/login_completed to the
  // same attempt instead of every anonymous event sharing one fake identity.
  const posthog = getPostHogClient();
  const anonymousId = crypto.randomUUID();
  posthog.capture({
    distinctId: anonymousId,
    event: "login_initiated",
    properties: { provider },
  });
  await flushPostHogSafely(posthog);

  cookieStore.set(POSTHOG_LOGIN_DISTINCT_ID_COOKIE, anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  });

  let url: string | undefined;
  let codeVerifier: string | undefined;

  try {
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: `${origin}/callback`,
      skipBrowserRedirect: true,
    });
    if (error) {
      console.error("[actions/auth]", error);
    } else {
      url = data?.url;
      codeVerifier = data?.codeVerifier;
    }
  } catch (error) {
    console.error("[actions/auth]", error);
  }

  if (!url) {
    redirect("/login?error=oauth_start_failed");
  }

  if (codeVerifier) {
    cookieStore.set(CODE_VERIFIER_COOKIE, codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });
  }

  redirect(url);
}

export async function signInWithGoogle() {
  await signInWithProvider("google");
}

export async function signInWithGithub() {
  await signInWithProvider("github");
}

export async function signOut() {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });

  try {
    await auth.signOut();
  } catch (error) {
    console.error("[actions/auth]", error);
  }

  redirect("/login");
}
