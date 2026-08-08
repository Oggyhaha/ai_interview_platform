import { fetchFromSupabase, CORPORATE_QUESTION_BANK } from "@/lib/rag";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query = "", company, limit = 4 } = body;

    const matchedQuestions = await fetchFromSupabase(query, company);

    return Response.json({
      success: true,
      source: "Supabase Vector DB",
      count: matchedQuestions.length,
      questions: matchedQuestions,
      allBanks: CORPORATE_QUESTION_BANK.map((q) => ({ id: q.id, company: q.company, category: q.category })),
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
