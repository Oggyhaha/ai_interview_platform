"use client";

import React, { useState } from "react";
import { Code2, Play, Copy, Check, Trash2, Sparkles } from "lucide-react";

export default function CodeWorkspace() {
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState(
    `// Live Code & Notes Scratchpad
// Type pseudo-code, algorithms, or architecture notes while speaking with the AI Interviewer!

function solution(input: string[]): boolean {
  console.log("Evaluating candidate code solution...");
  return true;
}`
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-stone-950/80 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <Code2 className="w-4 h-4 text-[#89023E] ml-2" />
          <span className="font-bold text-stone-300 text-xs">PrepYou Live Code Scratchpad</span>
        </div>

        {/* Language selector & actions */}
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-stone-800 text-stone-200 text-[11px] font-medium px-3 py-1 rounded-lg border border-stone-700 outline-none cursor-pointer"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="sql">SQL</option>
          </select>

          <button
            onClick={handleCopy}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setCode("")}
            className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors"
            title="Clear code"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex p-4 bg-stone-900/90 min-h-[220px]">
        {/* Line Numbers */}
        <div className="select-none text-stone-600 pr-4 text-right flex flex-col font-mono text-[11px] leading-relaxed">
          {code.split("\n").map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          placeholder="Type snippet, logic, or notes here..."
          className="w-full h-full bg-transparent text-stone-200 font-mono text-xs leading-relaxed outline-none resize-none"
          rows={10}
        />
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#89023E]" />
          <span>Real-time Code Notes (Accessible during Vapi AI Call)</span>
        </div>
        <span>{code.length} chars</span>
      </div>
    </div>
  );
}
