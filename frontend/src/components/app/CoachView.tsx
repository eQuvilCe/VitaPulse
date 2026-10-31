"use client";

import { Lightbulb, RefreshCw, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, Card } from "@/components/ui";
import { chat, dailyTip, rebuildPlan, type ChatMessage } from "@/lib/api-vita";
import { cx } from "@/lib/cx";

import { useAppT } from "./i18n";
import { PageHeader, Skeleton, useLoad } from "./states";

const HISTORY_KEY = "vh-coach-chat";

export default function CoachView() {
  const { t, locale } = useAppT();
  const tip = useLoad(() => dailyTip(locale), [locale]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [rebuilt, setRebuilt] = useState<"idle" | "busy" | "done">("idle");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setMessages(JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]"));
    } catch {
      // Fresh conversation.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Not kept.
    }
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(content: string) {
    const q = content.trim();
    if (!q || thinking) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setText("");
    setThinking(true);
    try {
      const reply = await chat(next.slice(-20), locale);
      setMessages([...next, reply]);
    } catch {
      setMessages([...next, { role: "assistant", content: t.common.error }]);
    } finally {
      setThinking(false);
    }
  }

  async function rebuild() {
    setRebuilt("busy");
    try {
      await rebuildPlan(locale);
      setRebuilt("done");
    } catch {
      setRebuilt("idle");
    }
  }

  return (
    <>
      <PageHeader title={t.coach.title} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-1">
          <Card tone="brand" className="relative overflow-hidden">
            <Lightbulb className="absolute -right-3 -top-3 h-24 w-24 text-brand-100" aria-hidden="true" />
            <p className="relative flex items-center gap-2 text-caption font-semibold text-brand-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t.coach.tip}
            </p>
            {tip.data ? (
              <p className="relative mt-3 font-serif text-[22px] leading-snug text-fg">{tip.data.text}</p>
            ) : (
              <div className="relative mt-3 space-y-2">
                <Skeleton className="h-5 w-full rounded-full" />
                <Skeleton className="h-5 w-2/3 rounded-full" />
              </div>
            )}
          </Card>
          <Card tone="subtle">
            <Button variant="secondary" size="sm" className="w-full" onClick={rebuild} disabled={rebuilt === "busy"}>
              <RefreshCw className={cx("h-4 w-4", rebuilt === "busy" && "animate-spin")} aria-hidden="true" />
              {rebuilt === "done" ? t.plan.rebuilt : rebuilt === "busy" ? t.plan.rebuilding : t.coach.rebuild}
            </Button>
          </Card>
        </div>

        <Card padded={false} className="flex h-[min(640px,calc(100vh-220px))] min-h-[420px] min-w-0 flex-col lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-heading">{t.coach.chat}</h2>
          </div>
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
            <Bubble role="assistant">{t.coach.hello}</Bubble>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ))}
            {thinking && (
              <Bubble role="assistant">
                <span className="inline-flex items-center gap-1" aria-label={t.coach.thinking}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </span>
              </Bubble>
            )}
          </div>
          {messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 sm:flex-wrap sm:px-5">
              {t.coach.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-caption font-semibold text-fg-muted transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-end gap-2 border-t border-line p-3 sm:p-4"
          >
            <label className="sr-only" htmlFor="coach-input">
              {t.coach.placeholder}
            </label>
            <textarea
              id="coach-input"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              placeholder={t.coach.placeholder}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-field border border-line-strong bg-surface px-4 py-2.5 text-body text-fg outline-none transition-[border-color,box-shadow] placeholder:text-fg-subtle focus:border-brand-500 focus:shadow-focus"
            />
            <Button type="submit" aria-label={t.coach.send} disabled={!text.trim() || thinking} className="h-11 w-11 shrink-0 px-0">
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
          <p className="px-4 pb-3 text-[11px] text-fg-subtle sm:px-5">{t.coach.disclaimer}</p>
        </Card>
      </div>
    </>
  );
}

function Bubble({ role, children }: { role: ChatMessage["role"]; children: React.ReactNode }) {
  return (
    <div className={cx("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[85%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-body",
          role === "user" ? "rounded-br-md bg-brand-700 text-white" : "rounded-bl-md bg-subtle text-fg",
        )}
      >
        {children}
      </div>
    </div>
  );
}
