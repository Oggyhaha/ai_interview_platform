"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer, makeGeneratorAssistant } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

// ─── Diagnostic logger ────────────────────────────────────────────────────────
function diag(label: string, data?: any) {
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.log(`[PREPYOU ${ts}] ${label}`, data);
  } else {
    console.log(`[PREPYOU ${ts}] ${label}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latestMessage, setLatestMessage] = useState<string>("");
  const [diagInfo, setDiagInfo] = useState<string>("");
  const callDropReason = useRef<string>("unknown");

  // ── Vapi event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    diag("Agent mounted", { type, userId: userId ? "✓ present" : "✗ MISSING", userName });
    diag("Vapi token check", {
      token: process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN
        ? `✓ set (${process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN.slice(0, 8)}…)`
        : "✗ MISSING — call will fail",
      workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
        ? `✓ set (${process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID.slice(0, 8)}…)`
        : "✗ MISSING — generate call will fail",
    });

    const onCallStart = () => {
      diag("EVENT: call-start → call is ACTIVE");
      callDropReason.current = "unknown";
      setCallStatus(CallStatus.ACTIVE);
      setDiagInfo("Call active");
    };

    const onCallEnd = () => {
      diag("EVENT: call-end → reason was:", callDropReason.current);
      setCallStatus(CallStatus.FINISHED);
      setDiagInfo(`Call ended (reason: ${callDropReason.current})`);
    };

    const onMessage = (message: Message) => {
      diag("EVENT: message", { type: message.type, transcriptType: (message as any).transcriptType });
      if (message.type === "transcript" && (message as any).transcriptType === "final") {
        const newMessage = { role: message.role, content: (message as any).transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
      // Catch workflow-end or end-of-call messages
      if ((message as any).type === "end-of-call-report") {
        diag("EVENT: end-of-call-report received", message);
        callDropReason.current = "end-of-call-report received";
      }
    };

    const onSpeechStart = () => {
      diag("EVENT: speech-start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      diag("EVENT: speech-end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      diag("EVENT: error ← THIS IS THE PROBLEM", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.slice(0, 300),
      });
      callDropReason.current = `SDK error: ${error?.message}`;
      setDiagInfo(`Error: ${error?.message}`);
    };

    // Extra undocumented events Vapi sometimes emits
    const onVolumeLevel = (vol: number) => {
      // don't log every frame — just confirm audio is flowing
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);
    vapi.on("volume-level", onVolumeLevel);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
      vapi.off("volume-level", onVolumeLevel);
    };
  }, [type, userId, userName]);

  // ── Page-unload guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => diag("Page unloading — this ends the call");
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── Mic permission diagnostic ─────────────────────────────────────────────
  useEffect(() => {
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        diag("Mic permission state", result.state);
        result.onchange = () => diag("Mic permission CHANGED to", result.state);
      })
      .catch(() => diag("Mic permission API not available"));
  }, []);

  // ── On FINISHED → redirect or feedback ────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setLatestMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      diag("handleGenerateFeedback", { messageCount: messages.length });

      if (messages.length === 0) {
        diag("No transcript — returning home");
        router.push("/");
        return;
      }

      const { success, feedbackId: id, error } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        diag("Feedback creation failed", error);
        const isOverloaded =
          error?.toLowerCase().includes("overloaded") ||
          error?.toLowerCase().includes("high demand") ||
          error?.toLowerCase().includes("try again");

        const message = isOverloaded
          ? "The AI is experiencing high demand right now. Your interview was saved — click OK to try generating feedback again."
          : `Could not generate feedback: ${error}`;

        const retry = window.confirm(message);
        if (retry) {
          handleGenerateFeedback(messages);
        } else {
          router.push("/");
        }
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      diag("Call FINISHED → scheduling redirect/feedback in 1200ms", {
        type,
        messageCount: messages.length,
      });
      const timeout = setTimeout(() => {
        if (type === "generate") {
          diag("type=generate → pushing to /");
          router.push("/");
        } else {
          handleGenerateFeedback(messages);
        }
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // ── Handle Call button ────────────────────────────────────────────────────
  const handleCall = async () => {
    if (!userId) {
      diag("handleCall blocked — userId missing");
      return;
    }

    const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
    const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

    diag("handleCall", {
      type,
      vapiToken: vapiToken ? `✓ ${vapiToken.slice(0, 8)}…` : "✗ MISSING",
      workflowId: workflowId ? `✓ ${workflowId.slice(0, 8)}…` : "✗ MISSING",
      userName,
      userId: userId.slice(0, 8) + "…",
    });

    if (!vapiToken) {
      alert("Configuration error: NEXT_PUBLIC_VAPI_WEB_TOKEN is missing. Add it to Vercel env vars and redeploy.");
      return;
    }

    // Check microphone before starting
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      diag("Mic access granted ✓", { tracks: stream.getTracks().length });
      // Monitor track lifecycle
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          diag("⚠️ Mic track ENDED — this kills the call!", { trackId: track.id });
          callDropReason.current = "mic track ended";
        };
      });
      // Release the test stream (Vapi will open its own)
      stream.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      diag("Mic access DENIED — call will fail", err?.message);
      alert(`Microphone access denied: ${err?.message}\n\nPlease allow microphone access and try again.`);
      return;
    }

    setCallStatus(CallStatus.CONNECTING);

    try {
      if (type === "generate") {
        // Use inline assistant instead of Vapi Workflow to avoid Daily.co ejection issues.
        // The inline assistant has a built-in server tool that calls our own API.
        let baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");

        // If running locally, route Vapi's call to the public Vercel production deployment
        // so Vapi's servers can reach it. Both share the same Firebase db, so it syncs instantly!
        if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
          baseUrl = "https://ai-interview-platform-murex.vercel.app";
          diag("Localhost detected: Routing Vapi tool calls to production URL", { baseUrl });
        }

        diag("Starting Vapi INLINE GENERATOR assistant", { baseUrl });

        const generatorAssistant = makeGeneratorAssistant(userName, userId, baseUrl);
        await vapi.start(generatorAssistant);
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions.map((q) => `- ${q}`).join("\n");
        }
        diag("Starting Vapi ASSISTANT (interview mode)", {
          questionCount: questions?.length ?? 0,
        });

        const customInterviewer = JSON.parse(JSON.stringify(interviewer));
        if (customInterviewer.model?.messages?.[0]?.content) {
          customInterviewer.model.messages[0].content =
            customInterviewer.model.messages[0].content.replace(
              "{{questions}}",
              formattedQuestions
            );
        }
        await vapi.start(customInterviewer);
      }
      diag("vapi.start() resolved — waiting for call-start event");
    } catch (err: any) {
      diag("vapi.start() THREW an error", { message: err?.message, err });
      callDropReason.current = `vapi.start error: ${err?.message}`;
      setCallStatus(CallStatus.INACTIVE);
      alert(`Failed to start call: ${err?.message}`);
    }
  };

  const handleDisconnect = () => {
    diag("User clicked End");
    callDropReason.current = "user ended call";
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="Your profile"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={latestMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {latestMessage}
            </p>
          </div>
        </div>
      )}

      {/* Diagnostic badge — only visible in dev */}
      {process.env.NODE_ENV === "development" && diagInfo && (
        <div className="text-center text-xs text-[#9c6680] mt-2 font-mono bg-[#fdf4f9] px-4 py-1.5 rounded-full border border-[#f0dcea]">
          🔍 {diagInfo}
        </div>
      )}

      {/* Call / End buttons */}
      <div className="w-full flex justify-center mt-6">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            disabled={!userId || callStatus === "CONNECTING"}
            onClick={handleCall}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;