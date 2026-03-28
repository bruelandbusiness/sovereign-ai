import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  Search,
  Home,
  Layers,
  CreditCard,
  LifeBuoy,
  ArrowRight,
} from "lucide-react";

const popularLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Services", href: "/services", icon: Layers },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      <Header />
      <main id="main-content" className="relative flex flex-1 items-center justify-center py-20" role="main" aria-labelledby="not-found-heading">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/50 blur-[100px]" />
        </div>
        <Container>
          <div className="mx-auto max-w-xl text-center">
            {/* Large 404 */}
            <p className="text-[8rem] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 float-gentle select-none">
              404
            </p>

            <h1 id="not-found-heading" className="mt-2 text-2xl font-bold text-white">
              Page not found
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Try searching or visit one of the links below.
            </p>

            {/* Search suggestion */}
            <div className="mt-8 mx-auto max-w-sm">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Try searching for what you need on our{" "}
                  <Link href="/" className="text-white underline underline-offset-2 hover:text-foreground/80">
                    home page
                  </Link>
                </p>
              </div>
            </div>

            {/* Popular links */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {popularLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-5 transition-all duration-200 hover:border-border hover:bg-secondary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-white" />
                    <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-white">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Go home CTA */}
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-muted hover:scale-105 hover:shadow-lg hover:shadow-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Go Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
