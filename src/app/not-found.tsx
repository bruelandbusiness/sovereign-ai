import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center py-20">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <p className="text-7xl font-bold gradient-text">404</p>
            <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Go Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
