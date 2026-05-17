"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

export function DealChat({
  dealId,
  currentUserId,
  approved = true,
}: {
  dealId: string;
  currentUserId: string;
  approved?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!approved) {
      return;
    }

    const supabase = createClient();
    let active = true;

    async function loadMessages() {
      const response = await fetch(`/api/messages/${dealId}`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { messages: Message[] };
      if (active) {
        setMessages(payload.messages);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`deal-chat-${dealId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `deal_id=eq.${dealId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [approved, dealId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    setBody("");
    const response = await fetch(`/api/messages/${dealId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { message: Message };
      setMessages((current) =>
        current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message],
      );
    }
  }

  if (!approved) {
    return (
      <div className="border border-border bg-[rgba(7,15,26,0.72)] p-6 text-center text-cream2">
        Deal chat unlocks after mutual NDA approval.
      </div>
    );
  }

  return (
    <section className="border border-border bg-[rgba(7,15,26,0.88)] p-4">
      <div className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-2">
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <Avatar seed={message.sender_id} />}
              <div
                className={`max-w-[78%] border px-4 py-3 text-lg leading-6 ${
                  mine ? "border-gold-dim bg-gold-dim text-cream" : "border-border bg-ink2 text-cream2"
                }`}
              >
                {message.body}
              </div>
              {mine && <Avatar seed="You" />}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-3">
        <textarea
          className="auth-input min-h-16 flex-1 font-body text-lg"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Write a message..."
        />
        <button
          type="button"
          className="btn-liquid self-stretch px-5 font-mono text-xs uppercase tracking-[0.16em]"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </section>
  );
}

function Avatar({ seed }: { seed: string }) {
  const initials = seed
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-dim font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
      {initials || "TP"}
    </div>
  );
}
