"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobDescriptionParser({ userId }: { userId?: string }) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleParseAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          userId,
          n8nWebhookUrl: n8nWebhookUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.interviewId) {
        router.push(`/interview/${data.interviewId}`);
      } else {
        alert(`Failed to generate interview: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error connecting to parser: ${error.message || String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-3d-block bg-gradient-to-br from-white via-stone-50 to-[#89023E]/5 border border-stone-200/80 shadow-[0_15px_40px_rgba(137,2,62,0.08)] rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#89023E]/10 text-[#89023E] rounded-2xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-900">
              1-Click Job Description & Resume AI Generator
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Paste any LinkedIn/Indeed job post to instantly generate a tailored mock interview via n8n Automation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-semibold text-[#89023E] hover:underline self-start sm:self-auto"
        >
          {showConfig ? "Hide n8n Config" : "⚙️ n8n Webhook URL (Optional)"}
        </button>
      </div>

      {showConfig && (
        <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-col gap-2 animate-fadeIn text-xs">
          <label className="font-bold text-stone-700">Custom n8n Production Webhook URL:</label>
          <input
            type="url"
            placeholder="https://oggy1.app.n8n.cloud/webhook/parse-jd"
            value={n8nWebhookUrl}
            onChange={(e) => setN8nWebhookUrl(e.target.value)}
            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#89023E] outline-none"
          />
          <p className="text-[11px] text-stone-500">
            Paste your n8n Production Webhook URL here to test your live n8n workflow execution!
          </p>
        </div>
      )}

      <form onSubmit={handleParseAndGenerate} className="flex flex-col gap-4">
        <div className="relative">
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste Job Description or Job Role requirements here... (e.g. 'Looking for a Senior Full Stack Engineer with React, Node.js, and AWS microservices experience...')"
            className="w-full p-4 text-sm bg-white/90 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-[#89023E] focus:border-transparent outline-none placeholder:text-stone-400 leading-relaxed transition-all shadow-inner"
            required
          />
          <FileText className="absolute top-4 right-4 w-5 h-5 text-stone-300 pointer-events-none" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>n8n Webhook Powered • Auto-Extracts Tech Stack & Scenario Questions</span>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !jobDescription.trim()}
            className="btn-primary py-6 px-8 text-sm font-bold shadow-lg shadow-[#89023E]/20 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Running n8n Workflow...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                <span>Generate Tailored Interview</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
