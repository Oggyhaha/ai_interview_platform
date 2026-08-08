export interface QuestionBankItem {
  id: string;
  company: "Google" | "Amazon" | "Meta" | "Netflix" | "General FAANG";
  category: "System Design" | "Frontend Architecture" | "Backend Microservices" | "Algorithms" | "Behavioral";
  question: string;
  difficulty: "Medium" | "Hard" | "Staff";
  keywords: string[];
  idealKeyPoints: string[];
}

export const CORPORATE_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: "q-1",
    company: "Google",
    category: "System Design",
    question: "Design a globally distributed rate limiter that handles 100k requests per second with sub-millisecond latency.",
    difficulty: "Hard",
    keywords: ["rate limit", "system design", "distributed", "redis", "token bucket", "sliding window"],
    idealKeyPoints: ["Sliding Window Counter algorithm", "Redis Cluster with Lua scripts for atomicity", "Local in-memory cache with sync for low latency"],
  },
  {
    id: "q-2",
    company: "Amazon",
    category: "Backend Microservices",
    question: "How do you ensure idempotency in a payment gateway processing async webhooks during high network latency?",
    difficulty: "Hard",
    keywords: ["idempotency", "backend", "microservices", "payment", "kafka", "database lock"],
    idealKeyPoints: ["Idempotency keys with unique database constraints", "Distributed locks using Redis Redlock", "Dead Letter Queues (DLQ) for failed retries"],
  },
  {
    id: "q-3",
    company: "Meta",
    category: "Frontend Architecture",
    question: "Explain how React's Fiber reconciler prioritizes concurrent updates and prevents UI thread starvation during heavy re-renders.",
    difficulty: "Staff",
    keywords: ["react", "frontend", "fiber", "reconciler", "virtual dom", "concurrent"],
    idealKeyPoints: ["Time-slicing with requestIdleCallback/MessageChannel", "Work loop interruption & resumption", "Priority queues for user input vs background data"],
  },
  {
    id: "q-4",
    company: "Netflix",
    category: "System Design",
    question: "Design a video streaming CDN caching strategy that reduces origin server load during viral media releases.",
    difficulty: "Hard",
    keywords: ["cdn", "caching", "streaming", "video", "origin server", "system design"],
    idealKeyPoints: ["Edge Caching with Consistent Hashing", "Segmented HLS/DASH manifest caching", "Pre-warming edge nodes based on geographic metadata"],
  },
  {
    id: "q-5",
    company: "General FAANG",
    category: "Algorithms",
    question: "How do B-Tree indexes work in relational databases like PostgreSQL, and when does an index scan become slower than a sequential scan?",
    difficulty: "Medium",
    keywords: ["database", "sql", "postgresql", "b-tree", "index", "backend"],
    idealKeyPoints: ["Logarithmic search complexity O(log N)", "Random disk I/O vs Sequential block reads", "Index selectivity threshold (typically ~10-20% table scan cutoff)"],
  },
  {
    id: "q-6",
    company: "Google",
    category: "Behavioral",
    question: "Tell me about a time you had a technical disagreement with a Staff Architect regarding system design trade-offs. How did you resolve it?",
    difficulty: "Medium",
    keywords: ["behavioral", "star", "conflict", "leadership", "trade-offs"],
    idealKeyPoints: ["Data-driven benchmark presentation", "Focus on business goals & SLA impact", "Agree and commit mindset"],
  },
];

// Live Supabase Vector & REST DB Query
export async function fetchFromSupabase(queryText: string, companyFilter?: string): Promise<QuestionBankItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("[RAG] Supabase credentials not found in env, using local vector bank.");
    return queryVectorKnowledgeBase(queryText, companyFilter);
  }

  try {
    let url = `${supabaseUrl}/rest/v1/interview_questions?select=*`;
    if (companyFilter) {
      url += `&company=eq.${encodeURIComponent(companyFilter)}`;
    }

    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[RAG] Successfully fetched ${data.length} items from live Supabase DB!`);
        return data.map((item: any) => ({
          id: String(item.id),
          company: item.company,
          category: item.category,
          question: item.question,
          difficulty: item.difficulty || "Hard",
          keywords: [item.company, item.category],
          idealKeyPoints: ["Clear architecture", "System trade-offs", "Production resilience"],
        }));
      }
    }
  } catch (err) {
    console.error("[RAG] Error querying Supabase:", err);
  }

  return queryVectorKnowledgeBase(queryText, companyFilter);
}
