"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  Loader2,
  Bot,
} from "lucide-react";
import {
  MARKETING_CHATBOT_ID,
  MARKETING_GREETING,
  MARKETING_SYSTEM_PROMPT,
  MARKETING_PRIMARY_COLOR,
} from "@/lib/marketing-chatbot-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Show greeting on first open
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: MARKETING_GREETING,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/services/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: MARKETING_CHATBOT_ID,
          message: userMessage.content,
          conversationId,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again or contact us directly.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId]);

  return (
    <>
      {/* Chat bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: MARKETING_PRIMARY_COLOR }}
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Chat with Sovereign AI"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex w-[400px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-border/40 bg-background shadow-2xl"
            style={{ height: "min(550px, calc(100vh - 100px))" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: MARKETING_PRIMARY_COLOR }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Sovereign AI
                  </p>
                  <p className="text-[10px] text-white/70">
                    AI Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Minimize"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" aria-relevant="additions">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={
                    msg.role === "user"
                      ? "ml-auto max-w-[80%]"
                      : "mr-auto max-w-[80%]"
                  }
                >
                  <div
                    className={
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm border border-border/40 bg-muted/30 px-3.5 py-2.5 text-sm"
                    }
                    style={
                      msg.role === "user"
                        ? { backgroundColor: MARKETING_PRIMARY_COLOR }
                        : undefined
                    }
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border/40 bg-muted/30 px-4 py-3"
                >
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about our services, pricing..."
                  aria-label="Type your message"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  style={{ maxHeight: "100px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: MARKETING_PRIMARY_COLOR }}
                  aria-label="Send"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/40 px-4 py-2 text-center">
              <span className="text-[10px] text-muted-foreground">
                Powered by Sovereign AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
