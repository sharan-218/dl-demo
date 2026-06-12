"use client";

import { useState, useRef, useEffect } from "react";
import { DecisionBadge } from "./decision-badge";
import type { DecisionResult, ExtractedContext } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  decision?: DecisionResult;
  extracted?: ExtractedContext;
}

const EXAMPLE_QUERIES = [
  "Can we give Acme Corp a 40% discount?",
  "Should we hire another frontend engineer at $140k?",
  "Can we spend $15k on marketing this month?",
  "Should we onboard CloudHost as our new vendor?",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(text?: string) {
    const query = text ?? input;
    if (!query.trim() || loading) return;

    setInput("");
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: data.decision?.explanation ?? "Could not process request",
        decision: data.decision,
        extracted: data.extracted,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: "assistant",
          content: "Error processing request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">AI Startup COO</h2>
              <p className="text-[var(--muted-foreground)] max-w-md">
                Ask me about discounts, hiring, spending, or vendor decisions.
                I&apos;ll evaluate your request against company policies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="text-left p-3 rounded-lg border bg-[var(--card)] hover:bg-[var(--accent)] transition-colors text-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-2xl rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--card)] border"
              }`}
            >
              <p className="text-sm">{msg.content}</p>

              {/* Show extracted context */}
              {msg.extracted && (
                <div className="mt-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-mono">
                  <div className="font-semibold mb-1 text-[var(--muted-foreground)]">
                    Extracted Facts ({msg.extracted.category})
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(msg.extracted.fields, null, 2)}
                  </pre>
                </div>
              )}

              {/* Show decision result */}
              {msg.decision && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <DecisionBadge outcome={msg.decision.outcome} />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Policy: {msg.decision.policy_version}
                    </span>
                  </div>

                  {msg.decision.trace.length > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-[var(--muted-foreground)]">Evaluation Trace:</div>
                      {msg.decision.trace.map((t, i) => (
                        <div key={i} className="font-mono">
                          {t.field} {t.op} {t.rhs_value} → actual: {t.actual}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-[var(--muted-foreground)]">
                    Audit ID: {msg.decision.decision_id}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--card)] border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span className="animate-pulse">●</span>
                Evaluating policy...
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-3 max-w-3xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Can we give Acme Corp a 40% discount?"
            className="flex-1 px-4 py-2.5 rounded-lg border bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
