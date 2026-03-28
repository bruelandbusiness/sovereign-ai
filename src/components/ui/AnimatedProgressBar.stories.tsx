import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AnimatedProgressBar } from "@/components/ui/AnimatedProgressBar";

const meta: Meta<typeof AnimatedProgressBar> = {
  title: "UI/AnimatedProgressBar",
  component: AnimatedProgressBar,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div style={{ background: "#0a0a0f", padding: 32, maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AnimatedProgressBar>;

export const Default: Story = {
  args: {
    value: 65,
    label: "Storage Used",
    variant: "gradient",
  },
};

export const Full: Story = {
  args: {
    value: 100,
    label: "Upload Complete",
    variant: "success",
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AnimatedProgressBar value={72} label="Gradient" variant="gradient" />
      <AnimatedProgressBar value={85} label="Success" variant="success" />
      <AnimatedProgressBar value={45} label="Warning" variant="warning" />
      <AnimatedProgressBar value={28} label="Danger" variant="danger" />
      <AnimatedProgressBar value={60} label="Default" variant="default" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AnimatedProgressBar value={50} label="Small" size="sm" variant="gradient" />
      <AnimatedProgressBar value={50} label="Medium" size="md" variant="gradient" />
      <AnimatedProgressBar value={50} label="Large" size="lg" variant="gradient" />
    </div>
  ),
};
