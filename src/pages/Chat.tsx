import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";

import { useAuthStore } from "@/hooks/useStore";
import { useRealtimeMessages } from "@/hooks/useRealtime";
import { getMessages, sendMessage } from "@/lib/api";
import type { Message } from "@/types";
import { SmoothInput } from "@/components/ui/smooth-input";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const newMsg = useRealtimeMessages(rideId || "");

  useEffect(() => {
    async function load() {
      if (!rideId) return;
      try {
        setMessages(await getMessages(rideId));
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [rideId]);

  useEffect(() => {
    if (newMsg) setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
  }, [newMsg]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !rideId || !text.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage({ ride_id: rideId, sender_id: user.id, message: text.trim() });
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background" style={{ height: "calc(100dvh - 64px)" }}>
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="grid size-9 place-items-center rounded-xl bg-muted text-foreground transition-colors hover:bg-muted2"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-strong">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h2 className="font-display font-bold text-foreground">Ride chat</h2>
            <p className="text-xs text-muted-foreground">Real-time messaging</p>
          </div>
        </div>

        {/* messages */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-muted/30 p-4">
          {messages.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 size-10 opacity-20" />
              <p className="text-sm">No messages yet</p>
              <p className="mt-1 text-xs">Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] px-4 py-2.5 text-sm shadow-sm",
                    isMe
                      ? "rounded-[16px_16px_4px_16px] bg-primary text-primary-foreground"
                      : "rounded-[16px_16px_16px_4px] border border-border bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={cn("mt-1 text-right text-[10px]", isMe ? "text-white/70" : "text-muted-foreground")}>
                    {format(new Date(msg.created_at), "h:mm a")}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <div className="flex items-center gap-2 border-t border-border bg-background/95 p-3 backdrop-blur">
          <SmoothInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            wrapperClassName="flex-1"
            aria-label="Chat message"
          />
          <Button size="md" onClick={handleSend} disabled={!text.trim() || sending} loading={sending} aria-label="Send" className="!px-3.5">
            {!sending && <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
