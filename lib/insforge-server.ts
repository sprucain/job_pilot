import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export async function createInsforgeServer() {
  const cookieStore = await cookies();
  return createServerClient({ cookies: cookieStore });
}
