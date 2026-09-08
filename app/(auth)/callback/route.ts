import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthActions } from "@insforge/sdk/ssr";
import { CODE_VERIFIER_COOKIE, POSTHOG_LOGIN_DISTINCT_ID_COOKIE } from "@/lib/auth-constants";
import { createInsforgeServer } from "@/lib/insforge-server";
import { flushPostHogSafely, getPostHogClient } from "@/lib/posthog-server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE)?.value;
  // Falls back to a fresh id (not the shared literal "anonymous") if the
  // cookie is missing — keeps this one attempt's events self-consistent
  // even though it can't be linked back to the login_initiated that started it.
  const distinctId =
    cookieStore.get(POSTHOG_LOGIN_DISTINCT_ID_COOKIE)?.value ??
    crypto.randomUUID();
  const posthog = getPostHogClient();

  if (!code) {
    posthog.capture({
      distinctId,
      event: "login_failed",
      properties: { reason: "missing_code" },
    });
    await flushPostHogSafely(posthog);
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url),
    );
  }

  const auth = createAuthActions({ cookies: cookieStore });

  let succeeded = false;
  try {
    const { error } = await auth.exchangeOAuthCode(code, codeVerifier);
    if (error) {
      console.error("[auth/callback]", error);
    } else {
      succeeded = true;
    }
  } catch (error) {
    console.error("[auth/callback]", error);
  }

  cookieStore.delete(CODE_VERIFIER_COOKIE);
  cookieStore.delete(POSTHOG_LOGIN_DISTINCT_ID_COOKIE);

  if (!succeeded) {
    posthog.capture({
      distinctId,
      event: "login_failed",
      properties: { reason: "oauth_exchange_failed" },
    });
    await flushPostHogSafely(posthog);
    return NextResponse.redirect(
      new URL("/login?error=oauth_exchange_failed", request.url),
    );
  }

  // Resolve the authenticated user to identify them in PostHog
  try {
    const insforge = await createInsforgeServer();
    const { data } = await insforge.auth.getCurrentUser();
    const user = data.user;
    if (user?.id) {
      // Link this attempt's pre-login events (login_initiated) to the now-known
      // person, then identify and capture completion under their real id.
      posthog.alias({ distinctId, alias: user.id });
      posthog.identify({
        distinctId: user.id,
        properties: {
          email: user.email,
        },
      });
      posthog.capture({
        distinctId: user.id,
        event: "login_completed",
      });
    } else {
      posthog.capture({
        distinctId,
        event: "login_completed",
      });
    }
  } catch (err) {
    console.error("[auth/callback] PostHog identify failed", err);
    posthog.capture({
      distinctId,
      event: "login_completed",
    });
  }
  await flushPostHogSafely(posthog);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
