import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScoreCircle } from "@/components/audit/ScoreCircle";

const meta: Meta<typeof ScoreCircle> = {
  title: "Components/ScoreCircle",
  component: ScoreCircle,
  argTypes: {
    score: { control: { type: "range", min: 0, max: 100 } },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};
export default meta;

type Story = StoryObj<typeof ScoreCircle>;

export const HighScore: Story = {
  args: { score: 85, size: "lg" },
};

export const MidScore: Story = {
  args: { score: 52, size: "lg" },
};

export const LowScore: Story = {
  args: { score: 28, size: "lg" },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
      <ScoreCircle score={75} size="sm" />
      <ScoreCircle score={75} size="md" />
      <ScoreCircle score={75} size="lg" />
    </div>
  ),
};
