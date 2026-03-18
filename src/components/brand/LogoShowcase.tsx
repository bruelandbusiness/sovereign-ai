"use client";

import { SovereignLogo } from "@/components/brand/SovereignLogo";

interface LogoCardProps {
  label: string;
  bg: string;
  children: React.ReactNode;
}

function LogoCard({ label, bg, children }: LogoCardProps) {
  return (
    <div className="card-hover-lift rounded-xl border border-white/10 overflow-hidden">
      <div className={`flex h-32 items-center justify-center ${bg}`}>
        {children}
      </div>
      <div className="border-t border-white/10 bg-white/5 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function LogoShowcase() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Mark variants */}
      <LogoCard label="Mark — Gradient" bg="bg-[#0a0a0f]">
        <SovereignLogo variant="mark" size="xl" color="gradient" />
      </LogoCard>
      <LogoCard label="Mark — White" bg="bg-[#0a0a0f]">
        <SovereignLogo variant="mark" size="xl" color="white" />
      </LogoCard>
      <LogoCard label="Mark — Dark" bg="bg-gray-200">
        <SovereignLogo variant="mark" size="xl" color="dark" />
      </LogoCard>

      {/* Wordmark variants */}
      <LogoCard label="Wordmark — Gradient" bg="bg-[#0a0a0f]">
        <SovereignLogo variant="wordmark" size="lg" color="gradient" />
      </LogoCard>
      <LogoCard label="Wordmark — White" bg="bg-[#0a0a0f]">
        <SovereignLogo variant="wordmark" size="lg" color="white" />
      </LogoCard>
      <LogoCard label="Wordmark — Dark" bg="bg-gray-200">
        <SovereignLogo variant="wordmark" size="lg" color="dark" />
      </LogoCard>

      {/* Logotype variant */}
      <LogoCard label="Logotype — Gradient" bg="bg-[#0a0a0f]">
        <SovereignLogo variant="logotype" size="lg" color="gradient" />
      </LogoCard>
    </div>
  );
}
