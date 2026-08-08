"use client";

import React from "react";
import { SpeechMetrics } from "@/types";
import { Mic, Zap, AlertCircle, MessageSquare } from "lucide-react";

export default function SpeechAnalyticsCard({ metrics }: { metrics?: SpeechMetrics }) {
  const {
    wpm = 135,
    fillerWordCount = 3,
    fillerWordsFound = ["like", "basically", "so"],
    clarityScore = 88,
  } = metrics || {};

  return (
    <div className="flex flex-col gap-6 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-stone-100 shadow-sm w-full">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#89023E]" />
          <h3 className="font-bold text-stone-900 text-xl">Speech & Verbal Communication Metrics</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
          {clarityScore}% Audio Clarity
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WPM Metric */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pacing / Speech Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{wpm}</span>
            <span className="text-xs text-stone-500 font-medium">words / min</span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            {wpm >= 120 && wpm <= 160
              ? "🎯 Ideal conversational pace! Clear and easy to follow."
              : wpm < 120
              ? "🐢 Slightly slow pace. Speak a bit faster to show confidence."
              : "⚡ Fast speech rate! Pause slightly to allow interviewers to digest points."}
          </p>
        </div>

        {/* Filler Words Metric */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Filler Words Detected</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#89023E]">{fillerWordCount}</span>
            <span className="text-xs text-stone-500 font-medium">instances</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {fillerWordsFound.map((word, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-md"
              >
                &quot;{word}&quot;
              </span>
            ))}
          </div>
        </div>

        {/* Clarity Score Metric */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Verbal Articulation</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{clarityScore}%</span>
            <span className="text-xs text-stone-500 font-medium">clarity score</span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${clarityScore}%` }}
            />
          </div>
          <p className="text-xs text-stone-600 mt-1">
            High clarity score indicates structured thought delivery without excessive pauses.
          </p>
        </div>
      </div>
    </div>
  );
}
