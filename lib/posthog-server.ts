import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
          "this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
      );
    }
    // Return a no-op-safe client that won't throw
    return new PostHog("__missing__", {
      host: host ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
  }

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: host ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
  }

  return posthogClient;
}

// PostHog network failures must never break the request they're instrumenting —
// flush() is documented to throw on HTTP/network errors, so every call site
// routes through this instead of awaiting client.flush() directly.
export async function flushPostHogSafely(client: PostHog): Promise<void> {
  try {
    await client.flush();
  } catch (error) {
    console.error("[posthog] flush failed", error);
  }
}
