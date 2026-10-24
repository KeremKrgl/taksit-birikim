import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tables a user owns, exported as they are stored. RLS limits every query to the caller's rows.
const TABLES = [
  "consent_events",
  "cards",
  "purchases",
  "installments",
  "savings_assets",
  "statement_imports",
  "notifications",
  "push_subscriptions",
  "referrals",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (profileError) return NextResponse.json({ error: "export_failed" }, { status: 500 });

  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    note: "Money values ending in _kurus are in kuruş (1 TL = 100 kuruş).",
    account: { id: userId, email: claims?.claims?.email ?? null },
    profile,
  };
  for (const table of TABLES) {
    const { data: rows, error } = await supabase.from(table).select("*");
    if (error) return NextResponse.json({ error: "export_failed" }, { status: 500 });
    data[table] = rows;
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="taksit-birikim-verilerim-${date}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
