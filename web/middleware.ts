import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STEPS = new Set([
  "",
  "intro",
  "rules",
  "gender",
  "location",
  "capture",
  "capture_done",
  // Backwards compat: old route
  "review",
  "loading",
  "done",
]);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/^\//, "");
  const firstSegment = pathname.split("/")[0] ?? "";

  // Only rewrite known step paths to the root, so the UI stays at "/" while URL shows step.
  if (STEPS.has(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

