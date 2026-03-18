import Link from "next/link";
import { Shield } from "lucide-react";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <Container>
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <SovereignLogo variant="wordmark" size="xs" />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              AI-powered marketing automation for local service businesses.
              16 AI systems working 24/7 to grow your revenue.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-4 text-xs">
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
              <Link href="/demo" className="block text-muted-foreground transition-colors hover:text-foreground">
                Live Demo
              </Link>
              <Link href="/results" className="block text-muted-foreground transition-colors hover:text-foreground">
                Case Studies
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-semibold text-foreground">Company</p>
              <Link href="/about" className="block text-muted-foreground transition-colors hover:text-foreground">
                About Us
              </Link>
              <Link href="/blog" className="block text-muted-foreground transition-colors hover:text-foreground">
                Blog
              </Link>
              <Link href="/guarantee" className="block text-muted-foreground transition-colors hover:text-foreground">
                Guarantee
              </Link>
              <Link href="/faq" className="block text-muted-foreground transition-colors hover:text-foreground">
                FAQ
              </Link>
              <Link href="/changelog" className="block text-muted-foreground transition-colors hover:text-foreground">
                Changelog
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-semibold text-foreground">Legal</p>
              <Link href="/legal/privacy" className="block text-muted-foreground transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="block text-muted-foreground transition-colors hover:text-foreground">
                Terms
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
