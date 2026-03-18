import { cn } from "@/lib/utils";

interface TypeSpecimenProps {
  name: string;
  fontClass: string;
  description: string;
  weights: { label: string; value: string }[];
}

export function TypeSpecimen({ name, fontClass, description, weights }: TypeSpecimenProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
      {/* Font name rendered in the actual font */}
      <div>
        <h3 className={cn("text-2xl font-bold text-foreground", fontClass)}>{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Pangram */}
      <p className={cn("text-lg text-foreground/80 leading-relaxed", fontClass)}>
        The quick brown fox jumps over the lazy dog.
      </p>

      {/* Weights */}
      <div className="flex flex-wrap gap-3">
        {weights.map((w) => (
          <span
            key={w.value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs",
              fontClass
            )}
            style={{ fontWeight: Number(w.value) }}
          >
            <span className="text-foreground">{w.label}</span>
            <span className="text-muted-foreground">{w.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
