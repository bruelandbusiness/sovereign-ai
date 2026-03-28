"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  Loader2,
  Bot,
  ArrowRight,
} from "lucide-react";
import {
  MARKETING_GREETING,
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

interface LeadInfo {
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Route guard — hide the widget on authenticated app pages
// ---------------------------------------------------------------------------

const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/onboarding"];

function useIsPublicPage(): boolean {
  const pathname = usePathname();
  return !HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Lead capture form
// ---------------------------------------------------------------------------

interface LeadCaptureFormProps {
  onSubmit: (info: LeadInfo) => void;
  primaryColor: string;
}

function LeadCaptureForm({ onSubmit, primaryColor }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        setError("Please enter your name.");
        return;
      }
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      setError("");
      onSubmit({ name: trimmedName, email: trimmedEmail });
    },
    [name, email, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Before we chat, who do I have the pleasure of speaking with? 😊
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="chat-name" className="text-xs font-medium text-foreground">
          Your name
        </label>
        <input
          id="chat-name"
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mike Johnson"
          autoComplete="name"
          className="rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-base outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 sm:text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="chat-email" className="text-xs font-medium text-foreground">
          Your email
        </label>
        <input
          id="chat-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mike@hvacpro.com"
          autoComplete="email"
          className="rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-base outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 sm:text-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        Start chatting
        <ArrowRight className="h-4 w-4" />
      </button>

      <p className="text-center text-xs text-muted-foreground">
        No spam, ever. We respect your privacy.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketingChatbot() {
  const isPublicPage = useIsPublicPage();

  const [isOpen, setIsOpen] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus the input when the user enters the chat panel
  useEffect(() => {
    if (isOpen && leadInfo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, leadInfo]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleLeadSubmit = useCallback((info: LeadInfo) => {
    setLeadInfo(info);
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: MARKETING_GREETING,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !leadInfo) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Build history from current messages (exclude the greeting for brevity;
    // keep the last 20 turns to stay within token budget)
    const historyForApi = messages
      .filter((m) => m.id !== "greeting")
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/marketing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          leadName: leadInfo.name,
          leadEmail: leadInfo.email,
          history: historyForApi,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data: { reply: string; conversationId: string } = await res.json();

      if (data.conversationId && !conversationId) {
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
          content:
            "Sorry, something went wrong. Please try again or [book a free call](/strategy-call).",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, messages, leadInfo]);

  // Don't render anything on dashboard / admin pages
  if (!isPublicPage) return null;

  return (
    <>
      {/* Floating chat bubble — shown when panel is closed */}
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
            aria-label="Chat with Sovereign AI"
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
            className="fixed z-50 flex flex-col overflow-hidden border border-border/40 bg-background shadow-2xl bottom-0 right-0 left-0 rounded-t-2xl sm:bottom-6 sm:right-6 sm:left-auto sm:w-[400px] sm:rounded-2xl"
            style={{ height: "min(580px, calc(100vh - 80px))", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between px-4 py-3"
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
                  <p className="text-xs text-white/70">AI Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body: lead capture OR conversation */}
            {!leadInfo ? (
              <div className="flex-1 overflow-y-auto">
                <LeadCaptureForm
                  onSubmit={handleLeadSubmit}
                  primaryColor={MARKETING_PRIMARY_COLOR}
                />
              </div>
            ) : (
              <>
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                  aria-live="polite"
                  aria-relevant="additions"
                >
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
                      role="status"
                      aria-label="Sovereign AI is typing"
                    >
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" aria-hidden="true" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" aria-hidden="true" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" aria-hidden="true" />
                      <span className="sr-only">Sovereign AI is typing a response</span>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-border/40 p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Ask about pricing, services..."
                      aria-label="Type your message"
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-base outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 sm:text-sm"
                      style={{ maxHeight: "100px" }}
                    />
                    <button
                      onClick={() => void handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40 transition-opacity"
                      style={{ backgroundColor: MARKETING_PRIMARY_COLOR }}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="shrink-0 border-t border-border/40 px-4 py-2 text-center">
              <span className="text-xs text-muted-foreground">
                Powered by Sovereign AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
