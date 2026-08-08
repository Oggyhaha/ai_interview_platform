"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Building2, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RAGKnowledgeBankSelector({ userId }: { userId?: string }) {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [isLoading, setIsLoading] = useState(false);

  const companies = [
    { name: "Google", desc: "Distributed Systems & Deep Architecture Probing", tag: "Staff Level" },
    { name: "Amazon", desc: "Leadership Principles & Idempotent Microservices", tag: "Hard" },
    { name: "Meta", desc: "React Fiber, Frontend Scale & Concurrent UI", tag: "Senior" },
    { name: "Netflix", desc: "CDN Caching, Media Streaming & Resiliency", tag: "Staff Level" },
  ];

  const handleLaunchRAGSession = async (company: string) => {
    setIsLoading(true);
    setSelectedCompany(company);

    try {
      // Query RAG Knowledge Base for company questions
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: company, company, limit: 5 }),
      });

      const data = await res.json();
      const questions = data.questions?.map((q: any) => q.question) || [];

      // Create interview doc in Firebase via parse-jd fallback logic
      const parseRes = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: `${company} Target Interview Bank. Key focus areas: ${questions.join(" ")}`,
          userId,
        }),
      });

      const parseData = await parseRes.json();
      if (parseData.success && parseData.interviewId) {
        router.push(`/interview/${parseData.interviewId}`);
      } else {
        alert("Failed to launch RAG session");
      }
    } catch (e: any) {
      alert(`Error launching RAG session: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-3d-block bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-stone-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.03)] flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#89023E]/10 text-[#89023E] rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              RAG Vector Knowledge Base (Corporate Question Banks)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Practice real interview questions retrieved from verified corporate tech tracks using Vector RAG search.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5 w-fit">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Vector RAG Active</span>
        </span>
      </div>

      {/* Target Company Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {companies.map((comp) => {
          const isSelected = comp.name === selectedCompany;

          return (
            <div
              key={comp.name}
              onClick={() => handleLaunchRAGSession(comp.name)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group relative overflow-hidden ${
                isSelected && isLoading
                  ? "border-[#89023E] bg-[#89023E]/5 shadow-md"
                  : "border-stone-200 hover:border-[#89023E] hover:shadow-lg bg-white"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-stone-900 group-hover:text-[#89023E] transition-colors">
                    {comp.name} Bank
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                    {comp.tag}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  {comp.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-bold text-[#89023E]">
                <span>Launch Track</span>
                {isLoading && selectedCompany === comp.name ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#89023E]" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
