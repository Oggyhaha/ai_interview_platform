export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { results: [{ toolCallId: "test", result: { ok: true } }] },
    { status: 200 }
  );
}

export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}