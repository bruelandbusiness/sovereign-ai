import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Confetti } from "@/components/ui/Confetti";

const meta: Meta<typeof Confetti> = {
  title: "UI/Confetti",
  component: Confetti,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, minHeight: 300 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Confetti>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState(false);

    const handleClick = () => {
      setActive(false);
      requestAnimationFrame(() => setActive(true));
    };

    return (
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleClick}
          style={{
            background: "linear-gradient(to right, #4c85ff, #22d3a1)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 32px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Celebrate!
        </button>
        <Confetti active={active} />
      </div>
    );
  },
};
