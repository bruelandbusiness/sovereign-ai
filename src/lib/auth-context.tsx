"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Sentry from "@sentry/nextjs";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  client: {
    id: string;
    businessName: string;
    ownerName: string;
    vertical: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        const sessionUser: SessionUser | null = data.user;
        setUser(sessionUser);

        // Associate errors with the authenticated user in Sentry.
        // PII (email, name) is stripped by beforeSend — only id survives.
        if (sessionUser) {
          Sentry.setUser({ id: sessionUser.id });
          Sentry.setTag("user.role", sessionUser.role);
          if (sessionUser.client) {
            Sentry.setTag("client.vertical", sessionUser.client.vertical ?? "unknown");
            Sentry.setTag("client.id", sessionUser.client.id);
          }
        } else {
          Sentry.setUser(null);
        }
      } else {
        setUser(null);
        Sentry.setUser(null);
      }
    } catch {
      setUser(null);
      Sentry.setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    Sentry.setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <SessionContext.Provider value={{ user, isLoading, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
