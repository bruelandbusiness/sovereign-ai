import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { BookOpen, Home } from "lucide-react";

export default function BlogNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      <Header />
      <main
        id="main-content"
        className="relative flex flex-1 items-center justify-center py-20"
        role="main"
        aria-labelledby="blog-not-found-heading"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/50 blur-[100px]" />
        </div>
        <Container>
          <div className="mx-auto max-w-xl text-center">
            <p
              className="text-[8rem] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 select-none"
              aria-hidden="true"
            >
              404
            </p>

            <h1
              id="blog-not-found-heading"
              className="mt-2 text-2xl font-bold text-white"
            >
              Article not found
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              The blog post you&apos;re looking for doesn&apos;t exist or may
              have been moved. Browse our latest articles or head back to the
              home page.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-muted hover:scale-105 hover:shadow-lg hover:shadow-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <BookOpen className="h-4 w-4" />
                Browse Blog
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
