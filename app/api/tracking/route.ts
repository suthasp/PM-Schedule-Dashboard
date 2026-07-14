import { TRACKING_CSV_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Server-side proxy for the published Data Tracking sheet CSV — keeps the
 * client free of CORS concerns and always serves fresh data.
 */
export async function GET(): Promise<Response> {
  try {
    const res = await fetch(TRACKING_CSV_URL, { cache: "no-store", redirect: "follow" });
    if (!res.ok) {
      return Response.json(
        { error: `Google Sheets responded with ${res.status}` },
        { status: 502 },
      );
    }
    const csv = await res.text();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Failed to reach Google Sheets." }, { status: 502 });
  }
}
