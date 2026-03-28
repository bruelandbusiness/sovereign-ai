"use client";

export function BlogContent({ content }: { content: string }) {
  // Simple markdown-like renderer for blog content
  const paragraphs = content.split("\n\n");

  return (
    <div className="prose-custom space-y-4">
      {paragraphs.map((paragraph, i) => {
        const trimmed = paragraph.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-8 font-display text-xl font-bold">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-10 font-display text-2xl font-bold">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("- ")) {
          const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
          return (
            <ul key={i} className="list-disc space-y-1 pl-6 text-muted-foreground">
              {items.map((item, j) => (
                <li key={j}>{item.slice(2)}</li>
              ))}
            </ul>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        // Bold text
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold text-foreground">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
