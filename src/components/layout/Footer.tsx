import Link from "next/link";
import { Zap, Shield } from "lucide-react";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <Container>
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold tracking-tight">
                SOVEREIGN AI
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              AI-powered marketing automation for local service businesses.
              16 AI systems working 24/7 to grow your revenue.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <p className="font-semibold text-foreground">Product</p>
              <Link href="/audit" className="block text-muted-foreground transition-colors hover:text-foreground">
                Free Audit
              </Link>
              <Link href="/marketplace" className="block text-muted-foreground transition-colors hover:text-foreground">
                Services
              </Link>
              <Link href="/#pricing" className="block text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-semibold text-foreground">Company</p>
              <Link href="/#services" className="block text-muted-foreground transition-colors hover:text-foreground">
                How It Works
              </Link>
              <Link href="/dashboard" className="block text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/onboarding" className="block text-muted-foreground transition-colors hover:text-foreground">
                Get Started
              </Link>
            </div>
          </div>

          {/* Trust */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              30-Day Money-Back Guarantee
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              No Long-Term Contracts
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              256-Bit Data Encryption
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sovereign AI. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
