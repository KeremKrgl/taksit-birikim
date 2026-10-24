import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createIntlMiddleware(routing);

// Pages anyone can open without signing in (paths without the /en prefix).
const PUBLIC_PAGES = ["/giris", "/aydinlatma-metni"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiOrAuth = pathname.startsWith("/api/") || pathname.startsWith("/auth/");

  // Locale handling first (it may redirect or rewrite), then the session refresh on that response.
  const response = isApiOrAuth ? NextResponse.next({ request }) : intl(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // Verifies the JWT and refreshes an expiring session. Do not remove.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (isApiOrAuth || signedIn) return response;

  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const bare = isEnglish ? pathname.slice(3) || "/" : pathname;
  if (PUBLIC_PAGES.some((p) => bare === p || bare.startsWith(`${p}/`))) return response;

  const login = request.nextUrl.clone();
  login.pathname = isEnglish ? "/en/giris" : "/giris";
  login.search = "";
  const redirect = NextResponse.redirect(login);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  // Everything except static files, images and the service worker.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|offline.html|.*\\.(?:png|svg|jpg|webp|ico|txt)$).*)"],
};
