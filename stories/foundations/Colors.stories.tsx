import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const colors = [
  { name: "Background", var: "--background", value: "#0a0a0f" },
  { name: "Card", var: "--card", value: "#101018" },
  { name: "Primary", var: "--primary", value: "#4c85ff" },
  { name: "Accent", var: "--accent", value: "#22d3a1" },
  { name: "Destructive", var: "--destructive", value: "#ef4444" },
  { name: "Warning", var: "--warning", value: "#f5a623" },
  { name: "Foreground", var: "--foreground", value: "#ececef" },
  { name: "Muted Foreground", var: "--muted-foreground", value: "#858590" },
  { name: "Border", var: "--border", value: "rgba(255,255,255,0.08)" },
];

function ColorPalette() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>
        Sovereign AI Color Palette
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {colors.map((c) => (
          <div
            key={c.name}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ height: 80, background: c.value }} />
            <div style={{ padding: 12, background: "#101018" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{c.value}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{c.var}</div>
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 32, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
        Gradient
      </h3>
      <div
        style={{
          height: 80,
          borderRadius: 12,
          background: "linear-gradient(135deg, #4c85ff, #22d3a1)",
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.5 }}>
        linear-gradient(135deg, #4c85ff, #22d3a1)
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Foundations/Colors",
  component: ColorPalette,
};
export default meta;

type Story = StoryObj;
export const Default: Story = {};
