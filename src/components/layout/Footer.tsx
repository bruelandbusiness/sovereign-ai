import Link from "next/link";
import { Zap } from "lucide-react";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display text-sm font-bold tracking-tight">
              SOVEREIGN AI
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/audit"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Free Audit
            </Link>
            <Link
              href="/marketplace"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Services
            </Link>
            <Link
              href="/#pricing"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sovereign AI. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
