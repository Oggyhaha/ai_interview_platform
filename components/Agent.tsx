"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer, INTERVIEWER_PERSONAS } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { InterviewerPersonaId } from "@/types";

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

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  personaId = "supportive",
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latestMessage, setLatestMessage] = useState<string>("");
  const [activePersona, setActivePersona] = useState<InterviewerPersonaId>(personaId);

  const selectedPersonaObj = INTERVIEWER_PERSONAS.find((p) => p.id === activePersona) || INTERVIEWER_PERSONAS[0];

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log("Vapi emitted call-end event");
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("Vapi error event emitted:", error);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    const handler = () => console.log("Page is unloading (refresh/nav)");
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLatestMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      if (messages.length === 0) {
        console.log("No transcript found. Returning to home.");
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
        console.error("Error saving feedback:", error);
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
      const timeout = setTimeout(() => {
        if (type === "generate") {
          router.push("/");
        } else {
          handleGenerateFeedback(messages);
        }
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    if (!userId) {
      console.log("userId missing - wait for auth to load");
      return;
    }

    // Guard: catch missing NEXT_PUBLIC env vars (baked in at build time)
    const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
    const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

    if (!vapiToken) {
      console.error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not set!");
      alert("Configuration error: NEXT_PUBLIC_VAPI_WEB_TOKEN is missing. Add it to Vercel environment variables and redeploy.");
      return;
    }

    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      if (!workflowId) {
        console.error("NEXT_PUBLIC_VAPI_WORKFLOW_ID is not set!");
        alert("Configuration error: NEXT_PUBLIC_VAPI_WORKFLOW_ID is missing. Add it to Vercel environment variables and redeploy.");
        setCallStatus(CallStatus.INACTIVE);
        return;
      }
      await vapi.start(workflowId, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      // Manually inject questions & persona style into assistant content
      const customInterviewer = JSON.parse(JSON.stringify(interviewer));
      if (customInterviewer.model?.messages?.[0]?.content) {
        customInterviewer.model.messages[0].content = `${selectedPersonaObj.systemPromptModifier}\n\n` + 
          customInterviewer.model.messages[0].content.replace(
            "{{questions}}",
            formattedQuestions
          );
      }
      await vapi.start(customInterviewer);
    }
  };

  const handleDisconnect = () => {
    console.log("User clicked End -> stopping Vapi");
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      {type === "interview" && callStatus === "INACTIVE" && (
        <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-stone-100 shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-stone-900">Select Interviewer Persona</h4>
            <span className="text-xs font-semibold px-3 py-1 bg-[#89023E]/10 text-[#89023E] rounded-full">
              {selectedPersonaObj.badge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INTERVIEWER_PERSONAS.map((persona) => {
              const isSelected = persona.id === activePersona;
              return (
                <div
                  key={persona.id}
                  onClick={() => setActivePersona(persona.id as InterviewerPersonaId)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative",
                    isSelected
                      ? "border-[#89023E] bg-[#89023E]/5 shadow-sm"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-[#89023E]">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-stone-900">{persona.name}</h5>
                      <p className="text-xs text-stone-500 font-medium">{persona.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>{type === "interview" ? selectedPersonaObj.name : "AI Setup Agent"}</h3>
          <p className="text-xs text-stone-500 font-medium">
            {type === "interview" ? selectedPersonaObj.title : "Voice Assistant"}
          </p>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

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

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            disabled={!userId || callStatus === "CONNECTING"}
            onClick={handleCall}
          >            <span
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
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;